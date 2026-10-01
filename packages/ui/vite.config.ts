import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));

/** The design system is consumed as source by every app; this config only runs its tests. */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@exyconn\/ui$/, replacement: `${src}/index.ts` },
      { find: /^@exyconn\/ui\/(.*)$/, replacement: `${src}/$1` },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['@testing-library/jest-dom/vitest'],
    include: ['__tests__/unit-tests/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      // Component specs run under Cypress, not here; counting them as source would hold the
      // tokens below their threshold for a file no unit test can execute.
      exclude: ['**/*.cy.{ts,tsx}'],
      // The tokens and the theme are read in two modes from two files; a line nobody ran in
      // one of them is how a dark-only bug ships. Held at 100% for both — every override's
      // every branch is driven in each mode by theme-overrides.test.ts.
      thresholds: {
        'src/tokens/**': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/theme/**': { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
  },
});
