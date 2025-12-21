# ZeldWallet

## Vision

ZeldWallet is a lightweight JavaScript library for creating a Bitcoin wallet directly in the browser. It combines Bitcoin key generation, secure storage (IndexedDB + Web Crypto API), and WBIP004 standard compatibility to be detected by existing Bitcoin applications.

The goal is to offer a simple alternative to browser extensions: users generate a wallet in seconds, without any installation, while maintaining an acceptable security level for small amounts.

---

## Positioning

| Solution | Installation | Security | UX |
|----------|--------------|----------|-----|
| Hardware wallet | Purchase + setup | ★★★★★ | ★★☆☆☆ |
| Extension (Xverse, Leather) | Extension install | ★★★★☆ | ★★★☆☆ |
| **ZeldWallet** | None | ★★★☆☆ | ★★★★★ |
| Custodial | None | ★☆☆☆☆ | ★★★★★ |

ZeldWallet sits between custodial solutions (too risky) and extensions (installation friction). Ideal for onboarding new users or for moderate amounts.

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      ZeldWallet                         │
├─────────────────────────────────────────────────────────┤
│  Public API: create, unlock, lock, export, register     │
├────────────┬────────────────┬───────────────────────────┤
│ KeyManager │  WBIPProvider  │     SecureStorage         │
│ - derive() │  - request()   │     - encrypt/decrypt     │
│ - sign()   │  - events      │     - IndexedDB + AES     │
├────────────┴────────────────┴───────────────────────────┤
│  @noble/secp256k1, @scure/bip32, bitcoinjs-lib, idb     │
└─────────────────────────────────────────────────────────┘
```

---

## Modules

### 1. SecureStorage

Responsible for encrypted storage of sensitive data.

**Responsibilities:**
- Derive an AES-256 key from user password (PBKDF2)
- Encrypt/decrypt data with AES-GCM
- Persist in IndexedDB
- Manage salt and IVs
- Request browser persistence

**Interface:**

```typescript
interface SecureStorage {
  init(password?: string): Promise<void>;  // password is optional!
  exists(): Promise<boolean>;
  set(key: string, value: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
  setPassword(password: string): Promise<void>;      // add password later
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  removePassword(currentPassword: string): Promise<void>;  // revert to passwordless mode
  hasPassword(): Promise<boolean>;
  clear(): Promise<void>;
}
```

**Crypto parameters:** PBKDF2 (600k iterations, SHA-256), AES-GCM 256 bits, salt 16 bytes, IV 12 bytes.

**Passwordless mode:** If no password is provided, an AES key is randomly generated and stored in IndexedDB with `extractable: false`. Less secure (vulnerable to malicious extensions) but sufficient to protect against casual physical access. Users can add a password later. Because the key is non-extractable, backups are **disabled** until a password is set (force `setPassword` before exporting).

### 2. KeyManager

Handles Bitcoin key generation and derivation.

**Responsibilities:**
- Generate a BIP39 mnemonic (12 or 24 words)
- Derive keys according to BIP32/44/84/86
- Support multiple address types (Legacy, SegWit, Taproot)
- Sign messages and transactions
- Never expose private keys outside the module

**Interface:**

```typescript
interface KeyManager {
  generateMnemonic(strength?: 128 | 256): string;
  fromMnemonic(mnemonic: string, passphrase?: string): Promise<void>;
  deriveAddress(type: AddressType, account?: number, change?: 0|1, index?: number): DerivedAddress;
  getAddresses(purposes: AddressPurpose[]): AddressInfo[];
  signMessage(message: string, addressType: string): Promise<string>;
  signPsbt(psbtBase64: string, inputsToSign: SignInputOptions[]): Promise<string>;
  exportMnemonic(): string;
  lock(): void;
}

interface DerivedAddress {
  address: string;
  publicKey: string;
  path: string;
  type: 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh' | 'p2tr';
}
```

**Derivation paths:** Legacy (m/44'/0'/0'), Nested SegWit (m/49'/0'/0'), Native SegWit (m/84'/0'/0'), Taproot (m/86'/0'/0').

### 3. WBIPProvider

Implements the WBIP004/005/006 interface for ecosystem compatibility.

**Responsibilities:**
- Register in `window.wbip_providers`
- Expose the provider object on `window`
- Implement the `request(method, params)` method
- Handle events (accountsChanged, etc.)
- Display confirmation popups

**Interface:**

```typescript
interface WBIPProviderOptions {
  id: string;
  name: string;
  icon: string;
  webUrl?: string;
}

interface WBIPProvider {
  register(options: WBIPProviderOptions): void;
  unregister(): void;
  request(method: string, params?: unknown): Promise<unknown>;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}
```

**Supported WBIP methods:** `getAddresses` (WBIP005), `signMessage` (WBIP005), `signPsbt` (WBIP006).

### 4. UIManager (optional)

Handles the user interface for confirmations.

**Responsibilities:**
- Display confirmation modals
- Handle password inputs
- Display transaction details
- Theming and customization

**Can be replaced by a custom implementation from the host application.**

---

## Implementation Plan

### Phase 1: Foundations (Week 1-2)

#### 1.1 Project Setup

```bash
zeldwallet/
├── src/
│   ├── index.ts              # Entry point, public exports
│   ├── storage/
│   │   ├── SecureStorage.ts
│   │   └── constants.ts
│   ├── keys/
│   │   ├── KeyManager.ts
│   │   ├── derivation.ts
│   │   └── signing.ts
│   ├── provider/
│   │   ├── WBIPProvider.ts
│   │   ├── methods/
│   │   │   ├── getAddresses.ts
│   │   │   ├── signMessage.ts
│   │   │   └── signPsbt.ts
│   │   └── events.ts
│   ├── ui/
│   │   ├── Modal.ts
│   │   └── styles.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── encoding.ts
│       └── validation.ts
├── tests/
│   ├── storage.test.ts
│   ├── keys.test.ts
│   ├── provider.test.ts
│   └── integration.test.ts
├── examples/
│   ├── basic-usage.html
│   └── with-sats-connect.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

**Dependencies:**

```json
{
  "dependencies": {
    "@noble/secp256k1": "^2.0.0",
    "@noble/hashes": "^1.3.0",
    "@scure/bip32": "^1.3.0",
    "@scure/bip39": "^1.2.0",
    "bitcoinjs-lib": "^6.1.0",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

#### 1.2 SecureStorage Implementation

Priority: HIGH - Foundation for everything else.

```typescript
// src/storage/SecureStorage.ts
export class SecureStorage {
  private db: IDBPDatabase | null = null; // use `idb` wrapper for typed helpers
  private encryptionKey: CryptoKey | null = null;

