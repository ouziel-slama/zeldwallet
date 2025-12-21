/**
 * ZeldWallet Type Definitions
 */

// ============================================================================
// Address Types
// ============================================================================

/** Bitcoin address types supported */
export type AddressType = 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh' | 'p2tr';

/** Purpose for address derivation (WBIP compatible) */
export type AddressPurpose = 'payment' | 'ordinals' | 'stacks';

/** Network type */
export type NetworkType = 'mainnet' | 'testnet';

/** Derived address information */
export interface DerivedAddress {
  address: string;
  publicKey: string;
  path: string;
  type: AddressType;
}

/** Full address info including purpose */
export interface AddressInfo {
  address: string;
  publicKey: string;
  purpose: AddressPurpose;
  addressType: AddressType;
  derivationPath: string;
}

/** Wallet implementation type (WBIP) */
export type WalletImplementation = 'software' | 'ledger' | 'keystone';

/** Bitcoin network identifiers (WBIP/sats-connect) */
export type BitcoinNetworkName = 'Mainnet' | 'Testnet' | 'Testnet4' | 'Signet' | 'Regtest';
export type StacksNetworkName = 'mainnet' | 'testnet';
export type SparkNetworkName = 'mainnet' | 'regtest';

/** getInfo response payload (WBIP002) */
export interface GetInfoResult {
  version: string;
  platform?: 'web' | 'mobile';
  methods?: string[];
  supports: string[];
}

/** Network payload returned by WBIP getAddresses */
export interface WBIPNetworkInfo {
  bitcoin: { name: BitcoinNetworkName };
  stacks: { name: StacksNetworkName };
  spark: { name: SparkNetworkName };
}

/** getAddresses response payload (WBIP005) */
export interface WBIPAddressEntry {
  address: string;
  publicKey: string;
  purpose: AddressPurpose;
  addressType: AddressType;
  walletType: WalletImplementation;
}

/**
 * WBIP005 getAddresses response. Returned as an array for convenience while
 * keeping the spec fields as properties on the array itself.
 */
export type WBIPAddressesResult = WBIPAddressEntry[] & {
  addresses: WBIPAddressEntry[];
  network: WBIPNetworkInfo;
};

// ============================================================================
// Key Manager Types
// ============================================================================

/** Options for signing PSBT inputs */
export interface SignInputOptions {
  /** Index of the input to sign */
  index: number;
  /** Address to use for signing */
  address?: string;
  /** Optional explicit derivation path to bypass address lookups */
  derivationPath?: string;
  /** Optional Taproot merkle root (script-path signing not yet supported) */
  tapMerkleRootHex?: string;
  /** Optional Taproot leaf hash (script-path signing not yet supported) */
  tapLeafHashHex?: string;
  /** Sighash type */
  sighashTypes?: number[];
  /** Whether to finalize the input after signing */
  finalize?: boolean;
}

/** PSBT signing options */
export interface SignPsbtOptions {
  /** PSBT in base64 format */
  psbt: string;
  /** Inputs to sign */
  signInputs: SignInputOptions[];
  /** Whether to broadcast after signing */
  broadcast?: boolean;
}

// ============================================================================
// Storage Types
// ============================================================================

/** Encrypted data structure stored in IndexedDB */
export interface EncryptedData {
  /** Versioned envelope for forward-compatible migrations */
  version: number;
  /** Initialization vector */
  iv: Uint8Array;
  /** Encrypted ciphertext (includes GCM tag) */
  ciphertext: Uint8Array;
}

/** Stored key envelope for passwordless mode */
export interface StoredKeyEnvelope {
  /** Envelope version */
  version: number;
  /** Encoding format for the persisted key */
  format: 'raw';
  /** Raw key bytes (never exposed to callers) */
  keyBytes: Uint8Array;
}

