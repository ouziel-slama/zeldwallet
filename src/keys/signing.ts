/**
 * Signing Utilities
 * 
 * Message and transaction signing functions.
 */

import { Buffer as NodeBuffer } from 'buffer';
import { sha256 } from '@noble/hashes/sha256';
import * as secp256k1 from '@noble/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import { stringToBytes, bytesToBase64 } from '../utils/encoding';

type SchnorrLike = {
  sign: (msg: Uint8Array, priv: Uint8Array) => Promise<Uint8Array> | Uint8Array;
};

/** Bitcoin message prefix for signing */
const BITCOIN_MESSAGE_PREFIX = '\x18Bitcoin Signed Message:\n';

/**
 * Create the message hash for Bitcoin message signing
 */
export function createMessageHash(message: string): Uint8Array {
  const messageBytes = stringToBytes(message);
  const prefix = stringToBytes(BITCOIN_MESSAGE_PREFIX);
  const lengthBytes = encodeVarInt(messageBytes.length);
  
  // Concatenate: prefix + message_length + message
  const fullMessage = new Uint8Array(prefix.length + lengthBytes.length + messageBytes.length);
  fullMessage.set(prefix, 0);
  fullMessage.set(lengthBytes, prefix.length);
  fullMessage.set(messageBytes, prefix.length + lengthBytes.length);
  
  // Double SHA256
  return sha256(sha256(fullMessage));
}

/**
 * Encode a variable-length integer (Bitcoin varint format)
 */
function encodeVarInt(n: number): Uint8Array {
  if (n < 0xfd) {
    return new Uint8Array([n]);
  } else if (n <= 0xffff) {
    const buf = new Uint8Array(3);
    buf[0] = 0xfd;
    buf[1] = n & 0xff;
    buf[2] = (n >> 8) & 0xff;
    return buf;
  } else if (n <= 0xffffffff) {
    const buf = new Uint8Array(5);
    buf[0] = 0xfe;
    buf[1] = n & 0xff;
    buf[2] = (n >> 8) & 0xff;
    buf[3] = (n >> 16) & 0xff;
    buf[4] = (n >> 24) & 0xff;
    return buf;
  }
  throw new Error('VarInt too large');
}

/**
 * Sign a message with ECDSA and return a recoverable signature
 * @param messageHash - The hash of the message to sign
 * @param privateKey - The private key to sign with
 * @returns Base64-encoded signature
 */
export async function signMessageEcdsa(
  messageHash: Uint8Array,
  privateKey: Uint8Array
): Promise<string> {
  // Sign with recovery using noble/secp256k1 v2 API
  const signature = await secp256k1.signAsync(messageHash, privateKey, {
    lowS: true,
  });
  
  // Recovery ID + r + s (65 bytes total)
  const recoveryFlag = 27 + signature.recovery + 4; // +4 for compressed pubkey
  const signatureBytes = new Uint8Array(65);
  signatureBytes[0] = recoveryFlag;
  signatureBytes.set(signature.toCompactRawBytes(), 1);
  
  return bytesToBase64(signatureBytes);
}

/**
 * Verify an ECDSA signature
 */
export async function verifyMessageEcdsa(
  messageHash: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  // Extract r and s from signature (skip recovery byte)
  const sig = signature.slice(1);
  return secp256k1.verify(sig, messageHash, publicKey);
}

/**
 * Sign a message using a BIP-322-style hash (simple mode)
 * Uses Schnorr for Taproot-friendly signatures (still a simplified flow).
 */
