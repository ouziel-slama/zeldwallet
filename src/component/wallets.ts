import satsConnect, { AddressPurpose as SatsPurpose, BitcoinNetworkType, getAddress, signMessage as satsSignMessage, signTransaction, MessageSigningProtocols, type BitcoinProvider } from 'sats-connect';
import type { AddressInfo, AddressType, NetworkType, SignInputOptions } from '../types';
import { DEFAULT_PROVIDER } from './constants';

// Import wallet logos as assets (Vite handles these as URLs)
import XVERSE_ICON from './logos/xverse.png';
import LEATHER_ICON from './logos/leather.png';
import MAGIC_EDEN_ICON from './logos/magiceden.png';

export type SupportedWalletId = 'zeld' | 'xverse' | 'leather' | 'magicEden';

export type WalletOptionState = {
  id: SupportedWalletId;
  name: string;
  description: string;
  icon: string;
  installed: boolean;
  installUrl?: string;
};

export type WalletDiscovery = {
  options: WalletOptionState[];
  entries: Partial<Record<SupportedWalletId, WalletEntry>>;
};

export type WalletEntry = {
  id: string;
  name: string;
  icon?: string;
  provider?: unknown;
  getProvider?: () => unknown | Promise<unknown>;
};

export type ExternalWalletSession = {
  id: SupportedWalletId;
  name: string;
  addresses: AddressInfo[];
  network: NetworkType;
  provider?: unknown;
  signMessage: (message: string, address: string, protocol?: 'ecdsa' | 'bip322-simple') => Promise<string>;
  signPsbt?: (psbtBase64: string, inputs: SignInputOptions[]) => Promise<string>;
};

export class WrongNetworkError extends Error {
  code = 'wrong-network' as const;
  expected: NetworkType | string;
  received?: NetworkType | string;

  constructor(expected: NetworkType | string, received?: NetworkType | string) {
    const detail = received ? ` Expected ${expected} but received ${received}.` : '';
    super(`Wrong network.${detail}`);
    this.name = 'WrongNetworkError';
    this.expected = expected;
    this.received = received;
    Object.setPrototypeOf(this, WrongNetworkError.prototype);
  }
}

const codedError = (message: string, code: string): Error => Object.assign(new Error(message), { code });

type AddressLike = Partial<AddressInfo> & { path?: string };

export const FALLBACK_ICON =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="%23eef2f7"/><path d="M9 21l4-6 3 4 3-5 4 7" stroke="%232563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="11" r="2" fill="%232563eb"/></svg>';

const CATALOG: Record<SupportedWalletId, Omit<WalletOptionState, 'installed'>> = {
  zeld: {
    id: 'zeld',
    name: 'ZeldWallet',
    description: 'In-browser • Zero-install • Built for ZeldHash',
    icon: DEFAULT_PROVIDER.icon,
  },
  xverse: {
    id: 'xverse',
    name: 'Xverse',
    description: 'Popular • Full-featured • Ledger support',
    icon: XVERSE_ICON,
    installUrl: 'https://www.xverse.app/download',
  },
  leather: {
    id: 'leather',
    name: 'Leather',
    description: 'Open-source • Minimalist • Audited',
    icon: LEATHER_ICON,
    installUrl: 'https://leather.io',
  },
  magicEden: {
    id: 'magicEden',
    name: 'Magic Eden',
    description: 'Built-in marketplace • Rare sats • Collectors',
    icon: MAGIC_EDEN_ICON,
    installUrl: 'https://magiceden.io/wallet',
  },
};

const buildNetworkParams = (network: NetworkType): { type: BitcoinNetworkType } => ({
  type: network === 'testnet' ? BitcoinNetworkType.Testnet : BitcoinNetworkType.Mainnet,
});

const normalizeAddress = (address: AddressLike, fallbackPurpose: 'payment' | 'ordinals'): AddressInfo => ({
  address: address.address ?? '',
  publicKey: address.publicKey ?? '',
  purpose: (address.purpose as AddressInfo['purpose']) ?? fallbackPurpose,
  addressType: (address.addressType as AddressType) ?? 'p2wpkh',
  derivationPath: address.derivationPath ?? address.path ?? '',
});

