/**
 * WBIPProvider
 *
 * Implements a lightweight WBIP004/005/006-compatible provider that exposes
 * ZeldWallet capabilities to dApps (e.g., sats-connect).
 */
import * as bitcoin from 'bitcoinjs-lib';
import packageJson from '../../package.json' assert { type: 'json' };
import { WBIPErrorCode } from '../types';
import type {
  AddressInfo,
  AddressPurpose,
  EventHandler,
  GetAddressesParams,
  GetInfoResult,
  NetworkType,
  SignInputOptions,
  SignMessageParams,
  SignPsbtParams,
  WBIPError,
  WBIPProviderDescriptor,
  WBIPProviderOptions,
  WalletEvent,
  WBIPAddressesResult,
  ConfirmationType,
} from '../types';

export type ConfirmationHandler = (type: ConfirmationType, payload?: unknown) => Promise<boolean>;

const LIB_VERSION = typeof packageJson?.version === 'string' ? packageJson.version : '0.0.0';
const SUPPORTED_METHODS = ['getInfo', 'getAddresses', 'signMessage', 'signPsbt'] as const;
const SUPPORTED_STANDARDS = ['WBIP004', 'WBIP005', 'WBIP006'] as const;

/**
 * Minimal interface the provider needs from the wallet to avoid circular deps.
 */
interface WalletAdapter {
  isUnlocked(): boolean;
  getAddresses(purposes: AddressPurpose[]): AddressInfo[];
  getNetwork(): NetworkType;
  signMessage(
    message: string,
    address: string,
    protocol?: 'ecdsa' | 'bip322-simple'
  ): Promise<string>;
  signPsbt(psbtBase64: string, inputsToSign: SignInputOptions[]): Promise<string>;
  on(event: WalletEvent, handler: EventHandler): void;
  off(event: WalletEvent, handler: EventHandler): void;
}

/**
 * WBIP Provider implementation (Phase 2)
 */
export class WBIPProvider {
  private lastProviderId: string | null = null;
  private accessGrants = new Map<string, Set<string>>();
  private currentOptions?: WBIPProviderOptions;

  constructor(private wallet: WalletAdapter, private confirm?: ConfirmationHandler) {}

  /**
   * Update the confirmation handler used for sensitive requests.
   */
  setConfirmationHandler(confirm?: ConfirmationHandler): void {
    this.confirm = confirm;
  }

  /**
   * Register the provider on the global window object so dApps can discover it.
   */
  register(options: WBIPProviderOptions): void {
    // In SSR/non-browser contexts, safely no-op to avoid hard crashes during import.
    if (typeof window === 'undefined') {
      return;
    }

    // Always remove an existing provider with the same id to avoid duplicate globals/descriptors.
    this.unregister(options.id);

    // When switching ids, unregister the old descriptor and global to avoid
    // leaking entrypoints/approvals from a previous registration.
    if (this.lastProviderId && this.lastProviderId !== options.id) {
      this.unregister(this.lastProviderId);
    }

    this.lastProviderId = options.id;
    this.currentOptions = options;

    const descriptor: WBIPProviderDescriptor = {
      id: options.id,
      name: options.name,
      icon: options.icon,
      webUrl: options.webUrl,
      // Advertise only implemented entrypoints; sendTransfer is wired but unsupported.
      // Placing this descriptor first in the global array makes sats-connect prefer ZeldWallet.
      methods: [...SUPPORTED_METHODS],
    };

    // Ensure our provider is first in the discovery list while still coexisting
    // with other wallets. Remove any previous entry with the same id and prepend ours.
    const existing = Array.isArray(window.wbip_providers) ? window.wbip_providers : [];
    window.wbip_providers = [descriptor, ...existing.filter((p) => p.id !== options.id)];
    // Hint a default provider id for integrations that respect this flag (non-destructive).
    (window as Record<string, unknown>).wbip_default_provider = options.id;

    // Expose provider entry point
    (window as Record<string, unknown>)[options.id] = {
      request: this.request.bind(this),
      on: this.wallet.on.bind(this.wallet),
      off: this.wallet.off.bind(this.wallet),
    };
  }

