# ZeldWallet UI Components

ZeldWallet provides two ways to integrate a wallet interface into your application:

| Approach | Import | Best for |
|----------|--------|----------|
| **Web Component** | `<zeld-wallet-ui>` | Vanilla JS, any framework, no build step |
| **React Component** | `<ZeldWalletCard>` | React/Next.js apps with full TypeScript support |

Both components share the same underlying controller and render identical UI. They silently create or unlock a wallet, register the WBIP provider for discovery, and display payment + ordinals addresses with backup and password management flows.

---

## Installation

```bash
npm install zeldwallet
```

> **Note:** The library requires `Buffer` to be available globally. Most bundlers handle this, but you may need to polyfill it (see examples below).

---

## Web Component (`<zeld-wallet-ui>`)

### Setup with ESM bundler

```html
<script type="module">
  import { Buffer } from 'buffer';
  import { defineZeldWalletUI } from 'zeldwallet';

  if (!window.Buffer) window.Buffer = Buffer;
  defineZeldWalletUI();
</script>

<zeld-wallet-ui lang="en" autoconnect="true"></zeld-wallet-ui>
```

### Setup via CDN (no build step)

```html
<script type="module">
  import { defineZeldWalletUI } from 'https://unpkg.com/zeldwallet/dist/zeldwallet.es.js';
  import { Buffer } from 'https://unpkg.com/buffer@6.0.3/index.js';

  if (!window.Buffer) window.Buffer = Buffer;
  defineZeldWalletUI();
</script>

<zeld-wallet-ui lang="en" autoconnect="true"></zeld-wallet-ui>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `lang` | `string` | `"en"` | Locale for UI strings (`"en"`, `"fr"`) |
| `network` | `string` | `"mainnet"` | Bitcoin network (`"mainnet"`, `"testnet"`) |
| `autoconnect` | `boolean` | `true` | Auto-connect on mount. Set to `"false"` to require manual `connect()` |

### Methods

```js
const walletEl = document.querySelector('zeld-wallet-ui');

// Trigger connection manually (useful when autoconnect="false")
await walletEl.connect();

// Connect with password if wallet is locked
await walletEl.connect('my-password');

// Change locale dynamically
walletEl.setLocale('fr');
```

### Full example

See [`examples/web-component.html`](../../examples/web-component.html) for a complete demo with language toggle, dark-mode styling, and programmatic signing.

---

## React Component (`<ZeldWalletCard>`)

### Basic usage

```tsx
import { ZeldWalletCard } from 'zeldwallet/react';

