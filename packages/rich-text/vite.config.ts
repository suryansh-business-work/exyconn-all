import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const uiSrc = fileURLToPath(new URL('../ui/src', import.meta.url));

/** The package is consumed as source by the apps; this config only runs its tests. */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@exyconn\/ui$/, replacement: `${uiSrc}/index.ts` },
      { find: /^@exyconn\/ui\/(.*)$/, replacement: `${uiSrc}/$1` },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['@testing-library/jest-dom/vitest'],
    include: ['__tests__/unit-tests/**/*.{test,spec}.{ts,tsx}'],
    // Mounting a TipTap editor and driving its toolbar is seconds of work; the default five
    // was enough alone and not when CI runs three packages at once.
    testTimeout: 20_000,
  },
});