const normalizeAddresses = (addresses: AddressLike[], defaultNetwork: NetworkType): { list: AddressInfo[]; network: NetworkType } => {
  const list = addresses.map((addr, idx) => normalizeAddress(addr, idx === 0 ? 'payment' : 'ordinals'));
  return { list, network: defaultNetwork };
};

const detectNetworkFromAddress = (value?: string): NetworkType | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('tb1') || lower.startsWith('bcrt1')) return 'testnet';
  if (lower.startsWith('bc1')) return 'mainnet';
  const first = trimmed[0];
  if (first === 'm' || first === 'n' || first === '2') return 'testnet';
  if (first === '1' || first === '3') return 'mainnet';
  return undefined;
};

const detectNetworkFromAddresses = (addresses: AddressLike[]): { detected?: NetworkType; mixed: boolean } => {
  const networks = new Set<NetworkType>();
  for (const entry of addresses) {
    const net = detectNetworkFromAddress(entry.address);
    if (net) networks.add(net);
  }
  if (networks.size === 1) {
    return { detected: Array.from(networks)[0], mixed: false };
  }
  return { mixed: networks.size > 1, detected: undefined };
};

const ensureNetworkMatches = (addresses: AddressLike[], expected: NetworkType): NetworkType => {
  const { detected, mixed } = detectNetworkFromAddresses(addresses);
  if (mixed) {
    throw new WrongNetworkError(expected, detected);
  }
  if (detected && detected !== expected) {
    throw new WrongNetworkError(expected, detected);
  }
  return detected ?? expected;
};

type JsonRpcResponse = { jsonrpc?: string; error?: unknown; result?: unknown };
type StatusResponse = { status?: string; error?: unknown; result?: unknown };

const normalizeResponse = <T>(resp: T): T | unknown => {
  if (!resp) return resp;
  const jsonRpc = resp as JsonRpcResponse;
  if (jsonRpc.jsonrpc === '2.0') {
    if (jsonRpc.error) throw jsonRpc.error;
    return jsonRpc.result;
  }
  const statusResp = resp as StatusResponse;
  if (statusResp.status === 'error') throw statusResp.error ?? resp;
  if (statusResp.status === 'success') return statusResp.result;
  return resp;
};

const getByPath = (root: Record<string, unknown>, path: string): unknown =>
  path.split('.').reduce((acc: Record<string, unknown> | undefined, part: string) => (acc ? acc[part] as Record<string, unknown> : undefined), root);

const toWalletEntry = (candidate: unknown): WalletEntry | undefined => {
  if (!candidate || typeof candidate !== 'object') return undefined;
  const anyCandidate = candidate as Record<string, unknown>;
  const id = typeof anyCandidate.id === 'string' ? anyCandidate.id : undefined;
  const name = typeof anyCandidate.name === 'string' ? anyCandidate.name : undefined;
  if (!id || !name) return undefined;
  return {
    id,
    name,
    icon: typeof anyCandidate.icon === 'string' ? anyCandidate.icon : undefined,
    getProvider: typeof anyCandidate.getProvider === 'function' ? (anyCandidate.getProvider as () => unknown) : undefined,
    provider: 'provider' in anyCandidate ? anyCandidate.provider : undefined,
  };
};

const discoverFromGlobals = (providers: WalletEntry[], idMatch: RegExp): WalletEntry | undefined =>
  providers.find(
    (p) => idMatch.test(p.id) || idMatch.test(p.name ?? '') || (p.icon && idMatch.test(p.icon))
  );

const discoverLeather = (): WalletEntry | undefined => {
  if (typeof window === 'undefined') return undefined;
  const provider = (window as Record<string, unknown>).LeatherProvider ?? (window as Record<string, unknown>).btc;
  if (!provider) return undefined;
  return {
    id: 'LeatherProvider',
    name: 'Leather',
    icon: (provider as Record<string, unknown>).icon as string | undefined,
    provider,
  };
};

const discoverMagicEden = (): WalletEntry | undefined => {
  if (typeof window === 'undefined') return undefined;
  const magicEden = (window as Record<string, unknown>).magicEden as Record<string, unknown> | undefined;
  const provider = magicEden?.bitcoin;
  if (!provider) {
    return undefined;
  }
  return {
    id: 'magicEden.bitcoin',
    name: 'Magic Eden Wallet',
    icon: (provider as Record<string, unknown>).icon as string | undefined,
    provider,
  };
};

