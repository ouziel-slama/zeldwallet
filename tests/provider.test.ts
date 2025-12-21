import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as bitcoin from 'bitcoinjs-lib';
import { ZeldWallet } from '../src';
import { WBIPErrorCode } from '../src/types';

type TestProvider = {
  request: (method: string, params?: unknown) => Promise<unknown>;
};

describe('WBIPProvider', () => {
  let wallet: ZeldWallet;
  let provider: TestProvider;

  beforeEach(async () => {
    // Ensure clean DB between runs (singleton or prior instances)
    try {
      await ZeldWallet.destroy();
    } catch {
      /* ignore */
    }

    wallet = new ZeldWallet();
    await wallet.create();

    // Avoid native confirm popups during tests
    (window as any).confirm = vi.fn(() => true);

    wallet.registerProvider({
      id: 'TestProvider',
      name: 'Test Provider',
      icon: '',
    });

    provider = (window as any).TestProvider as TestProvider;
  });

  afterEach(async () => {
    try {
      wallet.unregisterProvider('TestProvider');
      await wallet.destroy();
    } catch {
      // best-effort cleanup
    }
  });

  it('returns addresses via request', async () => {
    const result = await provider.request('getAddresses');

    const addresses = result as any[];
    expect(addresses).toHaveLength(3);
    expect(addresses[0].address).toBeDefined();
    expect(addresses.some((a) => a.purpose === 'payment')).toBe(true);
    expect(addresses.some((a) => a.purpose === 'ordinals')).toBe(true);
    expect(addresses.some((a) => a.purpose === 'stacks')).toBe(true);
  });

  it('signs a message via request', async () => {
    const address = wallet.getAddresses(['payment'])[0].address;

    const result = (await provider.request('signMessage', {
      address,
      message: 'hello world',
    })) as { signature: string };

    expect(result.signature).toBeTypeOf('string');
    expect(result.signature.length).toBeGreaterThan(0);
  });

  it('maps unknown address errors to INVALID_PARAMS', async () => {
    await expect(
      provider.request('signMessage', {
        address: 'bc1qnotarealaddress000000000000000000000000000',
        message: 'hello world',
      })
    ).rejects.toMatchObject({
      code: WBIPErrorCode.INVALID_PARAMS,
    });
  });

  it('registers/unregisters in the browser and prompts once per origin', async () => {
    if (!(window as any).location) {
      (window as any).location = { href: 'https://origin-one.test/', origin: 'https://origin-one.test/' };
    }
    const locationRef = window.location as any;
    const setHref = (href: string) => {
      locationRef.href = href;
      locationRef.origin = new URL(href).origin;
    };
    const originalHref = locationRef.href ?? 'https://origin-one.test/';

    try {
      (window as any).confirm = vi.fn(() => true);
      setHref('https://origin-one.test/');

      await provider.request('getAddresses');
      await provider.request('getAddresses');
      expect((window as any).confirm).toHaveBeenCalledTimes(1);

      wallet.unregisterProvider('TestProvider');
      expect((window as any).TestProvider).toBeUndefined();
      expect(window.wbip_providers?.some((p: any) => p.id === 'TestProvider')).toBe(false);

      wallet.registerProvider({
        id: 'TestProvider',
        name: 'Test Provider',
        icon: '',
      });
      provider = (window as any).TestProvider as TestProvider;

      (window as any).confirm = vi.fn(() => true);
      await provider.request('getAddresses');
      await provider.request('getAddresses');
      expect((window as any).confirm).toHaveBeenCalledTimes(1);
    } finally {
      setHref(originalHref);
    }
  });

  it('rejects when wallet is locked', async () => {
    wallet.lock();

    await expect(provider.request('getAddresses')).rejects.toMatchObject({
      code: WBIPErrorCode.UNAUTHORIZED,
    });
  });

  it('rejects invalid signPsbt params', async () => {
    await expect(
      provider.request('signPsbt', { psbt: 'invalid-base64' })
    ).rejects.toMatchObject({
      code: WBIPErrorCode.INVALID_PARAMS,
    });
  });

  it('rejects malformed signInputs', async () => {
    await expect(
      provider.request('signPsbt', { psbt: 'AAAA', signInputs: { addr: 'not-an-array' as any } })
    ).rejects.toMatchObject({
      code: WBIPErrorCode.INVALID_PARAMS,
    });
  });

  it('rejects sendTransfer as unsupported', async () => {
    await expect(
      provider.request('sendTransfer', { recipients: [{ address: 'addr', amount: 1 }] })
    ).rejects.toMatchObject({
      code: WBIPErrorCode.UNSUPPORTED_METHOD,
    });
  });

  it('rejects unknown methods', async () => {
    await expect(provider.request('unknownMethod')).rejects.toMatchObject({
      code: WBIPErrorCode.METHOD_NOT_FOUND,
    });
  });

  it('requires reconnection after lock/unlock', async () => {
    // First call should confirm once
    await provider.request('getAddresses');
    expect((window as any).confirm).toHaveBeenCalledTimes(1);

    wallet.lock();
    await wallet.unlock();

    await provider.request('getAddresses');
    expect((window as any).confirm).toHaveBeenCalledTimes(2);
  });

  it('prompts again when register is called repeatedly with the same id', async () => {
    await provider.request('getAddresses');
    expect((window as any).confirm).toHaveBeenCalledTimes(1);

    wallet.registerProvider({
      id: 'TestProvider',
      name: 'Test Provider',
      icon: '',
    });
    provider = (window as any).TestProvider as TestProvider;

    await provider.request('getAddresses');
    expect((window as any).confirm).toHaveBeenCalledTimes(2);
  });

  it('signs a PSBT via request (happy path)', async () => {
    const addressInfo = wallet.getAddresses(['payment'])[0];
    const network = bitcoin.networks.bitcoin;
    const payment = bitcoin.payments.p2wpkh({ address: addressInfo.address, network });

    const psbt = new bitcoin.Psbt({ network });
    psbt.addInput({
      hash: '00'.repeat(32),
      index: 0,
      witnessUtxo: {
        script: payment.output!,
        value: 50_000,
      },
    });
    psbt.addOutput({
      address: addressInfo.address,
      value: 49_000,
    });

    const result = (await provider.request('signPsbt', {
      psbt: psbt.toBase64(),
      signInputs: { [addressInfo.address]: [0] },
    })) as { psbt: string };

    const signed = bitcoin.Psbt.fromBase64(result.psbt);
    const partial = signed.data.inputs[0].partialSig;

    expect(partial).toBeDefined();
    expect(partial?.length).toBeGreaterThan(0);
  });

  it('emits accountsChanged on unlock', async () => {
    const localWallet = new ZeldWallet();
    const handler = vi.fn();

    localWallet.on('accountsChanged', handler);
    await localWallet.create();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenLastCalledWith(
      localWallet.getAddresses(['payment', 'ordinals', 'stacks'])
    );

    localWallet.lock();
    await localWallet.unlock();

    expect(handler).toHaveBeenCalledTimes(2);

    await localWallet.destroy();
  });

  it('denies access when default confirm rejects and does not grant access', async () => {
    (window as any).confirm = vi.fn(() => false);

    await expect(provider.request('getAddresses')).rejects.toMatchObject({
      code: WBIPErrorCode.USER_REJECTED,
    });
    expect((window as any).confirm).toHaveBeenCalledTimes(1);

    // A later approval should still prompt again because no grant was stored
    (window as any).confirm = vi.fn(() => true);
    const addresses = (await provider.request('getAddresses')) as any[];
    expect(addresses).toHaveLength(3);
    expect((window as any).confirm).toHaveBeenCalledTimes(1);
  });

  it('clears access grants when unregistered and re-registered', async () => {
    await provider.request('getAddresses');
    expect((window as any).confirm).toHaveBeenCalledTimes(1);

    wallet.unregisterProvider('TestProvider');
    wallet.registerProvider({
      id: 'TestProvider',
      name: 'Test Provider',
      icon: '',
    });
    provider = (window as any).TestProvider as TestProvider;

    await provider.request('getAddresses');
    expect((window as any).confirm).toHaveBeenCalledTimes(2);
  });

  it('scopes access grants per origin', async () => {
    if (!(window as any).location) {
      (window as any).location = { href: 'https://origin-one.test/', origin: 'https://origin-one.test/' };
    }
    const locationRef = window.location as any;
    const setHref = (href: string) => {
      locationRef.href = href;
      locationRef.origin = new URL(href).origin;
    };

    const originalHref = locationRef.href ?? 'https://origin-one.test/';
    try {
      setHref('https://origin-one.test/');
      await provider.request('getAddresses');
      expect((window as any).confirm).toHaveBeenCalledTimes(1);

      setHref('https://origin-two.test/');
      await provider.request('getAddresses');
      expect((window as any).confirm).toHaveBeenCalledTimes(2);

      // Returning to the first origin should reuse its grant
      setHref('https://origin-one.test/');
      await provider.request('getAddresses');
      expect((window as any).confirm).toHaveBeenCalledTimes(2);
    } finally {
      setHref(originalHref);
    }
  });

  it('maps wallet PSBT validation errors to INVALID_PARAMS', async () => {
    const addressInfo = wallet.getAddresses(['payment'])[0];
    const network = bitcoin.networks.bitcoin;
    const payment = bitcoin.payments.p2wpkh({ address: addressInfo.address, network });

    const psbt = new bitcoin.Psbt({ network });
    psbt.addInput({
      hash: '00'.repeat(32),
      index: 0,
      witnessUtxo: {
        script: payment.output!,
        value: 12_000,
      },
    });
    psbt.addOutput({
      address: addressInfo.address,
      value: 11_000,
    });

    await expect(
      provider.request('signPsbt', {
        psbt: psbt.toBase64(),
        // Request signing a non-existent input to trigger wallet-side validation
        signInputs: { [addressInfo.address]: [1] },
      })
    ).rejects.toMatchObject({
      code: WBIPErrorCode.INVALID_PARAMS,
    });
  });
});