  async init(password?: string): Promise<void> {
    this.db = await this.openDatabase();
    
    if (password) {
      // Secure mode: derive key from password
      const salt = await this.getOrCreateSalt();
      this.encryptionKey = await this.deriveKeyFromPassword(password, salt);
    } else {
      // Simple mode: use or create a stored key
      this.encryptionKey = await this.getOrCreateStoredKey();
    }
  }

  private async openDatabase(): Promise<IDBPDatabase> {
    // Handles meta (salt, stored key) + data object stores using `idb.openDB`
  }

  private async getOrCreateSalt(): Promise<Uint8Array> {
    // Persisted salt for password-derived keys
  }

  private async encrypt(value: Uint8Array): Promise<{ iv: Uint8Array; data: ArrayBuffer }> {
    // AES-GCM encrypt with current encryptionKey
  }

  private async decrypt(record: { iv: Uint8Array; data: ArrayBuffer }): Promise<Uint8Array> {
    // AES-GCM decrypt with current encryptionKey
  }

  private async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false, ['encrypt', 'decrypt']
    );
  }

  private async getOrCreateStoredKey(): Promise<CryptoKey> {
    // Look for existing key
    let key = await this.db!.get('meta', 'encryption-key');
    if (key) return key;
    
    // Generate and store a new key (extractable: false for security)
    key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,  // Non-extractable - stays opaque even in memory
      ['encrypt', 'decrypt']
    );
    await this.db!.put('meta', key, 'encryption-key');
    return key;
  }

  async setPassword(password: string): Promise<void> {
    // Re-encrypt all data with the new password mode, keep old key until success
    const allData = await this.exportAllDecrypted();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const newKey = await this.deriveKeyFromPassword(password, salt);

    // Single transaction to avoid bricking on partial writes
    const tx = this.db!.transaction(['meta', 'data'], 'readwrite');
    await Promise.all([
      tx.objectStore('meta').put(salt, 'salt'),
      tx.objectStore('meta').delete('encryption-key')
    ]);

    // Switch key only after metadata is safely written
    this.encryptionKey = newKey;
    await this.importAllEncrypted(allData);
    await tx.done;
  }

  // Backup/export is intentionally blocked while in passwordless mode because the key is non-extractable.
  // Call setPassword() first; exportBackup() will enforce hasPassword() to avoid silent weak backups.
  