export const discoverWallets = (): WalletDiscovery => {
  const catalogOptions = Object.values(CATALOG);
  if (typeof window === 'undefined') {
    return {
      options: catalogOptions.map((opt) => ({ ...opt, installed: opt.id === 'zeld' })),
      entries: {},
    };
  }

  const providerList = Array.isArray((window as Record<string, unknown>).btc_providers)
    ? ((window as Record<string, unknown>).btc_providers as WalletEntry[])
    : [];
  const leatherEntry = discoverLeather();
  const magicEntry = discoverMagicEden();

  const mergedProviders: WalletEntry[] = [...providerList];
  const addIfMissing = (entry?: WalletEntry) => {
    if (!entry) return;
    if (!mergedProviders.some((p) => p?.id === entry.id)) mergedProviders.push(entry);
  };
  addIfMissing(leatherEntry);
  addIfMissing(magicEntry);

  // Expose merged providers back to sats-connect to avoid "no wallet provider found"
  (window as Record<string, unknown>).btc_providers = mergedProviders;

  const normalizedProviders = mergedProviders
    .map((p) => ({
      ...p,
      getProvider: typeof (p as Record<string, unknown>).getProvider === 'function' ? (p as Record<string, unknown>).getProvider : undefined,
    }))
    .map(toWalletEntry)
    .filter((p): p is WalletEntry => Boolean(p));

  const entries: Partial<Record<SupportedWalletId, WalletEntry>> = {};

  // ZeldWallet is always available via the embedded provider.
  const zeldEntry: WalletEntry = {
    id: DEFAULT_PROVIDER.id,
    name: DEFAULT_PROVIDER.name,
    icon: DEFAULT_PROVIDER.icon,
    provider: (window as Record<string, unknown>)[DEFAULT_PROVIDER.id],
  };
  entries.zeld = zeldEntry;

  const xverseEntry = discoverFromGlobals(normalizedProviders, /xverse/i);
  const resolvedLeather = leatherEntry ?? discoverFromGlobals(normalizedProviders, /leather/i);
  const resolvedMagic = magicEntry ?? discoverFromGlobals(normalizedProviders, /magic.?eden/i);

  if (xverseEntry) entries.xverse = xverseEntry;
  if (resolvedLeather) entries.leather = resolvedLeather;
  if (resolvedMagic) entries.magicEden = resolvedMagic;

  const options = catalogOptions.map((opt) => ({
    ...opt,
    installed:
      opt.id === 'zeld'
        ? true
        : opt.id === 'xverse'
          ? Boolean(entries.xverse)
          : opt.id === 'leather'
            ? Boolean(entries.leather)
            : Boolean(entries.magicEden),
  }));

  return { options, entries };
};

type ProviderInterface = { request?: unknown; getAddresses?: unknown; connect?: unknown };
const providerHasInterface = (candidate: unknown): candidate is ProviderInterface =>
  !!candidate && typeof candidate === 'object';

type ProviderLike = Record<string, unknown> & { request?: (method: string, params?: unknown) => Promise<unknown>; __zw_getInfoShimmed?: boolean };

const buildGetInfoShim = (provider: ProviderLike | undefined): ProviderLike | undefined => {
  if (!provider || typeof provider.request !== 'function') return provider;
  if (provider.__zw_getInfoShimmed) return provider;
  const shimmed: ProviderLike = {
    ...provider,
    request: async (method: string, params?: unknown) => {
      if (method !== 'getInfo') return provider.request!(method, params);
      try {
        return await provider.request!(method, params);
      } catch (err: unknown) {
        const error = err as { code?: number; message?: string };
        const code = error?.code;
        const message = error?.message ?? '';
        const unsupported = code === -32601 || message.includes('getInfo');
        if (!unsupported) throw err;
        return {
          version: '1.0.0',
          platform: 'web',
          methods: ['getAddresses', 'signMessage', 'signPsbt'],
          supports: ['WBIP004', 'WBIP005', 'WBIP006'],
        };
      }
    },
  };
  Object.defineProperty(shimmed, '__zw_getInfoShimmed', { value: true });
  return shimmed;
};

