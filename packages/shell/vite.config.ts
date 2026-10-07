import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));
const uiSrc = fileURLToPath(new URL('../ui/src', import.meta.url));

/** The shell is consumed as source by the apps; this config only runs its tests. */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@exyconn\/ui$/, replacement: `${uiSrc}/index.ts` },
      { find: /^@exyconn\/ui\/(.*)$/, replacement: `${uiSrc}/$1` },
      { find: /^@\/(.*)$/, replacement: `${src}/$1` },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./__tests__/unit-tests/setup.ts'],
    include: ['__tests__/unit-tests/**/*.{test,spec}.{ts,tsx}'],
    // These drive real components through userEvent — a typed search, an opened section —
    // and an MUI Autocomplete takes seconds of that on a loaded machine. Five was enough
    // when the suite ran alone and not when CI runs three packages at once.
    testTimeout: 20_000,
    coverage: {
      // Mirrors CI: every source file counts, including ones no test imports yet. Component
      // specs (*.cy.tsx) run under Cypress, not here, so they are not source.
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
    },
  },
});
