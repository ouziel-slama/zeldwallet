/**
 * Crypto utilities shared across storage and backup helpers.
 * Provides PBKDF2-based AES-GCM key derivation and simple
 * password-based encryption/decryption helpers.
 */

import { AES_CONFIG, PBKDF2_CONFIG, ENCRYPTED_RECORD_VERSION } from '../storage/constants';

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
}

/** Payload returned by password-based encryption helpers */
export interface PasswordEncryptedPayload {
  version: number;
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
  /** Optional PBKDF2 iterations used during encryption (backward compatible) */
  iterations?: number;
}

/**
 * Derive an HMAC key from a password using PBKDF2.
 */
async function deriveHmacKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterationsOverride?: number
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    PBKDF2_CONFIG.NAME,
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: PBKDF2_CONFIG.NAME,
      salt: toArrayBuffer(salt),
      iterations: iterationsOverride ?? PBKDF2_CONFIG.ITERATIONS,
      hash: PBKDF2_CONFIG.HASH,
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Compute an HMAC-SHA256 over the provided payload using a password-derived key.
 */
export async function computeHmacSha256(
  payload: Uint8Array,
  password: string,
  salt: Uint8Array,
  iterationsOverride?: number
): Promise<Uint8Array> {
  const key = await deriveHmacKeyFromPassword(password, salt, iterationsOverride);
  const mac = await crypto.subtle.sign('HMAC', key, toArrayBuffer(payload));
  return new Uint8Array(mac);
}

/**
 * Constant-time comparison of two byte arrays.
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * Derive an AES-GCM key from a password and salt using PBKDF2.
 */
export async function deriveAesKeyFromPassword(
  password: string,
  salt: Uint8Array,
  extractable: boolean = false,
  usages: KeyUsage[] = ['encrypt', 'decrypt'],
  iterationsOverride?: number
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    PBKDF2_CONFIG.NAME,
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: iterationsOverride ?? PBKDF2_CONFIG.ITERATIONS,
      hash: PBKDF2_CONFIG.HASH,
    },
    keyMaterial,
    { name: AES_CONFIG.NAME, length: AES_CONFIG.LENGTH },
    extractable,
    usages
  );
}

/**
 * Encrypt arbitrary bytes with a password using PBKDF2 + AES-GCM.
 * Returns the envelope with salt + iv + ciphertext for easy transport.
 */
export async function encryptWithPassword(
  plaintext: Uint8Array,
  password: string,
  iterationsOverride?: number
): Promise<PasswordEncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_CONFIG.SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(AES_CONFIG.IV_LENGTH));
  const iterations = iterationsOverride ?? PBKDF2_CONFIG.ITERATIONS;

  const key = await deriveAesKeyFromPassword(password, salt, false, ['encrypt'], iterations);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: AES_CONFIG.NAME, iv: toArrayBuffer(iv) }, key, toArrayBuffer(plaintext))
  );

  return {
    version: ENCRYPTED_RECORD_VERSION,
    salt,
    iv,
    ciphertext,
    iterations,
  };
}

/**
 * Decrypt bytes produced by encryptWithPassword (salt + iv + ciphertext).
 */
export async function decryptWithPassword(
  encrypted: PasswordEncryptedPayload | Uint8Array,
  password: string
): Promise<Uint8Array> {
  const payload = normalizeEncryptedPayload(encrypted);

  const key = await deriveAesKeyFromPassword(
    password,
    payload.salt,
    false,
    ['decrypt'],
    payload.iterations
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: AES_CONFIG.NAME, iv: toArrayBuffer(payload.iv) },
    key,
    toArrayBuffer(payload.ciphertext)
  );

  return new Uint8Array(plaintext);
}

/**
 * Normalize legacy combined payloads into the typed envelope.
 */
function normalizeEncryptedPayload(
  encrypted: PasswordEncryptedPayload | Uint8Array
): PasswordEncryptedPayload {
  if (encrypted instanceof Uint8Array) {
    const salt = encrypted.slice(0, PBKDF2_CONFIG.SALT_LENGTH);
    const iv = encrypted.slice(
      PBKDF2_CONFIG.SALT_LENGTH,
      PBKDF2_CONFIG.SALT_LENGTH + AES_CONFIG.IV_LENGTH
    );
    const ciphertext = encrypted.slice(PBKDF2_CONFIG.SALT_LENGTH + AES_CONFIG.IV_LENGTH);

    return {
      version: ENCRYPTED_RECORD_VERSION,
      salt,
      iv,
      ciphertext,
      iterations: PBKDF2_CONFIG.ITERATIONS,
    };
  }

  return encrypted;
}

