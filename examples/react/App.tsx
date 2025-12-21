import { useRef, useState } from 'react';
import {
  ZeldWalletCard,
  type ZeldWalletCardRef,
  languages,
  type LocaleKey,
  UnifiedWallet,
} from '../../dist/zeldwallet.es.js';
import { ZeldWallet } from '../../dist/zeldwallet.es.js';

const defaultSignature = '(waiting for signature)';

export default function App(): JSX.Element {
  const [lang, setLang] = useState<LocaleKey>('en');
  const [darkCard, setDarkCard] = useState(true);
  const [message, setMessage] = useState('Hello Bitcoin!');
  const [signature, setSignature] = useState(defaultSignature);
  const [instanceKey, setInstanceKey] = useState(0);
  const walletRef = useRef<ZeldWalletCardRef>(null);

  const network: 'mainnet' | 'testnet' = 'mainnet';

  const destroyAndRecreate = async (): Promise<void> => {
    await ZeldWallet.destroy();
    UnifiedWallet.reset();
    setSignature(defaultSignature);
    setInstanceKey((value) => value + 1);
  };

  const getPaymentAddress = (): string | undefined => {
    const addresses = UnifiedWallet.getAddresses(['payment']);
    return addresses?.[0]?.address;
  };

  const signMessage = async (): Promise<void> => {
    setSignature('Signing...');
    try {
      const paymentAddress = getPaymentAddress();
      if (!paymentAddress) {
        setSignature('Connect a wallet and fetch an address first.');
        return;
      }
      const nextMessage = message.trim() || 'Hello Bitcoin!';
      const signatureValue = await UnifiedWallet.signMessage(nextMessage, paymentAddress);
      setSignature(`${UnifiedWallet.getActiveName()}: ${signatureValue}`);
    } catch (error) {
      setSignature(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <main className="page">
      <style>
        {`
        body {
          font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
          background: #f8fafc;
          margin: 24px;
          color: #0f172a;
        }
        .page {
          max-width: 720px;
          margin: 0 auto;
          display: grid;
          gap: 16px;
        }
        .controls {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        select,
        button {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #fff;
          font-weight: 600;
          cursor: pointer;
        }
        button {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
        }
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
        .dark-card .zeldwallet-copy,
        .dark-card .zeldwallet-password-button {
          background: #22c55e;
          border-color: #22c55e;
        }
        .sign-card {
          background: #fff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
          display: grid;
          gap: 10px;
        }
        .sign-card textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px;
          min-height: 90px;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        }
        .sign-card pre {
          margin: 0;
          padding: 10px;
          background: #0f172a;
          color: #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          overflow-x: auto;
        }
        .sign-card button {
          width: fit-content;
        }
      `}
      </style>

      <h1>ZeldWallet Web Component (React)</h1>
      <p>
        The component silently creates or unlocks a ZeldWallet instance on connect, renders payment and ordinals
        addresses, and shows a password prompt if the wallet is protected.
      </p>

      <div className="controls">
        <label htmlFor="lang">Language:</label>
        <select id="lang" value={lang} onChange={(event) => setLang(event.target.value as LocaleKey)}>
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native} ({l.name})
            </option>
          ))}
        </select>
        <button type="button" onClick={destroyAndRecreate}>
          Destroy Wallet
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={darkCard} onChange={(event) => setDarkCard(event.target.checked)} /> Dark
          card styles
        </label>
      </div>

      <ZeldWalletCard
        key={instanceKey}
        ref={walletRef}
        lang={lang}
        network={network}
        variant={darkCard ? 'dark' : 'light'}
        autoconnect
        className={darkCard ? 'dark-card' : undefined}
      />

      <section className="sign-card">
        <h2 style={{ margin: 0 }}>Programmatic signing</h2>
        <p style={{ margin: 0 }}>
          Once the component is unlocked, you can call the underlying <code>ZeldWallet</code> instance. This example
          signs an arbitrary message using the derived payment address.
        </p>
        <label htmlFor="message">Message to sign</label>
        <textarea
          id="message"
          placeholder="Hello Bitcoin!"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button type="button" onClick={signMessage}>
          Sign message
        </button>
        <div>
          <strong>Signature output</strong>
          <pre>{signature}</pre>
        </div>
      </section>
    </main>
  );
}

