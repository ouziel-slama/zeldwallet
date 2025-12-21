# React demo

Minimal Vite setup that reuses the built ESM bundle.

## Run locally

```bash
# From repo root
npm install
npm run build        # refresh dist/zeldwallet.es.js
npm run dev
```

Open http://localhost:5173/react/ (or just visit the landing page at http://localhost:5173/ and click “React demo”). If you prefer to run this demo alone, the standalone config is still available via `npx vite --config examples/react/vite.config.ts`.

The page mounts `ZeldWalletCard`, lets you toggle language and dark mode, destroy/remount the wallet, and sign an arbitrary message once unlocked.