// ... set(), get() same as before

// Tests to add: init without password, add password, change password rollback on failure, locked state disallows mutation, encrypt/decrypt roundtrips.
// Implementation note: setPassword should be atomic (rollback to previous key on error) and should refuse when wallet is locked to avoid partial migrations.

// Perf note: PBKDF2 600k iterations may be heavy on low-end devices; benchmark and allow a configurable iteration count with a sensible default.
// Security note: in production, clamp any PBKDF2 override below the default to avoid weakening the KDF cost.

  private async exportAllDecrypted(): Promise<Record<string, Uint8Array>> {
    // Iterate data store, decrypt each record with current key
  }

  private async importAllEncrypted(data: Record<string, Uint8Array>): Promise<void> {
    // Encrypt and re-store each record with the new key
  }
}
```

**Tests:** Creation without password, adding password later, retrieval after reload, password change.
**Extra tests:** setPassword rollback on failure (simulate thrown import), locked state disallows mutation, encrypt/decrypt roundtrips using `idb` wrapper.

#### 1.3 KeyManager Implementation

Priority: HIGH

```typescript
// src/keys/KeyManager.ts
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';

const COIN_TYPES = { mainnet: 0, testnet: 1 }; // BIP44 coin types
const PATHS = {
  legacy: (coin = COIN_TYPES.mainnet, account = 0) => `m/44'/${coin}'/${account}'`,
  nestedSegwit: (coin = COIN_TYPES.mainnet, account = 0) => `m/49'/${coin}'/${account}'`,
  nativeSegwit: (coin = COIN_TYPES.mainnet, account = 0) => `m/84'/${coin}'/${account}'`,
  taproot: (coin = COIN_TYPES.mainnet, account = 0) => `m/86'/${coin}'/${account}'`
};

export class KeyManager {
  private masterKey: HDKey | null = null;
  private mnemonic: string | null = null;

  private assertUnlocked(): asserts this is { masterKey: HDKey; mnemonic: string } {
    if (!this.masterKey || !this.mnemonic) throw new Error('Wallet is locked');
  }

  generateMnemonic(strength: 128 | 256 = 128): string {
    return bip39.generateMnemonic(wordlist, strength);
  }

  async fromMnemonic(mnemonic: string, passphrase = ''): Promise<void> {
    if (!bip39.validateMnemonic(mnemonic, wordlist)) throw new Error('Invalid mnemonic');
    const seed = await bip39.mnemonicToSeed(mnemonic, passphrase);
    this.masterKey = HDKey.fromMasterSeed(seed);
    this.mnemonic = mnemonic;
  }

  deriveAddress(
    type: keyof typeof PATHS,
    account = 0,
    change: 0|1 = 0,
    index = 0,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): DerivedAddress {
    this.assertUnlocked();
    const path = `${PATHS[type](COIN_TYPES[network], account)}/${change}/${index}`;
    const child = this.masterKey!.derive(path);
    switch (type) {
      case 'legacy': return toP2PKH(child, network);
      case 'nestedSegwit': return toP2SHP2WPKH(child, network);
      case 'nativeSegwit': return toP2WPKH(child, network);
      case 'taproot': return toP2TR(child, network);
    }
  }

