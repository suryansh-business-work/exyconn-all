import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import { defineConstants } from './scripts/lib/defines.mjs';

const uiSrc = fileURLToPath(new URL('../packages/ui/src', import.meta.url));

/**
 * Unit tests run in jsdom (the Meet adapter reads fixture DOM; components render with Testing
 * Library). Coverage is held at 100% over ALL of src — as CI measures it — and the build
 * scripts' rules.
 */
export default defineConfig({
  define: defineConstants('development'),
  resolve: {
    alias: [
      { find: /^@exyconn\/ui$/, replacement: `${uiSrc}/index.ts` },
      { find: /^@exyconn\/ui\/(.*)$/, replacement: `${uiSrc}/$1` },
    ],
  },
  test: {
    globals: true,
    // The worker and entry tests import a whole module graph afresh; the first import in a file
    // also pays the transform, which under coverage on a busy machine takes tens of seconds.
    testTimeout: 60_000,
    environment: 'jsdom',
    setupFiles: ['__tests__/unit-tests/setup.ts'],
    include: ['__tests__/unit-tests/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'scripts/lib/**/*.mjs'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
      reporter: ['text', 'json-summary'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