  /**
   * Unregister the provider and clean up globals.
   */
  unregister(id?: string): void {
    // In SSR/non-browser contexts, there's nothing to clean up; exit silently.
    if (typeof window === 'undefined') {
      return;
    }

    const providerId = id ?? this.currentOptions?.id ?? this.lastProviderId;
    if (!providerId) return;

    if (window.wbip_providers) {
      window.wbip_providers = window.wbip_providers.filter((p) => p.id !== providerId);
    }

    delete (window as Record<string, unknown>)[providerId];

    if (this.lastProviderId === providerId) {
      this.lastProviderId = null;
      this.currentOptions = undefined;
    }

    this.resetAccess();
  }

  /**
   * Handle WBIP request entry point.
   */
  async request(method: string, params?: unknown): Promise<unknown> {
    try {
      if (method === 'getInfo') {
        return this.handleGetInfo();
      }

      this.ensureUnlocked();

      switch (method) {
        case 'getAddresses':
          return this.handleGetAddresses(params as GetAddressesParams | undefined);

        case 'signMessage':
          return this.handleSignMessage(params as SignMessageParams);

        case 'signPsbt':
          return this.handleSignPsbt(params as SignPsbtParams);

        case 'sendTransfer':
          throw {
            code: WBIPErrorCode.UNSUPPORTED_METHOD,
            message: 'sendTransfer is not supported by ZeldWallet',
          } satisfies WBIPError;

        default:
          throw {
            code: WBIPErrorCode.METHOD_NOT_FOUND,
            message: `Method not found: ${method}`,
          } satisfies WBIPError;
      }
    } catch (error) {
      if (this.isWBIPError(error)) {
        throw error;
      }
      throw this.formatInternalError(error, 'Unexpected provider error');
    }
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  private async handleGetAddresses(params?: GetAddressesParams): Promise<WBIPAddressesResult> {
    const providerId = this.currentOptions?.id ?? this.lastProviderId;
    if (!providerId) {
      throw {
        code: WBIPErrorCode.INTERNAL_ERROR,
        message: 'Provider is not registered',
      } satisfies WBIPError;
    }

    const origin = this.getOrigin();
    const allowedForProvider = this.accessGrants.get(providerId) ?? new Set<string>();
    const hasGrant = allowedForProvider.has(origin);

    // Ask for a one-time connection confirmation per origin to avoid leaking addresses without consent
    if (!hasGrant) {
      const approved = await this.showConfirmation('connect', params);
      if (!approved) {
        throw {
          code: WBIPErrorCode.USER_REJECTED,
          message: 'User rejected the request',
        } satisfies WBIPError;
      }
      allowedForProvider.add(origin);
      this.accessGrants.set(providerId, allowedForProvider);
    }

    if (
      params?.purposes !== undefined &&
      (!Array.isArray(params.purposes) ||
        params.purposes.length === 0 ||
        params.purposes.some(
          (p) => p !== 'payment' && p !== 'ordinals' && p !== 'stacks'
        ))
    ) {
      throw {
        code: WBIPErrorCode.INVALID_PARAMS,
        message: 'purposes must be an array of valid purposes',
      } satisfies WBIPError;
    }

    const purposes =
      params?.purposes && params.purposes.length > 0
        ? params.purposes
        : (['payment', 'ordinals', 'stacks'] as AddressPurpose[]);

    const addresses = this.wallet.getAddresses(purposes).map((addr) => ({
      address: addr.address,
      publicKey: addr.publicKey,
      purpose: addr.purpose,
      addressType: addr.addressType,
      walletType: 'software' as const,
    }));

    // Return an array for compatibility with consumers that expect a list,
    // while still attaching WBIP metadata (addresses + network) on the array.
    const result = addresses as WBIPAddressesResult;
    result.addresses = addresses;
    result.network = this.buildNetworkPayload();
    return result;
  }

  private async handleSignMessage(params?: SignMessageParams): Promise<{ signature: string }> {
    if (!params?.address || !params?.message) {
      throw {
        code: WBIPErrorCode.INVALID_PARAMS,
        message: 'address and message are required',
      } satisfies WBIPError;
    }

    if (params.protocol && params.protocol !== 'ecdsa' && params.protocol !== 'bip322-simple') {
      throw {
        code: WBIPErrorCode.INVALID_PARAMS,
        message: 'protocol must be ecdsa or bip322-simple',
      } satisfies WBIPError;
    }

    // Auto-upgrade taproot addresses to bip322-simple when caller does not specify protocol.
    // This avoids a round-trip rejection for dApps that omit the protocol field.
    const protocol =
      params.protocol ??
      (this.isTaprootAddress(params.address) ? ('bip322-simple' as const) : undefined);

    const approved = await this.showConfirmation('sign_message', params);
    if (!approved) {
      throw {
        code: WBIPErrorCode.USER_REJECTED,
        message: 'User rejected the request',
      } satisfies WBIPError;
    }

    try {
      const signature = await this.wallet.signMessage(params.message, params.address, protocol);
      return { signature };
    } catch (error) {
      const mapped = this.mapUserError(error);
      if (mapped) throw mapped;
      throw this.formatInternalError(error, 'Failed to sign message');
    }
  }

  private async handleSignPsbt(params?: SignPsbtParams): Promise<{ psbt: string }> {
    if (!params?.psbt || !params?.signInputs) {
      throw {
        code: WBIPErrorCode.INVALID_PARAMS,
        message: 'psbt and signInputs are required',
      } satisfies WBIPError;
    }

    if (params.broadcast === true) {
      throw {
        code: WBIPErrorCode.UNSUPPORTED_METHOD,
        message: 'broadcast is not supported yet; set broadcast=false',
      } satisfies WBIPError;
    }

    // Validate PSBT base64 early to return a crisp INVALID_PARAMS instead of INTERNAL_ERROR
    try {
      // We discard the result; bitcoinjs will parse again later but this keeps code simple/DRY
      bitcoin.Psbt.fromBase64(params.psbt);
    } catch {
      throw {
        code: WBIPErrorCode.INVALID_PARAMS,
        message: 'psbt must be a valid base64-encoded PSBT',
      } satisfies WBIPError;
    }

    // Validate signInputs shape early to provide crisp errors
    if (
      !params.signInputs ||
      typeof params.signInputs !== 'object' ||
      Array.isArray(params.signInputs) ||
      Object.entries(params.signInputs).some(
        ([_, indices]) =>
          !Array.isArray(indices) ||
          indices.some((i) => !Number.isInteger(i) || i < 0)
      )
    ) {
      throw {
        code: WBIPErrorCode.INVALID_PARAMS,
        message: 'signInputs must be a record of address -> number[]',
      } satisfies WBIPError;
    }

    const approved = await this.showConfirmation('sign_psbt', params);
    if (!approved) {
      throw {
        code: WBIPErrorCode.USER_REJECTED,
        message: 'User rejected the request',
      } satisfies WBIPError;
    }

    const inputsToSign: SignInputOptions[] = [];
    const seen = new Set<string>();
    for (const [address, indices] of Object.entries(params.signInputs)) {
      for (const index of indices) {
        const key = `${address}#${index}`;
        if (seen.has(key)) continue;
        seen.add(key);
        inputsToSign.push({ address, index });
      }
    }
    if (inputsToSign.length === 0) {
      throw {
        code: WBIPErrorCode.INVALID_PARAMS,
        message: 'signInputs must contain at least one index',
      } satisfies WBIPError;
    }

    try {
      const psbt = await this.wallet.signPsbt(params.psbt, inputsToSign);
      return { psbt };
    } catch (error) {
      const mapped = this.mapUserError(error);
      if (mapped) throw mapped;
      throw this.formatInternalError(error, 'Failed to sign PSBT');
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private handleGetInfo(): GetInfoResult {
    return {
      version: LIB_VERSION,
      platform: 'web',
      methods: [...SUPPORTED_METHODS],
      supports: [...SUPPORTED_STANDARDS],
    };
  }

  private buildNetworkPayload(): WBIPAddressesResult['network'] {
    const network = this.wallet.getNetwork();
    const bitcoin = network === 'mainnet' ? 'Mainnet' : 'Testnet';
    const stacks = network === 'mainnet' ? 'mainnet' : 'testnet';
    const spark = network === 'mainnet' ? 'mainnet' : 'regtest';

    return {
      bitcoin: { name: bitcoin },
      stacks: { name: stacks },
      spark: { name: spark },
    };
  }

  private ensureUnlocked(): void {
    if (!this.wallet.isUnlocked()) {
      throw {
        code: WBIPErrorCode.UNAUTHORIZED,
        message: 'Wallet is locked. Call unlock() first.',
      } satisfies WBIPError;
    }
  }

  private getOrigin(): string {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return 'unknown';
  }

  private async showConfirmation(
    type: ConfirmationType,
    payload?: unknown
  ): Promise<boolean> {
    if (this.confirm) {
      return this.confirm(type, payload);
    }

    if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
      throw {
        code: WBIPErrorCode.INTERNAL_ERROR,
        message: 'Confirmation UI unavailable in this environment',
      } satisfies WBIPError;
    }

    const summary = this.buildConfirmationSummary(type, payload);

    return window.confirm(summary);
  }

  private buildConfirmationSummary(
    type: ConfirmationType,
    payload?: unknown
  ): string {
    switch (type) {
      case 'sign_message': {
        const p = payload as SignMessageParams | undefined;
        return [
          `Allow signing message for ${p?.address ?? 'address'}?`,
          '',
          p?.message ?? '',
          '',
          'ZeldWallet may prompt for a password if the wallet is protected.',
        ].join('\n');
      }
      case 'sign_psbt':
        return this.summarizeSignPsbt(payload as SignPsbtParams | undefined);
      case 'connect':
      default:
        return 'Allow this application to connect to ZeldWallet?';
    }
  }

  /**
   * Provide a concise PSBT summary for the confirm dialog.
   * Avoids deep decoding to keep execution fast and safe.
   */
  private summarizeSignPsbt(params?: SignPsbtParams): string {
    if (!params) return 'Allow signing the provided PSBT?';

    const indices = Object.values(params.signInputs ?? {}).flat();
    const uniqueIndices = Array.from(new Set(indices)).sort((a, b) => a - b);

    let psbt: bitcoin.Psbt | null = null;
    try {
      psbt = bitcoin.Psbt.fromBase64(params.psbt);
    } catch {
      // Keep going with minimal context; detailed validation happens earlier
    }

    const parts = [
      `Allow signing PSBT inputs [${uniqueIndices.join(', ') || 'n/a'}]?`,
    ];

    if (psbt) {
      const outputs = psbt.txOutputs ?? [];
      let fee: number | undefined;
      if (typeof psbt.getFee === 'function') {
        try {
          fee = psbt.getFee();
        } catch {
          // Fee calculation can throw if inputs are not yet finalized; ignore for summary.
        }
      }
      parts.push(
        `Inputs: ${psbt.inputCount}`,
        `Outputs: ${outputs.length}`,
        fee !== undefined ? `Fee (sat): ${fee}` : 'Fee: unavailable',
      );
    }

    parts.push('ZeldWallet may prompt for a password if the wallet is protected.');
    return parts.join('\n');
  }

  /**
   * Normalize unexpected errors into WBIP-compatible internal errors.
   */
  private formatInternalError(error: unknown, message: string): WBIPError {
    const data = error instanceof Error ? error.message : String(error);
    return {
      code: WBIPErrorCode.INTERNAL_ERROR,
      message,
      data,
    };
  }

  private isWBIPError(error: unknown): error is WBIPError {
    return (
      !!error &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error &&
      typeof (error as WBIPError).code === 'number' &&
      typeof (error as WBIPError).message === 'string'
    );
  }

  /**
   * Lightweight taproot detector: bech32m v1 with 32-byte data.
   */
  private isTaprootAddress(address: string): boolean {
    try {
      const decoded = bitcoin.address.fromBech32(address);
      return decoded.version === 1 && decoded.data.length === 32;
    } catch {
      return false;
    }
  }

  /**
   * Map common user-driven errors to INVALID_PARAMS for clearer feedback.
   */
  private mapUserError(error: unknown): WBIPError | null {
    if (!(error instanceof Error)) return null;

    const msg = error.message || '';
    const patterns = [
      'Address not found',
      'Cannot find key for input',
      'Input ',
      'not found in PSBT',
      'Unable to determine derivation path',
      'Taproot addresses require bip322-simple signing',
    ];

    const isUserError = patterns.some((p) => msg.includes(p));
    if (!isUserError) return null;

    return {
      code: WBIPErrorCode.INVALID_PARAMS,
      message: msg,
    };
  }

  /**
   * Reset transient access grants (used when wallet locks or unregisters).
   */
  resetAccess(): void {
    this.accessGrants.clear();
  }
}