/** Storage metadata */
export interface StorageMetadata {
  /** Version of the storage format */
  version: number;
  /** Whether password protection is enabled */
  hasPassword: boolean;
  /** Whether a backup has been created at least once */
  hasBackup?: boolean;
  /** Timestamp of the most recent backup (ms since epoch) */
  lastBackupAt?: number;
  /** PBKDF2 iterations used for password-derived keys (for unlock/migration) */
  pbkdf2Iterations?: number;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
}

// ============================================================================
// WBIP Provider Types
// ============================================================================

/** WBIP Provider registration options */
export interface WBIPProviderOptions {
  /** Unique identifier for the provider */
  id: string;
  /** Display name */
  name: string;
  /** Icon URL or data URI */
  icon: string;
  /** Optional web URL for the provider */
  webUrl?: string;
}

/** WBIP Provider descriptor (registered in window.wbip_providers) */
export interface WBIPProviderDescriptor {
  id: string;
  name: string;
  icon: string;
  webUrl?: string;
  methods: string[];
}

/** WBIP getAddresses request parameters */
export interface GetAddressesParams {
  purposes: AddressPurpose[];
  message?: string;
}

/** WBIP signMessage request parameters */
export interface SignMessageParams {
  address: string;
  message: string;
  protocol?: 'ecdsa' | 'bip322-simple';
}

/** WBIP signPsbt request parameters */
export interface SignPsbtParams {
  psbt: string;
  signInputs: Record<string, number[]>;
  broadcast?: boolean;
}

/** WBIP sendTransfer request parameters */
export interface SendTransferParams {
  recipients: Array<{
    address: string;
    amount: number;
  }>;
}

/** WBIP Error codes */
export enum WBIPErrorCode {
  /** User rejected the request */
  USER_REJECTED = 4001,
  /** Unauthorized - wallet not connected */
  UNAUTHORIZED = 4100,
  /** Unsupported method */
  UNSUPPORTED_METHOD = 4200,
  /** Disconnected from wallet */
  DISCONNECTED = 4900,
  /** Chain disconnected */
  CHAIN_DISCONNECTED = 4901,
  /** Method not found */
  METHOD_NOT_FOUND = -32601,
  /** Invalid params */
  INVALID_PARAMS = -32602,
  /** Internal error */
  INTERNAL_ERROR = -32603,
}

/** WBIP Error */
export interface WBIPError {
  code: WBIPErrorCode;
  message: string;
  data?: unknown;
}

// ============================================================================
// Wallet Events
// ============================================================================

/** Wallet event types */
export type WalletEvent = 'lock' | 'unlock' | 'accountsChanged' | 'networkChanged';

/** Event handler type */
export type EventHandler<T = unknown> = (data: T) => void;

// ============================================================================
// Backup Types
// ============================================================================

/** Backup structure */
export interface WalletBackup {
  /** Backup format version */
  version: number;
  /** Encrypted mnemonic payload (base64) */
  encrypted: string;
  /** Creation timestamp */
  createdAt: number;
  /** Optional label */
  label?: string;
}

/** Backup envelope for portable backups */
export interface WalletBackupEnvelope {
  version: number;
  cipher: string;
  kdf: {
    name: string;
    hash: string;
    iterations: number;
    salt: string; // base64
  };
  iv: string; // base64
  ciphertext: string; // base64 (GCM tag is bundled)
  createdAt: number;
  network?: 'mainnet' | 'testnet';
  mac?: string; // base64 HMAC over envelope fields
  macAlgo?: string;
}

// ============================================================================
// Confirmation Types
// ============================================================================

/** Types of confirmation dialogs */
export type ConfirmationType = 
  | 'connect'
  | 'sign_message'
  | 'sign_psbt'
  | 'send_transfer';

/** Confirmation dialog data */
export interface ConfirmationData {
  type: ConfirmationType;
  origin?: string;
  message?: string;
  psbt?: string;
  amount?: number;
  recipient?: string;
}

// ============================================================================
// Global Window Extensions
// ============================================================================

declare global {
  interface Window {
    wbip_providers?: WBIPProviderDescriptor[];
    [key: string]: unknown;
  }
}

export {};

