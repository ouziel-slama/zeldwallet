import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      zeldwallet: resolve(__dirname, '../../dist/zeldwallet.es.js'),
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  server: {
    port: 4173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