export async function signMessageBip322Simple(
  message: string,
  address: string,
  network: bitcoin.Network,
  privateKey: Uint8Array,
  xOnlyPublicKey: Uint8Array,
  schnorrImpl?: SchnorrLike
): Promise<string> {
  if (!schnorrImpl?.sign) {
    throw new Error('BIP322 simple signing requires Schnorr support');
  }

  const bufferCtor = typeof globalThis.Buffer !== 'undefined' ? globalThis.Buffer : NodeBuffer;
  if (typeof globalThis.Buffer === 'undefined') {
    (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = bufferCtor;
  }

  const scriptSig = buildBip322SimpleChallenge(message);
  const scriptPubKey = bitcoin.address.toOutputScript(address, network);

  // Build the "to_spend" transaction embedding the message in the scriptSig.
  const toSpend = new bitcoin.Transaction();
  toSpend.version = 0;
  toSpend.locktime = 0;
  toSpend.addInput(bufferCtor.alloc(32, 0), 0xffffffff, 0, bufferCtor.from(scriptSig));
  toSpend.addOutput(scriptPubKey, 0);

  // Build the "to_sign" PSBT that spends the to_spend output.
  const psbt = new bitcoin.Psbt({ network });
  psbt.setVersion(0);
  psbt.setLocktime(0);
  psbt.addInput({
    hash: toSpend.getHash(),
    index: 0,
    sequence: 0,
    witnessUtxo: { script: scriptPubKey, value: 0 },
    tapInternalKey: bufferCtor.from(xOnlyPublicKey),
  });

  type PsbtWithTaprootHash = bitcoin.Psbt & { getTaprootHashForSig?: (index: number, pubkey: Buffer, sighashType: number) => Buffer };
  const psbtWithTaproot = psbt as PsbtWithTaprootHash;
  const getTaprootHashForSig = psbtWithTaproot.getTaprootHashForSig?.bind(psbt);
  if (!getTaprootHashForSig) {
    throw new Error('Taproot signing requires PSBT taproot hash support');
  }

  const sighashType = 0x00;
  const digest: Buffer = getTaprootHashForSig(0, bufferCtor.from(xOnlyPublicKey), sighashType);
  const signature = await schnorrImpl.sign(digest, privateKey);
  const finalSig =
    sighashType === 0x00
      ? bufferCtor.from(signature)
      : bufferCtor.concat([bufferCtor.from(signature), bufferCtor.from([sighashType])]);

  psbt.updateInput(0, { tapKeySig: finalSig });

  try {
    psbt.finalizeInput(0);
  } catch (error) {
    throw new Error(`Failed to finalize BIP322 signature: ${(error as Error)?.message ?? error}`);
  }

  const signedTx = psbt.extractTransaction();
  return bufferCtor.from(signedTx.toBuffer()).toString('base64');
}

function buildBip322SimpleChallenge(message: string): Uint8Array {
  const messageBytes = stringToBytes(message);
  const lengthBytes = encodeVarInt(messageBytes.length);

  const payload = new Uint8Array(1 + lengthBytes.length + messageBytes.length);
  payload[0] = 0x00;
  payload.set(lengthBytes, 1);
  payload.set(messageBytes, 1 + lengthBytes.length);

  return payload;
}

/**
 * Tweak a private key for Taproot (BIP340)
 * Used for Taproot key path spending
 */
export function tweakPrivateKey(privateKey: Uint8Array, merkleRoot?: Uint8Array): Uint8Array {
  const publicKey = secp256k1.getPublicKey(privateKey, true);
  
  // Calculate tweak: SHA256(pubkey_x || merkle_root)
  const tweakInput = merkleRoot
    ? new Uint8Array([...publicKey.slice(1), ...merkleRoot])
    : publicKey.slice(1);
  
  const tweak = sha256(new Uint8Array([
    ...stringToBytes('TapTweak'),
    ...tweakInput,
  ]));
  
  // Add tweak to private key modulo curve order
  const tweakedKey = addPrivateKeys(privateKey, tweak);
  
  return tweakedKey;
}

/**
 * Add two private keys modulo the curve order
 */
function addPrivateKeys(a: Uint8Array, b: Uint8Array): Uint8Array {
  const n = secp256k1.CURVE.n;
  const aBigInt = bytesToBigInt(a);
  const bBigInt = bytesToBigInt(b);
  const sum = (aBigInt + bBigInt) % n;
  return bigIntToBytes(sum, 32);
}

/**
 * Convert bytes to BigInt
 */
function bytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n;
  for (const byte of bytes) {
    result = (result << 8n) + BigInt(byte);
  }
  return result;
}

/**
 * Convert BigInt to bytes
 */
function bigIntToBytes(n: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) {
    bytes[i] = Number(n & 0xffn);
    n >>= 8n;
  }
  return bytes;
}

/**
 * Get the public key for a private key
 */
export function getPublicKey(privateKey: Uint8Array, compressed: boolean = true): Uint8Array {
  return secp256k1.getPublicKey(privateKey, compressed);
}

/**
 * Get the x-only public key (for Taproot)
 */
export function getXOnlyPublicKey(privateKey: Uint8Array): Uint8Array {
  const publicKey = secp256k1.getPublicKey(privateKey, true);
  // X-only is just the X coordinate (remove the prefix byte)
  return publicKey.slice(1);
}

