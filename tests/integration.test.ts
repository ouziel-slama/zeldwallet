/**
 * Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ZeldWallet } from '../src/index';
import { base64ToBytes, bytesToString, bytesToBase64, stringToBytes } from '../src/utils/encoding';

describe('ZeldWallet Integration', () => {
  let wallet: ZeldWallet;

  beforeEach(() => {
    wallet = new ZeldWallet();
  }, 5_000);

  afterEach(async () => {
    try {
      await wallet.destroy();
    } catch (error) {
      // Surface cleanup issues to help debug timeouts in CI/fake-indexeddb
      // but do not fail the suite; just log.
      console.warn('afterEach destroy failed:', error);
    }
  });

  describe('wallet creation', () => {
    it('should create a wallet without password', async () => {
      const { mnemonic } = await wallet.create();
      
      expect(mnemonic).toBeTruthy();
      expect(mnemonic.split(' ')).toHaveLength(12);
      expect(wallet.isUnlocked()).toBe(true);
      expect(await wallet.hasPassword()).toBe(false);
    });

    it('should create a wallet with password', async () => {
      const { mnemonic } = await wallet.create('test-password');
      
      expect(mnemonic).toBeTruthy();
      expect(wallet.isUnlocked()).toBe(true);
      expect(await wallet.hasPassword()).toBe(true);
    });

    it('should get addresses after creation', async () => {
      await wallet.create();
      
      const addresses = wallet.getAddresses(['payment', 'ordinals']);
      
      expect(addresses).toHaveLength(2);
      expect(addresses[0].purpose).toBe('payment');
      expect(addresses[0].addressType).toBe('p2wpkh');
      expect(addresses[1].purpose).toBe('ordinals');
      expect(addresses[1].addressType).toBe('p2tr');
    });
  });

  describe('wallet restoration', () => {
    const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    it('should restore from mnemonic', async () => {
      await wallet.restore(TEST_MNEMONIC);
      
      expect(wallet.isUnlocked()).toBe(true);
      
      const addresses = wallet.getAddresses(['payment']);
      expect(addresses[0].address).toMatch(/^bc1q/);
    });

    it('should restore with password', async () => {
      await wallet.restore(TEST_MNEMONIC, 'restore-password');
      
      expect(wallet.isUnlocked()).toBe(true);
      expect(await wallet.hasPassword()).toBe(true);
    });

    it('should derive same addresses from same mnemonic', async () => {
      await wallet.restore(TEST_MNEMONIC);
      const addresses1 = wallet.getAddresses(['payment']);
      
      await wallet.destroy();
      wallet = new ZeldWallet();
      
      await wallet.restore(TEST_MNEMONIC);
      const addresses2 = wallet.getAddresses(['payment']);
      
      expect(addresses1[0].address).toBe(addresses2[0].address);
    });
  });

  describe('lock and unlock', () => {
    it('should lock and prevent operations', async () => {
      await wallet.create();
      
      wallet.lock();
      
      expect(wallet.isUnlocked()).toBe(false);
      expect(() => wallet.getAddresses(['payment'])).toThrow('Wallet is locked');
    });

    it('should unlock with correct password', async () => {
      await wallet.create('my-password');
      wallet.lock();
      
      await wallet.unlock('my-password');
      
      expect(wallet.isUnlocked()).toBe(true);
    });

    it('should fail to unlock without password when required', async () => {
      await wallet.create('secure-password');
      wallet.lock();
      
      await expect(wallet.unlock()).rejects.toThrow();
    });

    it('should not mark storage as existing when unlock is called first', async () => {
      await expect(wallet.unlock()).rejects.toThrow('No wallet found');
      expect(await wallet.exists()).toBe(false);

      const { mnemonic } = await wallet.create();
      expect(mnemonic).toBeTruthy();
      expect(await wallet.hasPassword()).toBe(false);
    });

    it('should allow creation after unlocking with a password on empty storage', async () => {
      await expect(wallet.unlock('temp-password')).rejects.toThrow('No wallet found');
      expect(await wallet.exists()).toBe(false);

      await wallet.create();
      expect(await wallet.hasPassword()).toBe(false);
    });
  });

  describe('message signing', () => {
    it('should sign a message', async () => {
      await wallet.create();
      const addresses = wallet.getAddresses(['payment']);
      
      const signature = await wallet.signMessage('Hello World', addresses[0].address);
      
      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
    });
  });

  describe('network switching', () => {
    it('should switch to testnet', async () => {
      await wallet.create();
      
      await wallet.setNetwork('testnet');
      
      expect(wallet.getNetwork()).toBe('testnet');
      
      const addresses = wallet.getAddresses(['payment']);
      expect(addresses[0].address).toMatch(/^tb1q/);
    });
  });

  describe('password management', () => {
    it('should add password later', async () => {
      await wallet.create();
      expect(await wallet.hasPassword()).toBe(false);
      
      await wallet.setPassword('new-password');
      
      expect(await wallet.hasPassword()).toBe(true);
    });

    it('should change password', async () => {
      await wallet.create('old-password');
      
      await wallet.changePassword('old-password', 'new-password');
      
      // Should still work
      expect(wallet.isUnlocked()).toBe(true);
      
      // Lock and unlock with new password
      wallet.lock();
      await wallet.unlock('new-password');
      expect(wallet.isUnlocked()).toBe(true);
    });
  });

  describe('backup and restore', () => {
    it('should export and import backup', async () => {
      await wallet.create();
      await wallet.setPassword('backup-wallet-password');
      const addresses1 = wallet.getAddresses(['payment', 'ordinals']);
      const network1 = wallet.getNetwork();
      
      const backup = await wallet.exportBackup('backup-password');
      expect(backup).toBeTruthy();
      const envelope = JSON.parse(bytesToString(base64ToBytes(backup)));
      expect(envelope.mac).toBeTruthy();
      expect(envelope.macAlgo).toBe('HMAC-SHA256');
      
      // Destroy and reimport (simulates cross-domain restore)
      await wallet.destroy();
      wallet = new ZeldWallet();
      
      await wallet.importBackup(backup, 'backup-password', 'backup-wallet-password');
      
      const addresses2 = wallet.getAddresses(['payment', 'ordinals']);
      const network2 = wallet.getNetwork();
      
      // Verify both payment and ordinals addresses match
      expect(addresses2.length).toBe(2);
      expect(addresses2[0].address).toBe(addresses1[0].address);
      expect(addresses2[1].address).toBe(addresses1[1].address);
      expect(addresses2[0].derivationPath).toBe(addresses1[0].derivationPath);
      expect(addresses2[1].derivationPath).toBe(addresses1[1].derivationPath);
      // Verify network is preserved
      expect(network2).toBe(network1);
    });

    it('rejects tampered backup metadata via MAC', async () => {
      await wallet.create();
      await wallet.setPassword('backup-wallet-password');
      const backup = await wallet.exportBackup('backup-password');

      const envelope = JSON.parse(bytesToString(base64ToBytes(backup)));
      envelope.network = envelope.network === 'mainnet' ? 'testnet' : 'mainnet';
      const tampered = bytesToBase64(stringToBytes(JSON.stringify(envelope)));

      await wallet.destroy();
      wallet = new ZeldWallet();

      await expect(
        wallet.importBackup(tampered, 'backup-password', 'backup-wallet-password', { overwrite: true })
      ).rejects.toThrow(/integrity check/i);
    });

    it('stores the actual KDF iterations used for backup encryption', async () => {
      const customIterations = 10;
      const { SecureStorage } = await import('../src/storage/SecureStorage');
      const { base64ToBytes, bytesToString } = await import('../src/utils/encoding');

      // Swap in a storage instance with a custom PBKDF2 override to simulate non-default configs.
      (wallet as any).storage = new SecureStorage({
        pbkdf2Iterations: customIterations,
      });

      await wallet.create('wallet-password');
      const backup = await wallet.exportBackup('backup-password');

      const envelope = JSON.parse(bytesToString(base64ToBytes(backup)));

      expect(envelope.kdf.iterations).toBe(customIterations);
    });

    it('preserves custom derivation paths across backup/restore for cross-domain portability', async () => {
      // Custom derivation paths (e.g., MagicEden-style paths)
      const customPaths = {
        payment: "m/84'/0'/0'/0/0",
        ordinals: "m/86'/0'/1'/0/0", // Non-standard ordinals path
      };

      // Create a wallet with a known mnemonic and custom paths
      const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      await wallet.restore(testMnemonic, 'wallet-password', undefined, customPaths);
      
      const addresses1 = wallet.getAddresses(['payment', 'ordinals']);
      expect(addresses1.length).toBe(2);

      // Export the backup
      const backup = await wallet.exportBackup('backup-password');

      // Destroy the wallet
      await wallet.destroy();
      wallet = new ZeldWallet();

      // Import the backup (simulating a different domain)
      await wallet.importBackup(backup, 'backup-password', 'wallet-password');

      // Verify the addresses match (custom paths were restored)
      const addresses2 = wallet.getAddresses(['payment', 'ordinals']);
      expect(addresses2.length).toBe(2);
      expect(addresses2[0].address).toBe(addresses1[0].address);
      expect(addresses2[1].address).toBe(addresses1[1].address);
      expect(addresses2[0].derivationPath).toBe(customPaths.payment);
      expect(addresses2[1].derivationPath).toBe(customPaths.ordinals);
    });
  });

  describe('events', () => {
    it('should emit lock event', async () => {
      await wallet.create();
      
      let lockEmitted = false;
      wallet.on('lock', () => {
        lockEmitted = true;
      });
      
      wallet.lock();
      
      expect(lockEmitted).toBe(true);
    });

    it('should emit unlock event', async () => {
      await wallet.create('test');
      wallet.lock();
      
      let unlockEmitted = false;
      wallet.on('unlock', () => {
        unlockEmitted = true;
      });
      
      await wallet.unlock('test');
      
      expect(unlockEmitted).toBe(true);
    });
  });

  describe('WBIP provider', () => {
    it('should register as WBIP provider', async () => {
      await wallet.create();
      
      wallet.registerProvider({
        id: 'TestWallet',
        name: 'Test Wallet',
        icon: 'data:image/svg+xml;base64,test',
      });
      
      expect(window.wbip_providers).toBeDefined();
      expect(window.wbip_providers?.some(p => p.id === 'TestWallet')).toBe(true);
      expect(window['TestWallet']).toBeDefined();
      
      // Cleanup
      wallet.unregisterProvider('TestWallet');
    });

    it('should unregister WBIP provider', async () => {
      await wallet.create();
      
      wallet.registerProvider({
        id: 'ToRemove',
        name: 'To Remove',
        icon: '',
      });
      
      wallet.unregisterProvider('ToRemove');
      
      expect(window.wbip_providers?.some(p => p.id === 'ToRemove')).toBe(false);
      expect(window['ToRemove']).toBeUndefined();
    });
  });
});

