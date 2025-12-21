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
        // Keep React external to avoid duplicating it in consuming apps
        external: ['react', 'react/jsx-runtime'],
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
    },
    test: {
      globals: true,
      environment: 'node',
      setupFiles: ['./tests/setup.ts'],
    },
  };
});

