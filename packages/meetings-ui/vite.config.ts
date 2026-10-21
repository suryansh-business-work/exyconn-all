import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const shellSrc = fileURLToPath(new URL('../shell/src', import.meta.url));
const uiSrc = fileURLToPath(new URL('../ui/src', import.meta.url));
const crudSrc = fileURLToPath(new URL('../crud/src', import.meta.url));
const tabberSrc = fileURLToPath(new URL('../tabber/src', import.meta.url));

/** The screens are consumed as source by the apps; this config only runs their tests. */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@exyconn\/ui$/, replacement: `${uiSrc}/index.ts` },
      { find: /^@exyconn\/ui\/(.*)$/, replacement: `${uiSrc}/$1` },
      { find: /^@exyconn\/shell$/, replacement: `${shellSrc}/index.ts` },
      { find: /^@exyconn\/shell\/(.*)$/, replacement: `${shellSrc}/$1` },
      { find: /^@exyconn\/crud$/, replacement: `${crudSrc}/index.ts` },
      { find: /^@exyconn\/crud\/(.*)$/, replacement: `${crudSrc}/$1` },
      { find: /^@exyconn\/tabber$/, replacement: `${tabberSrc}/index.ts` },
      { find: /^@exyconn\/tabber\/(.*)$/, replacement: `${tabberSrc}/$1` },
      { find: /^@\/(.*)$/, replacement: `${shellSrc}/$1` },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['@testing-library/jest-dom/vitest'],
    include: ['__tests__/unit-tests/**/*.{test,spec}.{ts,tsx}'],
    // Real MUI dialogs, selects and forms render here, and a screen test walks many of them;
    // instrumented for coverage on a loaded CI box a few take longer than the usual 20 seconds.
    testTimeout: 60_000,
    // Mirrors CI: every source file counts, including ones no test imports yet.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
