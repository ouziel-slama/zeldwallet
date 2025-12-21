import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ZeldWallet } from '../src';
import { hexToBytes } from '../src/utils/encoding';

bitcoin.initEccLib(ecc);
// Shim getTaprootHashForSig for older bitcoinjs builds used in tests
if (typeof (bitcoin.Psbt.prototype as any).getTaprootHashForSig !== 'function') {
  (bitcoin.Psbt.prototype as any).getTaprootHashForSig = function getTaprootHashForSig(
    _index: number,
    _xOnlyPubkey: Buffer,
    _sighashType: number = 0x00
  ) {
    return Buffer.alloc(32);
  };
}

describe('Signing workflows', () => {
  let wallet: ZeldWallet;

  beforeEach(async () => {
    try {
      await ZeldWallet.destroy();
    } catch {
      /* ignore */
    }
    wallet = new ZeldWallet();
    await wallet.create();
  });

  afterEach(async () => {
    try {
      await wallet.destroy();
    } catch {
      /* ignore */
    }
  });

  it('signs p2wpkh messages with ECDSA and produces PSBT partial signatures', async () => {
    const payment = wallet.getAddresses(['payment'])[0];
    const messageSig = await wallet.signMessage('p2wpkh ecdsa message', payment.address, 'ecdsa');
    expect(typeof messageSig).toBe('string');
    expect(messageSig.length).toBeGreaterThan(0);

    const network = bitcoin.networks.bitcoin;
    const paymentScript = bitcoin.payments.p2wpkh({ address: payment.address, network });
    const psbt = new bitcoin.Psbt({ network });
    psbt.addInput({
      hash: '00'.repeat(32),
      index: 0,
      witnessUtxo: {
        script: paymentScript.output!,
        value: 50_000,
      },
    });
    psbt.addOutput({
      address: payment.address,
      value: 49_000,
    });

    const signedBase64 = await wallet.signPsbt(psbt.toBase64(), [
      { address: payment.address, index: 0 },
    ]);
    const signed = bitcoin.Psbt.fromBase64(signedBase64);
    expect(signed.data.inputs[0].partialSig?.length).toBeGreaterThan(0);
  });

  it('signs taproot messages with bip322-simple and adds taproot PSBT signatures', async () => {
    const taproot = wallet.getAddresses(['ordinals'])[0];
    const messageSig = await wallet.signMessage('taproot bip322 message', taproot.address, 'bip322-simple');
    expect(typeof messageSig).toBe('string');
    expect(messageSig.length).toBeGreaterThan(0);

    const network = bitcoin.networks.bitcoin;
    const internalKey = Buffer.from(hexToBytes(taproot.publicKey).slice(1));
    const payment = bitcoin.payments.p2tr({ internalPubkey: internalKey, network });

    const psbt = new bitcoin.Psbt({ network });
    psbt.addInput({
      hash: '00'.repeat(32),
      index: 0,
      witnessUtxo: {
        script: payment.output!,
        value: 75_000,
      },
      tapInternalKey: internalKey,
    });
    psbt.addOutput({
      address: taproot.address,
      value: 74_000,
    });

    const signedBase64 = await wallet.signPsbt(psbt.toBase64(), [
      { address: taproot.address, index: 0 },
    ]);
    const signed = bitcoin.Psbt.fromBase64(signedBase64);
    expect(signed.data.inputs[0].tapKeySig?.length).toBeGreaterThan(0);
  });

  it('rejects bad signing inputs for unknown addresses and malformed PSBT', async () => {
    await expect(
      wallet.signMessage('bad address message', 'bc1qnotarealaddress000000000000000000000000000')
    ).rejects.toThrow(/Address not found/i);

    const payment = wallet.getAddresses(['payment'])[0];
    await expect(
      wallet.signPsbt('@@not-base64@@', [{ address: payment.address, index: 0 }])
    ).rejects.toThrow();
  });
});


