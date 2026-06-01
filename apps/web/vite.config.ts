import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@genpay/wallet-core': '../../packages/wallet-core/src/index.ts',
    },
  },
});
