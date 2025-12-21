/**
 * SecureStorage Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { openDB } from 'idb';
import { SecureStorage } from '../src/storage/SecureStorage';
import { DB_NAME, DB_VERSION, META_KEYS, STORES, PBKDF2_CONFIG, DATA_KEYS } from '../src/storage/constants';
import { stringToBytes, bytesToString, bytesEqual } from '../src/utils/encoding';

describe('SecureStorage', () => {
  let storage: SecureStorage;

  beforeEach(() => {
    storage = new SecureStorage();
  });

  afterEach(async () => {
    await storage.clear();
    storage.close();
  });

  describe('initialization', () => {
    it('should initialize without password (passwordless mode)', async () => {
      await storage.init();
      expect(await storage.hasPassword()).toBe(false);
    });

    it('should initialize with password', async () => {
      await storage.init('test-password');
      expect(await storage.hasPassword()).toBe(true);
    });

    it('should create storage on first init', async () => {
      expect(await storage.exists()).toBe(false);
      await storage.init();
      expect(await storage.exists()).toBe(false);

      // Storing the mnemonic should mark the wallet as existing
      await storage.set(DATA_KEYS.MNEMONIC, stringToBytes('dummy-mnemonic'));
      expect(await storage.exists()).toBe(true);
    });
  });

  describe('data storage', () => {
    it('should store and retrieve data (passwordless)', async () => {
      await storage.init();
      
      const testData = stringToBytes('hello world');
      await storage.set('test-key', testData);
      
      const retrieved = await storage.get('test-key');
      expect(retrieved).not.toBeNull();
      expect(bytesToString(retrieved!)).toBe('hello world');
    });

    it('should store and retrieve data (with password)', async () => {
      await storage.init('my-password');
      
      const testData = stringToBytes('secret data');
      await storage.set('secret-key', testData);
      
      const retrieved = await storage.get('secret-key');
      expect(retrieved).not.toBeNull();
      expect(bytesToString(retrieved!)).toBe('secret data');
    });

    it('should return null for non-existent key', async () => {
      await storage.init();
      
      const result = await storage.get('non-existent');
      expect(result).toBeNull();
    });

    it('should delete data', async () => {
      await storage.init();
      
      const testData = stringToBytes('to be deleted');
      await storage.set('delete-me', testData);
      
      await storage.delete('delete-me');
      
      const result = await storage.get('delete-me');
      expect(result).toBeNull();
    });
  });

  describe('password management', () => {
    it('should add password to passwordless storage', async () => {
      // Start without password
      await storage.init();
      const testData = stringToBytes('important data');
      await storage.set('my-data', testData);
      
      expect(await storage.hasPassword()).toBe(false);
      
      // Add password
      await storage.setPassword('new-password');
      expect(await storage.hasPassword()).toBe(true);
      
      // Data should still be accessible
      const retrieved = await storage.get('my-data');
      expect(bytesToString(retrieved!)).toBe('important data');
    });

    it('should change password', async () => {
      await storage.init('old-password');
      const testData = stringToBytes('protected data');
      await storage.set('protected', testData);
      
      await storage.changePassword('old-password', 'new-password');
      
      // Data should still be accessible
      const retrieved = await storage.get('protected');
      expect(bytesToString(retrieved!)).toBe('protected data');
    });

    it('should allow increasing PBKDF2 iterations when changing password', async () => {
      await storage.init('old-password');
      await storage.set('iteration-key', stringToBytes('value'));

      const increasedIterations = PBKDF2_CONFIG.ITERATIONS + 100;
      await storage.changePassword('old-password', 'new-password', { iterations: increasedIterations });

      const db = await openDB(DB_NAME, DB_VERSION);
      const metadata: any = await db.get(STORES.META, META_KEYS.METADATA);
      db.close();
      expect(metadata.pbkdf2Iterations).toBe(increasedIterations);

      // Re-open with the new password to ensure data is still decryptable
      const reopened = new SecureStorage();
      await reopened.init('new-password');
      const retrieved = await reopened.get('iteration-key');
      expect(bytesToString(retrieved!)).toBe('value');
      await reopened.clear();
      reopened.close();
    });

    it('should remove password', async () => {
      await storage.init('temp-password');
      const testData = stringToBytes('was protected');
      await storage.set('key', testData);
      
      await storage.removePassword('temp-password');
      
      expect(await storage.hasPassword()).toBe(false);
      
      // Data should still be accessible
      const retrieved = await storage.get('key');
      expect(bytesToString(retrieved!)).toBe('was protected');
    });

    it('should fail with wrong password on change', async () => {
      await storage.init('correct-password');
      await storage.set('data', stringToBytes('test'));
      
      await expect(
        storage.changePassword('wrong-password', 'new-password')
      ).rejects.toThrow();
    });

    it('should persist custom PBKDF2 iterations in metadata', async () => {
      const customIterations = 10;
      const storageWithOverride = new SecureStorage({ pbkdf2Iterations: customIterations });
      await storageWithOverride.init('iter-password');
      await storageWithOverride.set('key', stringToBytes('value'));
      storageWithOverride.close();

      // Reopen without override: should still unlock using stored iteration count
      const reopened = new SecureStorage();
      await reopened.init('iter-password');
      const data = await reopened.get('key');
      expect(bytesToString(data!)).toBe('value');

      // Verify metadata stored the iteration count
      const db = await openDB(DB_NAME, DB_VERSION);
      const metadata: any = await db.get(STORES.META, META_KEYS.METADATA);
      db.close();
      expect(metadata.pbkdf2Iterations).toBe(customIterations);

      await reopened.clear();
      reopened.close();
    });
  });

  describe('password lifecycle', () => {
    it('preserves data through add → change → remove password', async () => {
      await storage.init();
      await storage.set('session', stringToBytes('persist me'));

      await storage.setPassword('pw-1');
      expect(await storage.hasPassword()).toBe(true);
      expect(bytesToString((await storage.get('session'))!)).toBe('persist me');

      await storage.changePassword('pw-1', 'pw-2');
      const reopened = new SecureStorage();
      await reopened.init('pw-2');
      expect(bytesToString((await reopened.get('session'))!)).toBe('persist me');

      await reopened.removePassword('pw-2');
      expect(await reopened.hasPassword()).toBe(false);
      const reopenedAgain = new SecureStorage();
      await reopenedAgain.init();
      expect(bytesToString((await reopenedAgain.get('session'))!)).toBe('persist me');

      await reopenedAgain.clear();
      reopenedAgain.close();
      await reopened.clear();
      reopened.close();
    });

    it('rolls back to previous password when changePassword fails mid-flow', async () => {
      await storage.init();
      await storage.setPassword('pw-1');
      await storage.set('stable', stringToBytes('stay put'));

      // Force the pre-encrypt step inside changePassword to fail
      const encryptSpy = vi
        .spyOn(storage as any, 'encrypt')
        .mockImplementationOnce(() => {
          throw new Error('forced encrypt failure');
        });

      await expect(storage.changePassword('pw-1', 'pw-2')).rejects.toThrow('forced encrypt failure');

      encryptSpy.mockRestore();

      // Still protected by the previous password and data intact
      const reopened = new SecureStorage();
      await reopened.init('pw-1');
      expect(bytesToString((await reopened.get('stable'))!)).toBe('stay put');

      // Removing the password should now work with the original secret
      await reopened.removePassword('pw-1');
      const unlocked = new SecureStorage();
      await unlocked.init();
      expect(bytesToString((await unlocked.get('stable'))!)).toBe('stay put');

      await unlocked.clear();
      unlocked.close();
      await reopened.clear();
      reopened.close();
    });
  });

  describe('persistence', () => {
    it('should persist data across storage instances', async () => {
      // First instance - store data
      await storage.init();
      await storage.set('persistent', stringToBytes('survives'));
      storage.close();
      
      // Second instance - retrieve data
      const storage2 = new SecureStorage();
      await storage2.init();
      
      const retrieved = await storage2.get('persistent');
      expect(bytesToString(retrieved!)).toBe('survives');
      
      await storage2.clear();
      storage2.close();
    });
  });

  describe('integrity checks', () => {
    it('should fail to decrypt tampered ciphertext', async () => {
      await storage.init();
      await storage.set('tamper', stringToBytes('secret'));

      const db = await openDB(DB_NAME, DB_VERSION);
      const record: any = await db.get(STORES.DATA, 'tamper');
      record.ciphertext[0] ^= 0xff;
      await db.put(STORES.DATA, record, 'tamper');
      db.close();

      await expect(storage.get('tamper')).rejects.toThrow();
    });

    it('should refuse to start password-protected storage without salt', async () => {
      await storage.init('pw');
      await storage.set('key', stringToBytes('value'));

      const db = await openDB(DB_NAME, DB_VERSION);
      await db.delete(STORES.META, META_KEYS.SALT);
      db.close();

      const storage2 = new SecureStorage();
      await expect(storage2.init('pw')).rejects.toThrow(/Missing salt/);
    });

    it('should generate distinct IVs per record', async () => {
      await storage.init();
      await storage.set('iv1', stringToBytes('same'));
      await storage.set('iv2', stringToBytes('same'));

      const db = await openDB(DB_NAME, DB_VERSION);
      const first: any = await db.get(STORES.DATA, 'iv1');
      const second: any = await db.get(STORES.DATA, 'iv2');
      db.close();

      expect(bytesEqual(first.iv, second.iv)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all data', async () => {
      await storage.init();
      await storage.set('key1', stringToBytes('value1'));
      await storage.set('key2', stringToBytes('value2'));
      
      await storage.clear();
      
      // Re-init after clear
      await storage.init();
      
      expect(await storage.get('key1')).toBeNull();
      expect(await storage.get('key2')).toBeNull();
    });
  });

  describe('migrations and rollbacks', () => {
    it('rolls back setPassword when re-encryption fails', async () => {
      await storage.init();
      await storage.set('stable', stringToBytes('keep me'));

      const encryptSpy = vi
        .spyOn(storage as any, 'encrypt')
        .mockImplementationOnce(() => {
          throw new Error('boom');
        });

      await expect(storage.setPassword('fail-password')).rejects.toThrow('boom');

      encryptSpy.mockRestore();

      expect(await storage.hasPassword()).toBe(false);
      const value = await storage.get('stable');
      expect(bytesToString(value!)).toBe('keep me');
    });

    it('restores previous key when setPassword transaction fails', async () => {
      await storage.init();
      await storage.set('stable', stringToBytes('keep me'));

      const db = (storage as any).db;
      const txSpy = vi.spyOn(db, 'transaction').mockImplementation(() => {
        throw new Error('tx failure');
      });

      await expect(storage.setPassword('fail-password')).rejects.toThrow('tx failure');

      txSpy.mockRestore();

      expect(await storage.hasPassword()).toBe(false);
      const value = await storage.get('stable');
      expect(bytesToString(value!)).toBe('keep me');
    });

    it('restores previous state when changePassword transaction fails', async () => {
      await storage.init('old-pass');
      await storage.set('protected', stringToBytes('secret'));

      const db = (storage as any).db;
      const txSpy = vi.spyOn(db, 'transaction').mockImplementation(() => {
        throw new Error('tx failure');
      });

      await expect(
        storage.changePassword('old-pass', 'new-pass')
      ).rejects.toThrow('tx failure');

      txSpy.mockRestore();

      // Still protected by the old password and data intact
      const reopened = new SecureStorage();
      await reopened.init('old-pass');
      const value = await reopened.get('protected');
      expect(bytesToString(value!)).toBe('secret');
      await reopened.clear();
      reopened.close();
    });

    it('restores old password when changePassword pre-encrypt fails', async () => {
      await storage.init('old-pass');
      await storage.set('protected', stringToBytes('secret'));

      const encryptSpy = vi
        .spyOn(storage as any, 'encrypt')
        .mockImplementationOnce(() => {
          throw new Error('pre-encrypt failure');
        });

      await expect(
        storage.changePassword('old-pass', 'new-pass')
      ).rejects.toThrow('pre-encrypt failure');

      encryptSpy.mockRestore();

      const reopened = new SecureStorage();
      await reopened.init('old-pass');
      const value = await reopened.get('protected');
      expect(bytesToString(value!)).toBe('secret');
      await reopened.clear();
      reopened.close();
    });

    it('restores password mode when removePassword transaction fails', async () => {
      await storage.init('keep-pass');
      await storage.set('data', stringToBytes('stay'));

      const db = (storage as any).db;
      const txSpy = vi.spyOn(db, 'transaction').mockImplementation(() => {
        throw new Error('tx failure');
      });

      await expect(storage.removePassword('keep-pass')).rejects.toThrow('tx failure');

      txSpy.mockRestore();

      const reopened = new SecureStorage();
      await reopened.init('keep-pass');
      const value = await reopened.get('data');
      expect(bytesToString(value!)).toBe('stay');
      await reopened.clear();
      reopened.close();
    });

    it('keeps password protection when removePassword pre-encrypt fails', async () => {
      await storage.init('keep-pass');
      await storage.set('data', stringToBytes('stay'));

      const encryptSpy = vi
        .spyOn(storage as any, 'encrypt')
        .mockImplementationOnce(() => {
          throw new Error('pre-encrypt failure');
        });

      await expect(storage.removePassword('keep-pass')).rejects.toThrow('pre-encrypt failure');

      encryptSpy.mockRestore();

      // Still protected by the previous password and data intact
      const reopened = new SecureStorage();
      await reopened.init('keep-pass');
      const value = await reopened.get('data');
      expect(bytesToString(value!)).toBe('stay');
      await reopened.clear();
      reopened.close();
    });
  });

  describe('PBKDF2 iteration overrides & persistence', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('persists env-provided iteration overrides across reopen', async () => {
      process.env.ZELDWALLET_PBKDF2_ITERATIONS = '7';

      const first = new SecureStorage();
      await first.init('pw');
      await first.set('k', stringToBytes('v'));
      await first.close?.();

      delete process.env.ZELDWALLET_PBKDF2_ITERATIONS;

      const reopened = new SecureStorage();
      await reopened.init('pw');
      const value = await reopened.get('k');
      expect(bytesToString(value!)).toBe('v');

      const db = await openDB(DB_NAME, DB_VERSION);
      const metadata: any = await db.get(STORES.META, META_KEYS.METADATA);
      db.close();
      expect(metadata.pbkdf2Iterations).toBe(7);

      await reopened.clear();
      reopened.close();
    });

    it('gracefully declines persistence APIs when unavailable', async () => {
      const navigatorRef = (globalThis as any).navigator as any;
      const originalStorage = navigatorRef?.storage;
      const originalPersist = originalStorage?.persist;
      const originalPersisted = originalStorage?.persisted;

      if (originalStorage) {
        originalStorage.persist = undefined;
        originalStorage.persisted = undefined;
      }

      await storage.init();

      const persisted = await storage.requestPersistence();
      const isPersistent = await storage.isPersistent();

      expect(persisted).toBe(false);
      expect(isPersistent).toBe(false);

      if (originalStorage) {
        originalStorage.persist = originalPersist;
        originalStorage.persisted = originalPersisted;
      }
    });
  });
});

