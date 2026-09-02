import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const shellSrc = fileURLToPath(new URL('../shell/src', import.meta.url));

/** The kit is consumed as source by the apps; this config only runs its tests. */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@exyconn\/shell$/, replacement: `${shellSrc}/index.ts` },
      { find: /^@exyconn\/shell\/(.*)$/, replacement: `${shellSrc}/$1` },
      { find: /^@\/(.*)$/, replacement: `${shellSrc}/$1` },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../config/vitest.setup.ts'],
    include: ['__tests__/unit-tests/**/*.{test,spec}.{ts,tsx}'],
  },
});
