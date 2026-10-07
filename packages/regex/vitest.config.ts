import { defineConfig } from 'vitest/config';

/** Zero-dependency patterns, so plain node; coverage counts every src file as CI does. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