const resolveProvider = async (entry: WalletEntry): Promise<ProviderLike | undefined> => {
  const candidates = [
    await entry.getProvider?.(),
    entry.provider,
    typeof window !== 'undefined' ? getByPath(window as unknown as Record<string, unknown>, entry.id) : undefined,
    typeof window !== 'undefined' ? getByPath(window as unknown as Record<string, unknown>, `${entry.id}.provider`) : undefined,
    (typeof window !== 'undefined' ? (window as Record<string, unknown>)[entry.id] : undefined) as unknown,
    typeof window !== 'undefined' ? (window as Record<string, unknown>)[`${entry.id}.provider`] : undefined,
  ].filter(providerHasInterface);

  const provider = candidates.find(providerHasInterface) as ProviderLike | undefined;
  return buildGetInfoShim(provider);
};

const connectWith = async (
  entry: WalletEntry,
  network: NetworkType,
  requestMessage: string
): Promise<{ provider?: ProviderLike; addresses: AddressLike[] }> => {
  const provider = await resolveProvider(entry);
  const requestFn = typeof provider?.request === 'function' ? provider.request.bind(provider) : undefined;
  const addressParams = {
    purposes: [SatsPurpose.Payment, SatsPurpose.Ordinals],
    network: buildNetworkParams(network),
    message: requestMessage,
  };

  const attempts: Array<{ label: string; fn: () => Promise<unknown> }> = [];

  const isMagicEden = entry.id.toLowerCase().includes('magic');
  const isXverse = entry.id.toLowerCase().includes('xverse') || entry.name?.toLowerCase?.().includes('xverse');
  const isLeather = entry.id.toLowerCase().includes('leather') || entry.name?.toLowerCase?.().includes('leather');

  if (isMagicEden) {
    attempts.push({
      label: 'magicEden.getAddress',
      fn: () =>
        new Promise((resolve, reject) => {
          getAddress({
            getProvider: async () => ((window as Record<string, unknown>).magicEden as Record<string, unknown>)?.bitcoin as BitcoinProvider | undefined,
            payload: {
              purposes: [SatsPurpose.Ordinals, SatsPurpose.Payment],
              message: addressParams.message,
              network: { type: network === 'testnet' ? BitcoinNetworkType.Testnet : BitcoinNetworkType.Mainnet },
            },
            onFinish: (response) => resolve(response),
            onCancel: () => reject(codedError('User cancelled.', 'user-cancelled')),
          });
        }),
    });
  }

  if (isLeather && requestFn) {
    const leatherParams = { purposes: addressParams.purposes };
    attempts.push({
      label: 'leather.request(getAddresses, simple)',
      fn: () => requestFn('getAddresses', leatherParams),
    });
    attempts.push({
      label: 'leather.request(getAddresses, empty)',
      fn: () => requestFn('getAddresses', {}),
    });
  }

  if (isXverse) {
    // Xverse prefers the sats-connect getAddress helper; wallet_connect with params
    // can throw "Invalid parameters" in newer builds.
    attempts.push({
      label: 'xverse.getAddress',
      fn: () =>
        new Promise((resolve, reject) => {
          getAddress({
            getProvider: async () => provider as BitcoinProvider | undefined,
            payload: {
              purposes: addressParams.purposes,
              message: addressParams.message,
              network: addressParams.network,
            },
            onFinish: (response) => resolve(response),
            onCancel: () => reject(codedError('User cancelled.', 'user-cancelled')),
          });
        }),
    });
  }

  if (requestFn) {
    attempts.push({
      label: 'request(getAddresses)',
      fn: () => requestFn('getAddresses', addressParams),
    });
    // Note: Some older wallets might expect JSON-RPC style params with method inside,
    // but the standard sats-connect requestFn signature is (method: string, params?: unknown).
    // Skipping non-standard invocation patterns to satisfy TypeScript types.
  }

  const providerWithMethods = provider as ProviderLike & { connect?: (params: unknown) => Promise<unknown>; getAddresses?: (params: unknown) => Promise<unknown> } | undefined;
  if (typeof providerWithMethods?.connect === 'function') {
    attempts.push({
      label: 'connect+getAddresses',
      fn: async () => {
        await providerWithMethods.connect!(addressParams);
        if (typeof providerWithMethods.getAddresses === 'function') return providerWithMethods.getAddresses(addressParams);
        return requestFn?.('getAddresses', addressParams);
      },
    });
  }

  if (typeof providerWithMethods?.getAddresses === 'function') {
    attempts.push({ label: 'provider.getAddresses', fn: () => providerWithMethods.getAddresses!(addressParams) });
  }

  const scRequest = (satsConnect as unknown as { request?: (...args: unknown[]) => Promise<unknown> }).request;
  if (scRequest) {
    attempts.push({
      label: 'satsConnect.request(getAddresses)',
      fn: () => scRequest.call(satsConnect, 'getAddresses', addressParams, entry.id, { skipGetInfo: true }),
    });
  }

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const result = normalizeResponse(await attempt.fn()) as { addresses?: AddressLike[] } | AddressLike[] | undefined;
      const resultWithAddresses = result as { addresses?: AddressLike[] } | undefined;
      const addresses =
        Array.isArray(resultWithAddresses?.addresses) && resultWithAddresses.addresses.length
          ? resultWithAddresses.addresses
          : Array.isArray(result)
            ? result
            : [];
      return { provider, addresses };
    } catch (err) {
      lastError = err;
      console.warn(`[wallets] ${attempt.label} failed`, err);
    }
  }

  throw lastError ?? codedError('No provider response.', 'wallet-no-provider');
};

