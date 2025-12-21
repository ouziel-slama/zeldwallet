/**
 * SecureStorage
 * 
 * Handles encrypted storage of sensitive data using IndexedDB and Web Crypto API.
 * Supports both password-protected mode and passwordless mode.
 */

import { openDB, deleteDB, IDBPDatabase } from 'idb';
import {
  DB_NAME,
  DB_VERSION,
  STORES,
  META_KEYS,
  PBKDF2_CONFIG,
  AES_CONFIG,
  STORAGE_VERSION,
  ENCRYPTED_RECORD_VERSION,
  KEY_ENVELOPE_VERSION,
  DATA_KEYS,
} from './constants';
import type { EncryptedData, StorageMetadata, StoredKeyEnvelope } from '../types';
import { randomBytes } from '../utils/encoding';
import { deriveAesKeyFromPassword } from '../utils/crypto';

/**
 * Normalize a Uint8Array into a standalone ArrayBuffer slice to satisfy Web Crypto typings.
 */
function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
}

interface ZeldWalletDB {
  data: {
    key: string;
    value: EncryptedData;
  };
  meta: {
    key: string;
    value: Uint8Array | CryptoKey | StorageMetadata | StoredKeyEnvelope;
  };
}

/**
 * SecureStorage class for encrypted data persistence
 */
export class SecureStorage {
  private db: IDBPDatabase<ZeldWalletDB> | null = null;
  private encryptionKey: CryptoKey | null = null;
  private isPasswordProtected: boolean = false;
  private pbkdf2Iterations?: number;

  constructor(options?: { pbkdf2Iterations?: number }) {
    this.pbkdf2Iterations = options?.pbkdf2Iterations;
  }

  /**
   * Resolve a PBKDF2 iteration override from environment variables.
   * Useful to speed up CI/tests without weakening the default shipped cost.
   */
  private getEnvIterationOverride(): number | undefined {
    if (typeof process === 'undefined' || !process?.env) return undefined;

    const raw =
      process.env.ZELDWALLET_PBKDF2_ITERATIONS ??
      // Default lower cost in test environments to avoid long-running specs.
      (process.env.NODE_ENV === 'test' ||
      process.env.VITEST ||
      process.env.VITEST_POOL_ID ||
      process.env.VITEST_WORKER_ID
        ? '1'
        : undefined);

    if (!raw) return undefined;

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;

    // In production builds, ignore low iteration overrides to avoid accidental weakening.
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'production' &&
      parsed < PBKDF2_CONFIG.ITERATIONS
    ) {
      return undefined;
    }

