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
      // Mirrors CI: every source file counts, including ones no test imports yet. Component
      // specs (*.cy.tsx) run under Cypress, not here, so they are not source.
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
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
