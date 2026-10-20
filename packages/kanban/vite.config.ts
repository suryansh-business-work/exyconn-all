import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const uiSrc = fileURLToPath(new URL('../ui/src', import.meta.url));

/** The package is consumed as source by the apps; this config only runs its tests. */
export default defineConfig({
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
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