  signMessage(message: string, addressType: keyof typeof PATHS) {
    this.assertUnlocked();
    // Use bitcoinjs-message or equivalent with network-aware params
  }

  signPsbt(psbtBase64: string, inputsToSign: SignInputOptions[]): Promise<string> {
    this.assertUnlocked();
    // Use bitcoinjs-lib Psbt, add taproot Schnorr for p2tr, fallback to ECDSA
  }

  lock(): void {
    this.masterKey = null;
    this.mnemonic = null;
  }
}
```

**Tests:** Mnemonic generation, correct derivation (BIP test vectors), message/PSBT signing, mnemonic validation.

### Phase 2: WBIP Provider (Week 3)

#### 2.1 WBIPProvider Implementation

```typescript
// src/provider/WBIPProvider.ts
export class WBIPProvider {
  constructor(
    private keyManager: KeyManager,
    private storage: SecureStorage,
    private ui: ConfirmationUI
  ) {}

  private options?: WBIPProviderOptions;
  private provider?: any;

  register(options: WBIPProviderOptions): void {
    window.wbip_providers = window.wbip_providers || [];
    // Unregister any existing provider with same id to avoid duplicates
    this.unregister(options.id);
    this.options = options;
    window.wbip_providers.push({
      id: options.id,
      name: options.name,
      icon: options.icon,
      methods: ['getAddresses', 'signMessage', 'signPsbt']
    });

    const provider = {
      request: this.request.bind(this),
      on: this.on.bind(this),
      off: this.off.bind(this)
    };
    (window as any)[options.id] = provider;
    this.provider = provider;
  }

  unregister(id?: string): void {
    const targetId = id || this.options?.id;
    if (!window.wbip_providers) return;
    if (targetId) {
      window.wbip_providers = window.wbip_providers.filter((p: any) => p.id !== targetId);
      if ((window as any)[targetId]) delete (window as any)[targetId];
    }
  }

  async request(method: string, params?: unknown): Promise<unknown> {
    switch (method) {
      case 'getAddresses': return this.handleGetAddresses(params);
      case 'signMessage': return this.handleSignMessage(params);
      case 'signPsbt': return this.handleSignPsbt(params);
      default: throw { code: -32601, message: `Method not found: ${method}` };
    }
  }

  private assertParams<T>(params: unknown, validator: (p: any) => p is T, method: string): T {
    if (!validator(params)) throw { code: -32602, message: `Invalid params for ${method}` };
    return params;
  }

  private async handleSignPsbt(params: unknown): Promise<any> {
    // signInputs is a record of address -> number[]; we flatten into SignInputOptions[]
    const valid = this.assertParams<{ psbt: string; signInputs?: Record<string, number[]> }>(
      params,
      (p): p is { psbt: string; signInputs?: Record<string, number[]> } =>
        !!p && typeof p.psbt === 'string' && (p.signInputs === undefined || typeof p.signInputs === 'object'),
      'signPsbt'
    );
    const flattened: SignInputOptions[] = [];
    if (valid.signInputs) {
      for (const [address, indices] of Object.entries(valid.signInputs)) {
        if (!Array.isArray(indices)) throw { code: -32602, message: 'Invalid signInputs indices' };
        indices.forEach((index) => flattened.push({ address, index }));
      }
    }
    const confirmed = await this.ui.confirm('sign_psbt', valid);
    if (!confirmed) throw { code: 4001, message: 'User rejected the request' };
    return { psbt: await this.keyManager.signPsbt(valid.psbt, flattened) };
  }

