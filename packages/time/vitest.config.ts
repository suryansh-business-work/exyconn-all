import { defineConfig } from 'vitest/config';

/** Zero-dependency `Intl` code: plain node, no DOM. Coverage mirrors CI. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
      reporter: ['text', 'json-summary'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