function App() {
  return (
    <ZeldWalletCard
      lang="en"
      network="mainnet"
      autoconnect
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lang` | `string` | `"en"` | Locale for UI strings |
| `network` | `"mainnet" \| "testnet"` | `"mainnet"` | Bitcoin network |
| `autoconnect` | `boolean` | `true` | Auto-connect on mount |
| `variant` | `"light" \| "dark"` | `"light"` | Built-in theme variant |
| `className` | `string` | – | Additional CSS class |
| `tagName` | `string` | `"zeld-wallet-ui"` | Custom element tag name |

### Using the ref for programmatic control

```tsx
import { useRef } from 'react';
import { ZeldWalletCard, type ZeldWalletCardRef } from 'zeldwallet/react';

function App() {
  const walletRef = useRef<ZeldWalletCardRef>(null);

  const handleConnect = async () => {
    await walletRef.current?.connect('optional-password');
  };

  return (
    <>
      <ZeldWalletCard ref={walletRef} autoconnect={false} />
      <button onClick={handleConnect}>Connect Wallet</button>
    </>
  );
}
```

### Using the hook for custom UI

If you need full control over rendering, use the `useZeldWalletController` hook instead of the component:

```tsx
import { useZeldWalletController } from 'zeldwallet/react';

function CustomWalletUI() {
  const {
    state,
    strings,
    network,
    connect,
    showPasswordWarning,
    showBackupWarning,
  } = useZeldWalletController({ lang: 'en', network: 'mainnet' });

  if (state.status === 'loading') return <p>Loading...</p>;
  if (state.status === 'locked') {
    return (
      <form onSubmit={(e) => { e.preventDefault(); connect(password); }}>
        <input type="password" placeholder={strings.passwordPlaceholder} />
        <button type="submit">{strings.unlock}</button>
      </form>
    );
  }
  if (state.status === 'ready') {
    return (
      <div>
        <p>Payment: {state.addresses.payment}</p>
        <p>Ordinals: {state.addresses.ordinals}</p>
      </div>
    );
  }
  return <p>Error: {state.error}</p>;
}
```

### Full example

See [`examples/react/App.tsx`](../../examples/react/App.tsx) for a complete React demo.

---

## Signing Messages & Transactions

Once the wallet is unlocked, use the `ZeldWallet` singleton directly:

```ts
import { ZeldWallet } from 'zeldwallet';

// Check if unlocked
if (!ZeldWallet.isUnlocked()) {
  console.log('Please unlock the wallet first');
}

// Get addresses
const [payment] = ZeldWallet.getAddresses(['payment']);
const [ordinals] = ZeldWallet.getAddresses(['ordinals']);

// Sign a message
const signature = await ZeldWallet.signMessage('Hello Bitcoin!', payment.address);

// Sign a PSBT (Base64 in/out)
const signedPsbt = await ZeldWallet.signPsbt(psbtBase64, [
  { index: 0, address: payment.address },
]);
```

---

## Using with sats-connect

When the component connects, it automatically registers a **WBIP004/005/006-compatible provider** on `window.wbip_providers`. This means any dApp using `sats-connect` can discover and interact with ZeldWallet exactly like Xverse, Leather, or any other wallet—**same API, same workflow**.

### Supported methods

| Method | Description |
|--------|-------------|
| `getInfo` | Wallet info (version, supported methods) |
| `getAddresses` | Get payment/ordinals addresses |
| `signMessage` | Sign a message (ecdsa or bip322-simple) |
| `signPsbt` | Sign a PSBT |

### React example with sats-connect

```tsx
import { useState } from 'react';
import { ZeldWalletCard } from 'zeldwallet/react';
import { request } from 'sats-connect';

function App() {
  const [signature, setSignature] = useState<string>();

  const handleGetAddresses = async () => {
    const result = await request('getAddresses', {
      purposes: ['payment', 'ordinals'],
    });
    if (result.status === 'success') {
      console.log('Addresses:', result.result);
    }
  };

  const handleSignMessage = async () => {
    const result = await request('signMessage', {
      address: 'bc1p...', // use address from getAddresses
      message: 'Hello Bitcoin!',
    });
    if (result.status === 'success') {
      setSignature(result.result.signature);
    }
  };

  const handleSignPsbt = async () => {
    const result = await request('signPsbt', {
      psbt: 'cHNidP8BA...', // base64 PSBT
      signInputs: {
        'bc1p...': [0, 1], // address -> input indices to sign
      },
    });
    if (result.status === 'success') {
      console.log('Signed PSBT:', result.result.psbt);
    }
  };

  return (
    <div>
      {/* The component registers the provider automatically */}
      <ZeldWalletCard autoconnect />

      <button onClick={handleGetAddresses}>Get Addresses</button>
      <button onClick={handleSignMessage}>Sign Message</button>
      <button onClick={handleSignPsbt}>Sign PSBT</button>

      {signature && <pre>{signature}</pre>}
    </div>
  );
}
```

### HTML example with sats-connect

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script type="module">
    import { Buffer } from 'buffer';
    if (!window.Buffer) window.Buffer = Buffer;
  </script>
</head>
<body>
  <zeld-wallet-ui autoconnect="true"></zeld-wallet-ui>

  <button id="get-addresses">Get Addresses</button>
  <button id="sign-message">Sign Message</button>
  <button id="sign-psbt">Sign PSBT</button>
  <pre id="output"></pre>

  <script type="module">
    import { defineZeldWalletUI } from 'zeldwallet';
    import { request } from 'sats-connect';

    defineZeldWalletUI();

    const output = document.getElementById('output');

    document.getElementById('get-addresses').onclick = async () => {
      const result = await request('getAddresses', {
        purposes: ['payment', 'ordinals'],
      });
      output.textContent = JSON.stringify(result, null, 2);
    };

    document.getElementById('sign-message').onclick = async () => {
      const result = await request('signMessage', {
        address: 'bc1p...', // use address from getAddresses
        message: 'Hello Bitcoin!',
      });
      output.textContent = JSON.stringify(result, null, 2);
    };

    document.getElementById('sign-psbt').onclick = async () => {
      const result = await request('signPsbt', {
        psbt: 'cHNidP8BA...', // base64 PSBT
        signInputs: { 'bc1p...': [0] },
      });
      output.textContent = JSON.stringify(result, null, 2);
    };
  </script>
</body>
</html>
```

### Why use sats-connect?

Using sats-connect gives you **wallet-agnostic code**: your dApp works with ZeldWallet, Xverse, Leather, and any other WBIP-compatible wallet without changes. Users can switch wallets and your signing logic stays the same.

See [`examples/with-sats-connect.html`](../../examples/with-sats-connect.html) for a complete demo showing ZeldWallet alongside other detected wallets.

---

## UI States

| Status | Description |
|--------|-------------|
| `loading` | Bootstrapping wallet (create/unlock/apply network) |
| `locked` | Password required; shows unlock form |
| `ready` | Wallet unlocked; shows addresses and actions |
| `error` | Unexpected failure; shows error message |

When ready, inline warnings appear if the wallet lacks a password or backup.

---

## Styling

The component uses Shadow DOM. Customize from outside using `::part` selectors or CSS classes.

### Available parts

| Part | Element |
|------|---------|
| `container` | Main card wrapper |
| `row` | Address row |
| `copy-button` | Copy address button |
| `password-button` | Show/hide password button |

### Internal classes

These classes can be targeted when prefixed with a host class:

- `.zeldwallet-card`
- `.zeldwallet-row`
- `.zeldwallet-label`
- `.zeldwallet-value`
- `.zeldwallet-copy`
- `.zeldwallet-status`
- `.zeldwallet-password-form`
- `.zeldwallet-set-password-form`
- `.zeldwallet-backup-form`

### Dark theme example

```css
.dark-card ::part(container),
.dark-card .zeldwallet-card {
  background: #0b1021;
  color: #e2e8f0;
  border-color: #1e293b;
}

.dark-card .zeldwallet-row {
  background: #11172b;
  border-color: #1e293b;
}

.dark-card ::part(copy-button),
.dark-card ::part(password-button) {
  background: #22c55e;
  border-color: #22c55e;
  color: #0b1021;
}
```

> **React tip:** Use `variant="dark"` on `<ZeldWalletCard>` to apply the dark theme class automatically.

---

## Tips

- **Manual connection:** Set `autoconnect="false"` (web) or `autoconnect={false}` (React) and call `connect(password?)` when ready.
- **Testnet:** Set `network="testnet"` before connecting to derive testnet addresses.
- **Dynamic locale:** Changing `lang` re-renders the UI with localized strings immediately.
- **Wallet reset:** Call `ZeldWallet.destroy()` to clear storage, then recreate the component or call `connect()` to provision a fresh wallet.
