import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const walletCoreEntry = fileURLToPath(new URL('../../packages/wallet-core/src/index.ts', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@genpay/wallet-core': walletCoreEntry,
    },
  },
});
