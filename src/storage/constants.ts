/**
 * SecureStorage Constants
 */

/** Database name for IndexedDB */
export const DB_NAME = 'zeldwallet';

/** Database version */
export const DB_VERSION = 1;

/** Object store names */
export const STORES = {
  /** Store for encrypted wallet data */
  DATA: 'data',
  /** Store for metadata (salt, encryption key, etc.) */
  META: 'meta',
} as const;

/** Metadata keys */
export const META_KEYS = {
  /** Salt for PBKDF2 key derivation */
  SALT: 'salt',
  /** Stored encryption key (passwordless mode) */
  ENCRYPTION_KEY: 'encryption-key',
  /** Storage metadata */
  METADATA: 'metadata',
} as const;

/** Data keys */
export const DATA_KEYS = {
  /** Encrypted mnemonic */
  MNEMONIC: 'mnemonic',
  /** Optional BIP39 passphrase (encrypted alongside mnemonic) */
  PASSPHRASE: 'passphrase',
  /** Wallet configuration */
  CONFIG: 'config',
} as const;

/** PBKDF2 parameters */
export const PBKDF2_CONFIG = {
  /** Number of iterations (600k for strong security) */
  ITERATIONS: 600_000,
  /** Hash algorithm */
  HASH: 'SHA-256',
  /** Salt length in bytes */
  SALT_LENGTH: 16,
  /** Key derivation algorithm name */
  NAME: 'PBKDF2',
} as const;

/** AES-GCM parameters */
export const AES_CONFIG = {
  /** Algorithm name */
  NAME: 'AES-GCM',
  /** Key length in bits */
  LENGTH: 256,
  /** IV length in bytes */
  IV_LENGTH: 12,
} as const;

/** Storage format version */
export const STORAGE_VERSION = 1;

/** Stored key envelope version (for passwordless master key persistence) */
export const KEY_ENVELOPE_VERSION = 1;

/** Encrypted record version (per-record versioning for migration readiness) */
export const ENCRYPTED_RECORD_VERSION = 1;