    return parsed;
  }

  /**
   * Resolve the PBKDF2 iteration count in priority order:
   * 1) explicit override passed to constructor (per-session opt-in)
   * 2) persisted metadata from prior setup
   * 3) environment override (e.g., test)
   * 4) default from PBKDF2_CONFIG
   */
  private resolveIterations(metadata?: StorageMetadata | null): number {
    if (metadata?.pbkdf2Iterations !== undefined) {
      // Existing storage: always respect the persisted cost to avoid unlock failures.
      return metadata.pbkdf2Iterations;
    }

    // New storage (no metadata or no stored iterations): allow per-session override,
    // then environment override, otherwise fall back to the default.
    const candidate =
      this.pbkdf2Iterations ??
      this.getEnvIterationOverride() ??
      PBKDF2_CONFIG.ITERATIONS;

    // In any production-like build, enforce the default cost as a floor even if
    // process is undefined (e.g., in bundled browser artifacts).
    if (this.isProductionLike() && candidate < PBKDF2_CONFIG.ITERATIONS) {
      return PBKDF2_CONFIG.ITERATIONS;
    }

    return candidate;
  }

  /**
   * When issuing a new password-derived key, enforce a sensible floor if metadata already exists.
   * This avoids permanently low KDF costs that were set in test/dev environments.
   */
  private normalizeIterationsForNewKey(baseIterations: number, metadata?: StorageMetadata | null): number {
    if (!metadata || metadata.pbkdf2Iterations === undefined) {
      return this.isProductionLike()
        ? Math.max(baseIterations, PBKDF2_CONFIG.ITERATIONS)
        : baseIterations;
    }
    return Math.max(
      baseIterations,
      this.isProductionLike() ? PBKDF2_CONFIG.ITERATIONS : metadata.pbkdf2Iterations
    );
  }

  /**
   * Initialize the secure storage
   * @param password - Optional password for encryption. If not provided, uses stored key.
   */
  async init(password?: string, options?: { readOnly?: boolean }): Promise<void> {
    const readOnly = options?.readOnly ?? false;
    this.db = this.db ?? (await this.openDatabase());

    const [metadata, hasWalletPayload] = await Promise.all([
      this.getMetadata(),
      this.hasWalletPayload(),
    ]);

    if (readOnly && !metadata && !hasWalletPayload) {
      // Do not create any storage artifacts when explicitly in read-only mode.
      throw new Error('No wallet found. Create or restore a wallet first.');
    }

    if (password) {
      // If storage already exists in passwordless mode, force explicit migration flow
      if (hasWalletPayload && metadata && metadata.hasPassword === false) {
        throw new Error('Wallet created without password. Unlock, then call setPassword().');
      }

      // Secure mode: derive key from password
      const salt = metadata?.hasPassword ? await this.requireSalt() : await this.getOrCreateSalt();
      const iterations = this.resolveIterations(metadata);
      this.encryptionKey = await this.deriveKeyFromPassword(password, salt, iterations);
      this.isPasswordProtected = true;

      if (!readOnly) {
        await this.updateMetadata({
          hasPassword: true,
          pbkdf2Iterations: iterations,
        });
      }
      return;
    }

    if (metadata?.hasPassword && hasWalletPayload) {
      // Storage expects a password but none was provided
      throw new Error('Password required to unlock storage');
    }

    // Simple mode: use or create a stored key. If metadata is stale but no wallet
    // payload exists yet, allow passwordless setup and scrub the unused salt.
    if (!hasWalletPayload && metadata?.hasPassword && !readOnly) {
      try {
        await this.db.delete(STORES.META, META_KEYS.SALT);
      } catch {
        // Best-effort cleanup; safe to ignore failures in legacy/fake-indexeddb.
      }
    }

    this.encryptionKey = await this.getOrCreateStoredKey(hasWalletPayload);
    this.isPasswordProtected = false;

    if (!readOnly) {
      await this.updateMetadata({
        hasPassword: false,
        pbkdf2Iterations: undefined,
      });
    }
  }

  /**
   * Open the IndexedDB database
   */
  private async openDatabase(): Promise<IDBPDatabase<ZeldWalletDB>> {
    return openDB<ZeldWalletDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create data store for encrypted data
        if (!db.objectStoreNames.contains(STORES.DATA)) {
          db.createObjectStore(STORES.DATA);
        }
        // Create meta store for encryption keys, salt, etc.
        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META);
        }
      },
    });
  }

  /**
   * Check if storage exists (has been initialized before)
   */
  async exists(): Promise<boolean> {
    // Existence should reflect an actual wallet payload (mnemonic) rather
    // than metadata alone, so aborted/incomplete inits don't block creation.
    return this.hasWalletPayload();
  }

  /**
   * Determine if a wallet payload exists (mnemonic present in data store).
   * Metadata alone should not mark the wallet as existing.
   */
  private async hasWalletPayload(): Promise<boolean> {
    const db = this.db ?? (this.db = await this.openDatabase());
    const mnemonicRecord = await db.get(STORES.DATA, DATA_KEYS.MNEMONIC);
    return mnemonicRecord !== undefined && mnemonicRecord !== null;
  }

  /**
   * Get storage metadata
   */
  private async getMetadata(): Promise<StorageMetadata | null> {
    const db = this.db || await this.openDatabase();
    const metadata = await db.get(STORES.META, META_KEYS.METADATA);
    return metadata as StorageMetadata | null;
  }

  /**
   * Update storage metadata
   */
  private async updateMetadata(updates: Partial<StorageMetadata>): Promise<void> {
    if (!this.db) {
      this.db = await this.openDatabase();
    }
    const db = this.db;
    
    const existing = await this.getMetadata();
    const metadata: StorageMetadata = {
      version: existing?.version ?? STORAGE_VERSION,
      hasPassword: updates.hasPassword ?? existing?.hasPassword ?? false,
      hasBackup: updates.hasBackup ?? existing?.hasBackup ?? false,
      lastBackupAt: updates.lastBackupAt ?? existing?.lastBackupAt,
      pbkdf2Iterations: updates.pbkdf2Iterations ?? existing?.pbkdf2Iterations,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    
    await db.put(STORES.META, metadata, META_KEYS.METADATA);
  }

  /**
   * Get or create salt for PBKDF2 key derivation
   */
  private async getOrCreateSalt(): Promise<Uint8Array> {
    if (!this.db) throw new Error('Storage not initialized');
    
    let salt = await this.db.get(STORES.META, META_KEYS.SALT) as Uint8Array | undefined;
    if (salt) return salt;
    
    salt = randomBytes(PBKDF2_CONFIG.SALT_LENGTH);
    await this.db.put(STORES.META, salt, META_KEYS.SALT);
    return salt;
  }

  /**
   * Require an existing salt when storage is already password-protected.
   */
  private async requireSalt(): Promise<Uint8Array> {
    if (!this.db) throw new Error('Storage not initialized');
    const salt = (await this.db.get(STORES.META, META_KEYS.SALT)) as Uint8Array | undefined;
    if (!salt) {
      throw new Error('Missing salt for password-protected storage');
    }
    return salt;
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  private async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array,
    iterations: number
  ): Promise<CryptoKey> {
    return deriveAesKeyFromPassword(password, salt, false, ['encrypt', 'decrypt'], iterations);
  }

  /**
   * Get or create a stored encryption key (passwordless mode)
   */
  private async getOrCreateStoredKey(requireExistingKey: boolean = false): Promise<CryptoKey> {
    if (!this.db) throw new Error('Storage not initialized');
    
    const existing = (await this.db.get(STORES.META, META_KEYS.ENCRYPTION_KEY)) as
      | Uint8Array
      | StoredKeyEnvelope
      | CryptoKey
      | undefined;
    if (existing) {
      return this.materializeStoredKey(existing);
    }

    if (requireExistingKey) {
      // Wallet data exists but the stored key is missing: fail fast to avoid silently
      // rotating the master key and bricking existing ciphertext.
      throw new Error('Missing encryption key for passwordless wallet; storage may be corrupted.');
    }

    // Generate a non-extractable key and persist it directly when supported.
    const generated = await crypto.subtle.generateKey(
      { name: AES_CONFIG.NAME, length: AES_CONFIG.LENGTH },
      false,
      ['encrypt', 'decrypt']
    );

    try {
      await this.db.put(STORES.META, generated, META_KEYS.ENCRYPTION_KEY);
      return generated;
    } catch (error) {
      // Safari/older Firefox cannot persist CryptoKey into IndexedDB. Fall back to
      // storing an extractable envelope while keeping the in-memory key non-extractable.
      console.warn(
        '[ZeldWallet][passwordless] Unable to persist non-extractable CryptoKey; ' +
        'falling back to raw key in IndexedDB (extractable). This weakens passwordless mode.',
        error
      );
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(
          'Your browser cannot store the passwordless key as non-extractable. ' +
          'The key is stored in plaintext and is easier to steal if this page is compromised.'
        );
      }

      const extractable = await crypto.subtle.generateKey(
        { name: AES_CONFIG.NAME, length: AES_CONFIG.LENGTH },
        true,
        ['encrypt', 'decrypt']
      );
      const raw = new Uint8Array(
        await crypto.subtle.exportKey('raw', extractable)
      );

      const envelope: StoredKeyEnvelope = {
        version: KEY_ENVELOPE_VERSION,
        format: 'raw',
        keyBytes: raw,
      };

      await this.db.put(STORES.META, envelope, META_KEYS.ENCRYPTION_KEY);

      // Re-import as non-extractable for runtime use.
      return this.importStoredKeyEnvelope(envelope);
    }
  }

  /**
   * Convert stored key material (CryptoKey or legacy envelope/raw) into a CryptoKey.
   * Migrates legacy formats to a stored CryptoKey when possible.
   */
  private async materializeStoredKey(
    stored: Uint8Array | StoredKeyEnvelope | CryptoKey
  ): Promise<CryptoKey> {
    if (stored instanceof CryptoKey) {
      return stored;
    }

    const envelope = this.normalizeStoredKeyEnvelope(stored);
    const key = await this.importStoredKeyEnvelope(envelope);

    // Best-effort migrate to stored CryptoKey to avoid keeping raw bytes on disk.
    if (this.db) {
      void this.db.put(STORES.META, key, META_KEYS.ENCRYPTION_KEY);
    }

    return key;
  }

  /**
   * Import a stored envelope into a non-extractable CryptoKey
   */
  private async importStoredKeyEnvelope(envelope: StoredKeyEnvelope): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      'raw',
      toArrayBuffer(envelope.keyBytes),
      { name: AES_CONFIG.NAME, length: AES_CONFIG.LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Normalize legacy raw key bytes into a versioned envelope.
   */
  private normalizeStoredKeyEnvelope(raw: Uint8Array | StoredKeyEnvelope): StoredKeyEnvelope {
    if ((raw as StoredKeyEnvelope).format === 'raw') {
      return raw as StoredKeyEnvelope;
    }

    // Legacy format: bare Uint8Array
    const envelope: StoredKeyEnvelope = {
      version: KEY_ENVELOPE_VERSION,
      format: 'raw',
      keyBytes: raw as Uint8Array,
    };

    // Persist normalized envelope for future reads
    if (this.db) {
      void this.db.put(STORES.META, envelope, META_KEYS.ENCRYPTION_KEY);
    }

    return envelope;
  }

  /**
   * Encrypt data using AES-GCM
   */
  private async encrypt(data: Uint8Array): Promise<EncryptedData> {
    if (!this.encryptionKey) throw new Error('Storage not initialized');
    
    const iv = randomBytes(AES_CONFIG.IV_LENGTH);
    const ciphertext = await crypto.subtle.encrypt(
      { name: AES_CONFIG.NAME, iv: toArrayBuffer(iv) },
      this.encryptionKey,
      toArrayBuffer(data)
    );
    
    return {
      version: ENCRYPTED_RECORD_VERSION,
      iv,
      ciphertext: new Uint8Array(ciphertext),
    };
  }

  /**
   * Decrypt data using AES-GCM
   */
  private async decrypt(encrypted: EncryptedData): Promise<Uint8Array> {
    if (!this.encryptionKey) throw new Error('Storage not initialized');

    const normalized = this.normalizeEncryptedData(encrypted);

    try {
      const plaintext = await crypto.subtle.decrypt(
        { name: AES_CONFIG.NAME, iv: toArrayBuffer(normalized.iv) },
        this.encryptionKey,
        toArrayBuffer(normalized.ciphertext)
      );

      return new Uint8Array(plaintext);
    } catch {
      throw new Error('Decryption failed: data may be corrupted or password is incorrect');
    }
  }

  /**
   * Normalize legacy encrypted payloads and validate structure.
   */
  private normalizeEncryptedData(encrypted: EncryptedData): EncryptedData {
    const version = encrypted.version ?? ENCRYPTED_RECORD_VERSION;
    if (version !== ENCRYPTED_RECORD_VERSION) {
      throw new Error(`Unsupported encrypted payload version: ${version}`);
    }

    if (!encrypted.iv || encrypted.iv.length !== AES_CONFIG.IV_LENGTH) {
      throw new Error('Invalid encrypted payload: IV missing or wrong length');
    }
    if (!encrypted.ciphertext || encrypted.ciphertext.length === 0) {
      throw new Error('Invalid encrypted payload: ciphertext missing');
    }

    return {
      version,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
    };
  }

  /**
   * Detect production builds without relying solely on process.env.
   * Browser bundles may tree-shake process, so we also look for Vite/import.meta flags.
   */
  private isProductionLike(): boolean {
    const isProcessProd =
      typeof process !== 'undefined' &&
      process?.env &&
      process.env.NODE_ENV === 'production';
    const isImportMetaProd =
      typeof import.meta !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean((import.meta as any).env?.PROD);

    return isProcessProd || isImportMetaProd;
  }

  /**
   * Store encrypted data
   */
  async set(key: string, value: Uint8Array): Promise<void> {
    if (!this.db) {
      this.db = await this.openDatabase();
    }
    if (!this.encryptionKey) throw new Error('Storage not initialized');

    const encrypted = await this.encrypt(value);
    const db = this.db;
    await db.put(STORES.DATA, encrypted, key);
    await this.updateMetadata({});
  }

  /**
   * Retrieve and decrypt data
   */
  async get(key: string): Promise<Uint8Array | null> {
    if (!this.db) {
      this.db = await this.openDatabase();
    }
    if (!this.encryptionKey) throw new Error('Storage not initialized');
    
    const encrypted = await this.db!.get(STORES.DATA, key);
    if (!encrypted) return null;
    
    return this.decrypt(encrypted);
  }

  /**
   * Delete a key from storage
   */
  async delete(key: string): Promise<void> {
    if (!this.db) {
      this.db = await this.openDatabase();
    }
    await this.db!.delete(STORES.DATA, key);
    await this.updateMetadata({});
  }

  /**
   * Check if storage has password protection
   */
  async hasPassword(): Promise<boolean> {
    const metadata = await this.getMetadata();
    return metadata?.hasPassword ?? false;
  }

  /**
   * Check if a backup was created at least once.
   */
  async hasBackup(): Promise<boolean> {
    const metadata = await this.getMetadata();
    return metadata?.hasBackup ?? false;
  }

  /**
   * Mark backup metadata as completed with the provided timestamp.
   */
  async markBackupCompleted(timestamp?: number): Promise<void> {
    await this.updateMetadata({
      hasBackup: true,
      lastBackupAt: timestamp ?? Date.now(),
    });
  }

  /**
   * Expose the PBKDF2 iteration count used for the current storage.
   * Useful for backup metadata so restores reuse the same KDF cost.
   */
  async getPbkdf2Iterations(): Promise<number | undefined> {
    const metadata = await this.getMetadata();
    return metadata?.pbkdf2Iterations;
  }

  /**
   * Add password protection to passwordless storage
   * Re-encrypts all data with the new password-derived key
   */
  async setPassword(password: string): Promise<void> {
    if (!this.db || !this.encryptionKey) throw new Error('Storage not initialized');
    if (this.isPasswordProtected) throw new Error('Storage already has a password');
    
    // Export all current data (decrypted)
    const allData = await this.exportAllDecrypted();
    const previousKey = this.encryptionKey;
    const previousHasPassword = this.isPasswordProtected;
    const existingMetadata = await this.getMetadata();

    // Generate new salt and derive key from password
    const salt = randomBytes(PBKDF2_CONFIG.SALT_LENGTH);
    const iterations = this.normalizeIterationsForNewKey(
      this.resolveIterations(existingMetadata),
      existingMetadata
    );

    // Pre-encrypt with the new key before opening the transaction
    const encryptedEntries: Array<{ key: string; encrypted: EncryptedData }> = [];
    const newKey = await this.deriveKeyFromPassword(password, salt, iterations);

    try {
      this.encryptionKey = newKey;
      for (const [key, value] of allData) {
        encryptedEntries.push({ key, encrypted: await this.encrypt(value) });
      }

      const tx = this.db.transaction([STORES.DATA, STORES.META], 'readwrite');
      const dataStore = tx.objectStore(STORES.DATA);
      const metaStore = tx.objectStore(STORES.META);

      await dataStore.clear();
      for (const { key, encrypted } of encryptedEntries) {
        await dataStore.put(encrypted, key);
      }

      await metaStore.put(salt, META_KEYS.SALT);
      await metaStore.delete(META_KEYS.ENCRYPTION_KEY);

      const metadata: StorageMetadata = {
        version: existingMetadata?.version ?? STORAGE_VERSION,
        hasPassword: true,
        hasBackup: existingMetadata?.hasBackup ?? false,
        lastBackupAt: existingMetadata?.lastBackupAt,
        pbkdf2Iterations: iterations,
        createdAt: existingMetadata?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      await metaStore.put(metadata, META_KEYS.METADATA);

      await tx.done;

      this.encryptionKey = newKey;
      this.isPasswordProtected = true;
    } catch (error) {
      // Transaction rollback keeps previous data/meta intact
      this.encryptionKey = previousKey;
      this.isPasswordProtected = previousHasPassword;
      throw error;
    } finally {
      this.wipeDecryptedData(allData);
    }
  }

  /**
   * Change the password
   */
  async changePassword(
    oldPassword: string,
    newPassword: string,
    options?: { iterations?: number }
  ): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');
    if (!this.isPasswordProtected) throw new Error('Storage does not have a password');
    
    // Verify old password by trying to derive the same key
    const existingMetadata = await this.getMetadata();
    const salt = await this.db.get(STORES.META, META_KEYS.SALT) as Uint8Array;
    if (!salt) throw new Error('Salt not found');
    
    const iterations = this.resolveIterations(existingMetadata);
    const oldKey = await this.deriveKeyFromPassword(oldPassword, salt, iterations);
    
    // Export all data using old key
    const savedKey = this.encryptionKey;
    const previousHasPassword = this.isPasswordProtected;
    this.encryptionKey = oldKey;
    
    let allData: Map<string, Uint8Array>;
    try {
      allData = await this.exportAllDecrypted();
    } catch {
      this.encryptionKey = savedKey;
      throw new Error('Invalid password');
    }
    
    // Generate new salt and derive new key
    const newSalt = randomBytes(PBKDF2_CONFIG.SALT_LENGTH);
    const candidateIterations = options?.iterations
      ? Math.max(options.iterations, iterations)
      : iterations;
    const newIterations = this.normalizeIterationsForNewKey(candidateIterations, existingMetadata);

    const encryptedEntries: Array<{ key: string; encrypted: EncryptedData }> = [];
    try {
      const newKey = await this.deriveKeyFromPassword(newPassword, newSalt, newIterations);
      this.encryptionKey = newKey;

      for (const [key, value] of allData) {
        encryptedEntries.push({ key, encrypted: await this.encrypt(value) });
      }

      const tx = this.db.transaction([STORES.DATA, STORES.META], 'readwrite');
      const dataStore = tx.objectStore(STORES.DATA);
      const metaStore = tx.objectStore(STORES.META);

      await dataStore.clear();
      for (const { key, encrypted } of encryptedEntries) {
        await dataStore.put(encrypted, key);
      }

      await metaStore.put(newSalt, META_KEYS.SALT);
      // Ensure any legacy stored key is removed in password mode
      await metaStore.delete(META_KEYS.ENCRYPTION_KEY);

      const metadata: StorageMetadata = {
        version: existingMetadata?.version ?? STORAGE_VERSION,
        hasPassword: true,
        hasBackup: existingMetadata?.hasBackup ?? false,
        lastBackupAt: existingMetadata?.lastBackupAt,
        pbkdf2Iterations: newIterations,
        createdAt: existingMetadata?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      await metaStore.put(metadata, META_KEYS.METADATA);

      await tx.done;

      this.encryptionKey = newKey;
      this.isPasswordProtected = true;
    } catch (error) {
      // Transaction rollback keeps previous data/meta intact
      this.encryptionKey = savedKey;
      this.isPasswordProtected = previousHasPassword;
      throw error;
    } finally {
      this.wipeDecryptedData(allData);
    }
  }

  /**
   * Remove password protection (revert to passwordless mode)
   */
  async removePassword(currentPassword: string): Promise<void> {
    if (!this.db) throw new Error('Storage not initialized');
    if (!this.isPasswordProtected) throw new Error('Storage does not have a password');
    
    // Verify current password
    const existingMetadata = await this.getMetadata();
    const salt = await this.db.get(STORES.META, META_KEYS.SALT) as Uint8Array;
    if (!salt) throw new Error('Salt not found');
    
    const iterations = this.resolveIterations(existingMetadata);
    const currentKey = await this.deriveKeyFromPassword(currentPassword, salt, iterations);
    
    // Export all data using current password
    const savedKey = this.encryptionKey;
    const savedSalt = salt;
    const previousHasPassword = this.isPasswordProtected;
    this.encryptionKey = currentKey;
    
    let allData: Map<string, Uint8Array>;
    try {
      allData = await this.exportAllDecrypted();
    } catch {
      this.encryptionKey = savedKey;
      throw new Error('Invalid password');
    }

    // Generate a new passwordless key (store as envelope for broad browser support)
    const extractable = await crypto.subtle.generateKey(
      { name: AES_CONFIG.NAME, length: AES_CONFIG.LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', extractable));
    const envelope: StoredKeyEnvelope = {
      version: KEY_ENVELOPE_VERSION,
      format: 'raw',
      keyBytes: raw,
    };

    const runtimeKey = await this.importStoredKeyEnvelope(envelope);
    this.encryptionKey = runtimeKey;
    this.isPasswordProtected = false;

    // Pre-encrypt all data with the new key before opening the transaction.
    const encryptedEntries: Array<{ key: string; encrypted: EncryptedData }> = [];
    for (const [key, value] of allData) {
      encryptedEntries.push({ key, encrypted: await this.encrypt(value) });
    }

    try {
      const tx = this.db.transaction([STORES.DATA, STORES.META], 'readwrite');
      const dataStore = tx.objectStore(STORES.DATA);
      const metaStore = tx.objectStore(STORES.META);

      await dataStore.clear();
      for (const { key, encrypted } of encryptedEntries) {
        await dataStore.put(encrypted, key);
      }

      await metaStore.put(envelope, META_KEYS.ENCRYPTION_KEY);
      await metaStore.delete(META_KEYS.SALT);

      const metadata: StorageMetadata = {
        version: existingMetadata?.version ?? STORAGE_VERSION,
        hasPassword: false,
        hasBackup: false,
        lastBackupAt: undefined,
        pbkdf2Iterations: undefined,
        createdAt: existingMetadata?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      await metaStore.put(metadata, META_KEYS.METADATA);

      await tx.done;
    } catch (error) {
      // Roll back to previous key/material on failure
      this.encryptionKey = savedKey;
      this.isPasswordProtected = previousHasPassword;
      await this.db.put(STORES.META, savedSalt, META_KEYS.SALT);
      await this.db.delete(STORES.META, META_KEYS.ENCRYPTION_KEY);
      await this.importAllEncrypted(allData);
      throw error;
    } finally {
      this.wipeDecryptedData(allData);
    }
  }

  /**
   * Export all data in decrypted form
   */
  private async exportAllDecrypted(): Promise<Map<string, Uint8Array>> {
    if (!this.db || !this.encryptionKey) throw new Error('Storage not initialized');
    
    const result = new Map<string, Uint8Array>();
    const keys = await this.db.getAllKeys(STORES.DATA);
    
    for (const key of keys) {
      const keyStr = String(key);
      const data = await this.get(keyStr);
      if (data) {
        result.set(keyStr, data);
      }
    }
    
    return result;
  }

  /**
   * Import and encrypt all data
   */
  private async importAllEncrypted(data: Map<string, Uint8Array>): Promise<void> {
    if (!this.db || !this.encryptionKey) throw new Error('Storage not initialized');

    // Pre-encrypt outside the transaction to avoid TransactionInactive errors
    // in fake-indexeddb when awaiting asynchronous crypto operations.
    const encryptedEntries: Array<{ key: string; encrypted: EncryptedData }> = [];
    for (const [key, value] of data) {
      encryptedEntries.push({ key, encrypted: await this.encrypt(value) });
    }

    const tx = this.db.transaction(STORES.DATA, 'readwrite');
    const store = tx.objectStore(STORES.DATA);

    await store.clear();

    for (const { key, encrypted } of encryptedEntries) {
      await store.put(encrypted, key);
    }

    await tx.done;
  }

  /**
   * Best-effort zeroization of decrypted data held during migrations.
   */
  private wipeDecryptedData(data: Map<string, Uint8Array>): void {
    for (const [, value] of data) {
      value.fill(0);
    }
    data.clear();
  }

  /**
   * Clear all data and reset storage
   */
  async clear(): Promise<void> {
    // In test environments, avoid heavy/deleteDB paths that can hang fake-indexeddb.
    const isTest =
      typeof process !== 'undefined' &&
      (process.env.NODE_ENV === 'test' ||
        process.env.VITEST ||
        process.env.VITEST_POOL_ID ||
        process.env.VITEST_WORKER_ID);

    const db = this.db ?? (await this.openDatabase());

    try {
      await db.clear(STORES.DATA);
      await db.clear(STORES.META);
    } catch {
      // ignore
    }

    try {
      db.close();
    } catch {
      /* noop */
    }

    this.db = null;
    this.encryptionKey = null;
    this.isPasswordProtected = false;

    if (isTest) {
      // Avoid deleteDB in tests to prevent fake-indexeddb hangs; stores are already cleared.
      return;
    }

    // Fire-and-forget delete with a small timeout safeguard to avoid Vitest hangs.
    try {
      await Promise.race([
        deleteDB(DB_NAME, { blocked: () => {} }),
        new Promise<void>((resolve) => setTimeout(resolve, 50)),
      ]);
    } catch {
      /* noop */
    }
  }

  /**
   * Request persistent storage from the browser
   */
  async requestPersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      return navigator.storage.persist();
    }
    return false;
  }

  /**
   * Check if storage is persistent
   */
  async isPersistent(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      return navigator.storage.persisted();
    }
    return false;
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.encryptionKey = null;
    this.isPasswordProtected = false;
  }
}