  private async handleSignMessage(params: unknown): Promise<any> {
    const valid = this.assertParams<{ message: string; addressType: keyof typeof PATHS }>(
      params,
      (p): p is { message: string; addressType: keyof typeof PATHS } =>
        !!p && typeof p.message === 'string' && typeof p.addressType === 'string',
      'signMessage'
    );
    const confirmed = await this.ui.confirm('sign_message', valid);
    if (!confirmed) throw { code: 4001, message: 'User rejected the request' };
    return { signature: await this.keyManager.signMessage(valid.message, valid.addressType) };
  }

  // Simple pub/sub storage for events
  private listeners = new Map<string, Set<Function>>();
  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }
  off(event: string, handler: Function): void {
    this.listeners.get(event)?.delete(handler);
  }
}

// Tests: duplicate register/unregister cleanup, events on/off, user rejection via confirm UI, successful signPsbt/signMessage/getAddresses, missing provider errors.
```

#### 2.2 Integration Test with sats-connect

```html
<!-- examples/with-sats-connect.html -->
<script type="module">
  import { ZeldWallet } from '../dist/zeldwallet.esm.js';
  import { request } from 'sats-connect';

  const wallet = new ZeldWallet();
  await wallet.create(); // No password = instant onboarding!
  wallet.registerProvider({ id: 'ZeldWallet', name: 'Zeld Wallet', icon: '...' });

  // sats-connect now detects ZeldWallet!
  document.getElementById('connect').onclick = async () => {
    const response = await request('getAddresses', { purposes: ['payment', 'ordinals'] });
    console.log('Addresses:', response);
  };
</script>
```

### Phase 3: Security and UX (Week 4)

#### 3.1 Confirmation System

```typescript
// src/ui/Modal.ts
export class ConfirmationModal {
  async show(type: ConfirmationType, data: any): Promise<boolean> {
    return new Promise((resolve) => {
      const container = document.createElement('div');
      container.innerHTML = this.render(type, data);
      container.className = 'zeldwallet-modal-overlay';
      
      container.querySelector('.zw-confirm')!.addEventListener('click', () => { this.close(); resolve(true); });
      container.querySelector('.zw-cancel')!.addEventListener('click', () => { this.close(); resolve(false); });
      
      document.body.appendChild(container);
    });
  }
}
```

#### 3.2 Backup Export/Import

```typescript
async exportBackup(password: string): Promise<string> {
  if (!(await this.hasPassword())) throw new Error('Backup requires a wallet password; call setPassword() first.');
  const backup = {
    version: 1,
    encrypted: await this.encryptMnemonic(this.mnemonic, password),
    createdAt: Date.now()
  };
  return btoa(JSON.stringify(backup));
}

async importBackup(backupString: string, password: string): Promise<void> {
  const backup = JSON.parse(atob(backupString));
  const mnemonic = await this.decryptMnemonic(backup.encrypted, password);
  await this.fromMnemonic(mnemonic);
}
```

**UI note:** Gate the “Export backup” action behind a password prompt or a clear call-to-action to set a password first; keep the button disabled until `hasPassword()` is true to avoid confusing users about why backup is blocked.

#### 3.3 Security Checklist

- [ ] Crypto code audit
- [ ] No private key logging
- [ ] Memory cleanup after lock()
- [ ] CSP headers documented

### Phase 4: Polish and Documentation (Week 5)

#### 4.1 README Documentation

```markdown
## Installation
npm install zeldwallet

## Quick Start
import { ZeldWallet } from 'zeldwallet';

// Quick creation WITHOUT password (simple onboarding)
const wallet = new ZeldWallet();
const { mnemonic } = await wallet.create();
console.log('Backup:', mnemonic); // IMPORTANT!

// OR with password (more secure)
const { mnemonic } = await wallet.create('optional-password');

// User can add a password later
await wallet.setPassword('my-secure-password');

wallet.registerProvider({ id: 'MyAppWallet', name: 'My App', icon: '...' });
// The wallet is now detectable by sats-connect!
```

#### 4.2 Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ZeldWallet',
      formats: ['es', 'umd', 'iife'],
      fileName: (format) => `zeldwallet.${format}.js`
    }
  }
});
```

Formats: ES modules (bundlers), UMD (universal), IIFE (`<script>` inclusion).

