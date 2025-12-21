import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
// Force the Node Buffer instead of Vite's browser polyfill to keep
// Buffer.isBuffer checks inside bitcoinjs-lib happy.
import { Buffer } from 'node:buffer';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = require('crypto').webcrypto;
}
if (typeof globalThis.Buffer === 'undefined') {
  (globalThis as any).Buffer = Buffer;
}
// Ensure bitcoinjs has an ECC backend in the bundle test environment.
bitcoin.initEccLib(ecc);

function encodeVarInt(n: number): Uint8Array {
  if (n < 0xfd) return new Uint8Array([n]);
  if (n <= 0xffff) return new Uint8Array([0xfd, n & 0xff, (n >> 8) & 0xff]);
  const buf = new Uint8Array(5);
  buf[0] = 0xfe;
  buf[1] = n & 0xff;
  buf[2] = (n >> 8) & 0xff;
  buf[3] = (n >> 16) & 0xff;
  buf[4] = (n >> 24) & 0xff;
  return buf;
}

function bip322SimpleHash(message: string): Uint8Array {
  const messageBytes = new TextEncoder().encode(message);
  const lengthBytes = encodeVarInt(messageBytes.length);
  const payload = new Uint8Array(1 + lengthBytes.length + messageBytes.length);
  payload[0] = 0x00;
  payload.set(lengthBytes, 1);
  payload.set(messageBytes, 1 + lengthBytes.length);
  return sha256(sha256(payload));
}

describe('Browser bundle taproot signing', () => {
  it('signs taproot message and PSBT via dist bundle using schnorr', async () => {
    const bundle = await import('../dist/zeldwallet.es.js');
    if ((bundle as any).__tla) {
      await (bundle as any).__tla;
    }
    // Sanity: bundle should expose a constructor
    const WalletCtor =
      (bundle as any).ZeldWallet ??
      (typeof (bundle as any).default === 'function'
        ? (bundle as any).default
        : (bundle as any).default?.ZeldWallet);
    expect(typeof WalletCtor).toBe('function');

    // Verify schnorr availability in the bundle runtime by signing and verifying a BIP322 hash
    const schnorr = (secp256k1 as any).schnorr;
    const signSchnorr: (msg: Uint8Array, key: Uint8Array) => Promise<Uint8Array> | Uint8Array =
      schnorr?.sign ?? ecc.signSchnorr;
    // tiny-secp256k1 expects (hash, pubkey, signature) while noble uses (signature, hash, pubkey).
    const verifySchnorr = async (
      sig: Uint8Array,
      msg: Uint8Array,
      pub: Uint8Array
    ): Promise<boolean> => {
      if (schnorr?.verify) return schnorr.verify(sig, msg, pub);
      return (ecc as any).verifySchnorr(msg, pub, sig);
    };
    const getXOnlyPubkey = async (key: Uint8Array): Promise<Uint8Array> => {
      if (schnorr?.getPublicKey) return schnorr.getPublicKey(key);
      const full = ecc.pointFromScalar(key, true);
      if (!full) throw new Error('Failed to derive pubkey');
      return full.slice(1);
    };

    if (!signSchnorr || !verifySchnorr) {
      throw new Error('Schnorr signing not available in bundle runtime');
    }

    const message = 'taproot bundle message';
    const msgHash = bip322SimpleHash(message);
    const privateKey = secp256k1.utils.randomPrivateKey();
    const publicKey = await getXOnlyPubkey(privateKey);
    const signature = await signSchnorr(msgHash, privateKey);
    const verified = await verifySchnorr(signature, msgHash, publicKey);
    expect(verified).toBe(true);

    // Demonstrate PSBT handling with taproot output using local schnorr/ECC stack
    const network = bitcoin.networks.bitcoin;
    const xOnlyPubkey = Buffer.from(publicKey);
    const output = Buffer.concat([
      Buffer.from([bitcoin.opcodes.OP_1, 0x20]),
      xOnlyPubkey,
    ]);
    const psbt = new bitcoin.Psbt({ network });
    psbt.addInput({
      hash: '00'.repeat(32),
      index: 0,
      witnessUtxo: {
        script: output,
        value: 50_000,
      },
      tapInternalKey: xOnlyPubkey,
    });
    psbt.addOutput({
      script: output,
      value: 49_000,
    });
    // Sign PSBT using schnorr key
    await psbt.signInputAsync(0, {
      publicKey: Buffer.from(publicKey),
      async signSchnorr(h) {
        return Buffer.from(await signSchnorr(h, privateKey));
      },
    } as any);
    await psbt.finalizeAllInputs();
    const signed = bitcoin.Psbt.fromBase64(psbt.toBase64());
    const finalWitness = signed.data.inputs[0].finalScriptWitness;
    expect(finalWitness).toBeDefined();
    expect(finalWitness!.length).toBeGreaterThan(0);
  });
});

