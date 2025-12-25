import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import wasm from 'vite-plugin-wasm';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const isServe = command === 'serve';

  return {
    // Serve the examples during `npm run dev`, keep the library build rooted at repo root.
    root: isServe ? resolve(__dirname, 'examples') : __dirname,
    // Public directory for static assets (WASM files, workers)
    publicDir: resolve(__dirname, 'public'),
    plugins: [
      react(),
      wasm(),
      dts({
        insertTypesEntry: true,
      }),
    ],
    define: {
      'global': 'globalThis',
    },
    server: {
      port: 5173,
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'ZeldWallet',
        // ES-only build keeps the tiny-secp256k1 (wasm) path happy and avoids UMD/IIFE quirks
        formats: ['es'],
        fileName: (format) => `zeldwallet.${format}.js`,
      },
      target: 'esnext',
    rollupOptions: {
      // Keep React and zeldhash-miner external to avoid duplicating/bundling in consuming apps
      // zeldhash-miner uses Web Workers that need special handling at runtime
      external: ['react', 'react/jsx-runtime', 'zeldhash-miner'],
      output: {
        exports: 'named',
      },
    },
      sourcemap: true,
      minify: 'esbuild',
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        'buffer': 'buffer',
      },
    },
    optimizeDeps: {
      include: ['buffer', 'tiny-secp256k1'],
      // Exclude zeldhash-miner from pre-bundling as it uses Web Workers and dynamic WASM imports
      exclude: ['zeldhash-miner'],
    },
    test: {
      globals: true,
      environment: 'node',
      setupFiles: ['./tests/setup.ts'],
    },
  };
});