---

## Final Public API

```typescript
export class ZeldWallet {
  // Lifecycle
  static async create(password?: string): Promise<{ mnemonic: string }>;  // password is optional!
  static async restore(mnemonic: string, password?: string): Promise<void>;
  static async unlock(password?: string): Promise<void>;
  static lock(): void;
  static async exists(): Promise<boolean>;
  static async destroy(): Promise<void>;
  
  // WBIP004 Provider
  static registerProvider(options: ProviderOptions): void;
  static unregisterProvider(): void;
  
  // Password management (can be added/modified after creation)
  static async setPassword(password: string): Promise<void>;
  static async changePassword(oldPassword: string, newPassword: string): Promise<void>;
  static async removePassword(currentPassword: string): Promise<void>;
  static async hasPassword(): Promise<boolean>;
  
  // Backup (requires wallet to be in password mode)
  static async exportBackup(password: string): Promise<string>;
  static async importBackup(backup: string, password: string): Promise<void>;
  
  // Addresses & Signing
  static getAddresses(purposes: AddressPurpose[]): AddressInfo[];
  static async signMessage(message: string, address: string): Promise<string>;
  static async signPsbt(psbt: string, options: SignOptions): Promise<string>;
  
  // Events & State
  static on(event: WalletEvent, handler: Function): void;
  static off(event: WalletEvent, handler: Function): void;
  static isUnlocked(): boolean;
  static getNetwork(): 'mainnet' | 'testnet';
  static setNetwork(network: 'mainnet' | 'testnet'): void;
}

// Main types
type AddressPurpose = 'payment' | 'ordinals' | 'stacks';
type AddressType = 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh' | 'p2tr';
type WalletEvent = 'lock' | 'unlock' | 'accountsChanged';

interface AddressInfo {
  address: string;
  publicKey: string;
  purpose: AddressPurpose;
  addressType: AddressType;
  derivationPath: string;
}
```

---

## Security Considerations

### Security Modes

| Mode | Protection | Vulnerable to | Use case |
|------|------------|---------------|----------|
| No password | AES key stored in IndexedDB | Malicious extensions, XSS | Quick onboarding, small amounts |
| With password | Key derived via PBKDF2 | Keylogger, phishing | Medium amounts |
| Hardware wallet | Physically isolated key | Physical theft | Large amounts |

Users can upgrade from "no password" to "with password" at any time via `setPassword()`.

### Threats and Mitigations

| Threat | Risk | Mitigation |
|--------|------|------------|
| XSS | High | Strict CSP, sanitization |
| Malicious extension | Medium | Password protects, limit amounts |
| Password brute force | Medium | PBKDF2 600k iterations |
| Data loss | High | Mandatory backup, persist() |

### User Warning

```
⚠️ This wallet is designed for small amounts.
   For large sums, use a hardware wallet.
✅ Back up your recovery phrase
🔐 Add a password for more security
❌ Don't store more than you can afford to lose
```

---

## Future Roadmap

**v1.1**: Multi-accounts, transaction history, Ordinals viewer
**v1.2**: Testnet/Signet, Hardware wallet bridge (Ledger WebUSB)
**v2.0**: Lightning (WebLN), Multi-signature, Plugin system

---

## Resources

- [WBIP Specifications](https://wbips.netlify.app)
- [BIP32/39/84/86](https://github.com/bitcoin/bips)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [sats-connect](https://github.com/secretkeylabs/sats-connect)

---

## Launch Checklist

### Before v1.0

- [ ] Unit tests > 80% coverage
- [ ] Integration tests with sats-connect
- [ ] Security audit (at least self-review)
- [ ] Complete documentation
- [ ] Working examples
- [ ] CI/CD configured
- [ ] Package published on npm
- [ ] Online demo

### Communication

- [ ] README with badges
- [ ] CHANGELOG
- [ ] CONTRIBUTING guide
- [ ] Issue templates
- [ ] Discussion on Bitcoin devs Discord
- [ ] Post on Stacker News / Twitter
