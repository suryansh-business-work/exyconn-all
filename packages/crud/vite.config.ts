import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const shellSrc = fileURLToPath(new URL('../shell/src', import.meta.url));
const uiSrc = fileURLToPath(new URL('../ui/src', import.meta.url));

/** The kit is consumed as source by the apps; this config only runs its tests. */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@exyconn\/ui$/, replacement: `${uiSrc}/index.ts` },
      { find: /^@exyconn\/ui\/(.*)$/, replacement: `${uiSrc}/$1` },
      { find: /^@exyconn\/shell$/, replacement: `${shellSrc}/index.ts` },
      { find: /^@exyconn\/shell\/(.*)$/, replacement: `${shellSrc}/$1` },
      { find: /^@\/(.*)$/, replacement: `${shellSrc}/$1` },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['@testing-library/jest-dom/vitest'],
    include: ['__tests__/unit-tests/**/*.{test,spec}.{ts,tsx}'],
    // Real MUI dialogs and the lazily-loaded grid render here; give a loaded CI box room.
    testTimeout: 20_000,
    // Mirrors CI: every source file counts, including ones no test imports yet.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
    },
  },
});