export const connectExternalWallet = async (
  walletId: SupportedWalletId,
  network: NetworkType,
  requestMessage: string
): Promise<ExternalWalletSession> => {
  console.log('[connectExternalWallet] Starting connection for:', walletId, 'network:', network);
  
  if (walletId === 'zeld') {
    throw codedError('ZeldWallet is built in. Use the default connect flow instead.', 'wallet-built-in');
  }

  const discovery = discoverWallets();
  console.log('[connectExternalWallet] Discovery entries:', Object.keys(discovery.entries));
  
  const entry = discovery.entries[walletId];
  if (!entry) {
    throw codedError('Wallet is not installed in this browser.', 'wallet-not-installed');
  }
  console.log('[connectExternalWallet] Found entry:', { id: entry.id, name: entry.name, hasProvider: !!entry.provider, hasGetProvider: !!entry.getProvider });

  const { provider, addresses } = await connectWith(entry, network, requestMessage);
  console.log('[connectExternalWallet] After connectWith:', {
    hasProvider: !!provider,
    providerType: typeof provider,
    hasRequest: typeof provider?.request === 'function',
    addressCount: addresses.length,
  });
  
  const normalized = normalizeAddresses(addresses, network);
  const sessionNetwork = ensureNetworkMatches(normalized.list, network);

  const scRequest = (satsConnect as unknown as { request?: (...args: unknown[]) => Promise<unknown> }).request;
  console.log('[connectExternalWallet] satsConnect.request available:', !!scRequest);

  const isMagicEden = walletId === 'magicEden';
  
  const signMessage = async (
    message: string,
    address: string,
    protocol: 'ecdsa' | 'bip322-simple' = 'ecdsa'
  ): Promise<string> => {
    console.log('[signMessage] Called with:', { message, address, protocol, walletId });
    console.log('[signMessage] Provider state:', {
      hasProvider: !!provider,
      providerType: typeof provider,
      hasRequest: typeof provider?.request === 'function',
      entryId: entry.id,
      isMagicEden,
    });
    
    const requestFn = typeof provider?.request === 'function' ? provider.request.bind(provider) : undefined;
    console.log('[signMessage] requestFn resolved:', !!requestFn);
    
    // External wallets (Xverse, etc.) expect uppercase: "ECDSA" or "BIP322"
    const externalProtocol = protocol === 'bip322-simple' ? MessageSigningProtocols.BIP322 : MessageSigningProtocols.ECDSA;
    const params = { address, message, protocol: externalProtocol };
    
    // Magic Eden: use sats-connect signMessage with getProvider (same pattern as getAddress)
    if (isMagicEden) {
      console.log('[signMessage] Using satsSignMessage with getProvider for Magic Eden');
      return new Promise((resolve, reject) => {
        satsSignMessage({
          getProvider: async () => ((window as Record<string, unknown>).magicEden as Record<string, unknown>)?.bitcoin as BitcoinProvider | undefined,
          payload: {
            address,
            message,
            protocol: externalProtocol,
            network: { type: sessionNetwork === 'testnet' ? BitcoinNetworkType.Testnet : BitcoinNetworkType.Mainnet },
          },
          onFinish: (response) => {
            console.log('[signMessage] Magic Eden signMessage response:', response);
            resolve(typeof response === 'string' ? response : (response as { signature?: string })?.signature ?? JSON.stringify(response));
          },
          onCancel: () => reject(codedError('User cancelled signing.', 'user-cancelled-signing')),
        });
      });
    }
    
    if (requestFn) {
      console.log('[signMessage] Using provider.request directly');
      const resp = normalizeResponse(await requestFn('signMessage', params)) as { signature?: string } | string;
      if (typeof resp === 'string') return resp;
      return (resp as { signature?: string })?.signature ?? JSON.stringify(resp);
    }
    
    console.log('[signMessage] scRequest available:', !!scRequest);
    if (scRequest) {
      console.log('[signMessage] Using satsConnect.request with entry.id:', entry.id);
      const resp = normalizeResponse(await scRequest.call(satsConnect, 'signMessage', params, entry.id, { skipGetInfo: true })) as { signature?: string } | string;
      if (typeof resp === 'string') return resp;
      return (resp as { signature?: string })?.signature ?? JSON.stringify(resp);
    }
    
    console.log('[signMessage] Fallback to satsConnect.request (no scRequest)');
    const satsConnectWithRequest = satsConnect as unknown as { request: (...args: unknown[]) => Promise<unknown> };
    const resp = normalizeResponse(await satsConnectWithRequest.request('signMessage', params, entry.id, { skipGetInfo: true })) as { signature?: string } | string;
    if (typeof resp === 'string') return resp;
    return (resp as { signature?: string })?.signature ?? JSON.stringify(resp);
  };

  const signPsbt = async (psbtBase64: string, inputs: SignInputOptions[]): Promise<string> => {
    console.log('[signPsbt] Called with:', { psbtBase64: psbtBase64.slice(0, 50) + '...', inputs, walletId });
    
    // Convert SignInputOptions[] to Record<address, number[]> format expected by sats-connect
    const signInputsMap: Record<string, number[]> = {};
    for (const input of inputs) {
      if (!input.address) {
        console.warn('[signPsbt] Input missing address, cannot sign:', input);
        continue;
      }
      if (!signInputsMap[input.address]) {
        signInputsMap[input.address] = [];
      }
      signInputsMap[input.address].push(input.index);
    }
    
    console.log('[signPsbt] Converted signInputs to map format:', signInputsMap);
    
    const requestFn = typeof provider?.request === 'function' ? provider.request.bind(provider) : undefined;
    
    // Build inputsToSign array for sats-connect signTransaction
    const inputsToSign = Object.entries(signInputsMap).map(([address, signingIndexes]) => ({
      address,
      signingIndexes,
    }));
    
    // Wallet-specific handling
    const isXverse = walletId === 'xverse';
    const isLeather = walletId === 'leather';
    
    // For Leather: use hex format and different API
    if (isLeather && requestFn) {
      console.log('[signPsbt] Using Leather-specific format');
      try {
        // Convert base64 PSBT to hex
        const psbtHex = Buffer.from(psbtBase64, 'base64').toString('hex');
        
        // Leather expects signAtIndex as an array of input indices to sign
        const signAtIndex = inputs.map(i => i.index);
        
        const leatherParams = {
          hex: psbtHex,
          signAtIndex,
          broadcast: false,
        };
        
        console.log('[signPsbt] Leather params:', { hexLength: psbtHex.length, signAtIndex });
        const resp = normalizeResponse(await requestFn('signPsbt', leatherParams));
        console.log('[signPsbt] Leather response:', resp);
        
        // Leather returns hex, convert back to base64
        if (typeof resp === 'string') {
          // Check if it's hex (no padding chars, only hex chars)
          if (/^[0-9a-fA-F]+$/.test(resp)) {
            return Buffer.from(resp, 'hex').toString('base64');
          }
          return resp;
        }
        const respObj = resp as { hex?: string; psbt?: string; psbtBase64?: string };
        const hexResult = respObj?.hex ?? respObj?.psbt ?? respObj?.psbtBase64;
        if (hexResult && /^[0-9a-fA-F]+$/.test(hexResult)) {
          return Buffer.from(hexResult, 'hex').toString('base64');
        }
        return hexResult ?? JSON.stringify(resp);
      } catch (err: unknown) {
        console.error('[signPsbt] Leather error:', err);
        // Check if user cancelled
        const error = err as { message?: string; code?: number; error?: { code?: number } };
        const errorMessage = error?.message ?? String(err);
        const errorCode = error?.code ?? error?.error?.code;
        if (errorCode === 4001 || errorMessage.toLowerCase().includes('cancel') || errorMessage.toLowerCase().includes('denied')) {
          throw codedError('User cancelled signing.', 'user-cancelled-signing');
        }
        throw err;
      }
    }
    
    // For Xverse, Magic Eden: use sats-connect signTransaction with getProvider
    // This properly handles user cancellation and wallet UI
    if (isMagicEden || isXverse) {
      console.log('[signPsbt] Using sats-connect signTransaction for', walletId);
      
      // Determine the getProvider function based on wallet type
      const getProviderFn = isMagicEden 
        ? async () => ((window as Record<string, unknown>).magicEden as Record<string, unknown>)?.bitcoin as BitcoinProvider | undefined
        : async () => provider as BitcoinProvider | undefined; // For Xverse, use the provider we already have
      
      return new Promise((resolve, reject) => {
        signTransaction({
          getProvider: getProviderFn,
          payload: {
            network: { type: sessionNetwork === 'testnet' ? BitcoinNetworkType.Testnet : BitcoinNetworkType.Mainnet },
            message: 'Sign transaction to complete your hunt',
            psbtBase64,
            inputsToSign,
            broadcast: false,
          },
          onFinish: (response: string | { psbtBase64?: string }) => {
            console.log('[signPsbt] signTransaction response:', response);
            resolve(typeof response === 'string' ? response : response?.psbtBase64 ?? JSON.stringify(response));
          },
          onCancel: () => reject(codedError('User cancelled signing.', 'user-cancelled-signing')),
        });
      });
    }
    
    type PsbtResponse = { psbt?: string; psbtBase64?: string } | string;
    
    // For other wallets: try provider.request directly
    if (requestFn) {
      console.log('[signPsbt] Using provider.request directly');
      const params = { psbt: psbtBase64, signInputs: signInputsMap, broadcast: false };
      const resp = normalizeResponse(await requestFn('signPsbt', params)) as PsbtResponse;
      console.log('[signPsbt] provider.request response:', resp);
      if (typeof resp === 'string') return resp;
      return (resp as { psbt?: string; psbtBase64?: string })?.psbt ?? (resp as { psbt?: string; psbtBase64?: string })?.psbtBase64 ?? JSON.stringify(resp);
    }
    
    // Fallback to sats-connect request
    console.log('[signPsbt] Using sats-connect.request fallback');
    const params = { psbt: psbtBase64, signInputs: signInputsMap, broadcast: false };
    if (scRequest) {
      const resp = normalizeResponse(await scRequest.call(satsConnect, 'signPsbt', params, entry.id, { skipGetInfo: true })) as PsbtResponse;
      console.log('[signPsbt] sats-connect response:', resp);
      if (typeof resp === 'string') return resp;
      return (resp as { psbt?: string; psbtBase64?: string })?.psbt ?? (resp as { psbt?: string; psbtBase64?: string })?.psbtBase64 ?? JSON.stringify(resp);
    }
    
    throw codedError('No wallet provider found for signing', 'wallet-no-provider');
  };

  return {
    id: walletId,
    name: CATALOG[walletId].name,
    network: sessionNetwork,
    addresses: normalized.list,
    provider,
    signMessage,
    signPsbt,
  };
};

