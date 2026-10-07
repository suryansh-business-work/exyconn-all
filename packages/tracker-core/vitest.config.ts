import { defineConfig } from 'vitest/config';

/** Framework-free tracker logic (no React, no DOM): plain node. Coverage mirrors CI. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
      reporter: ['text', 'json-summary'],
    },
  },
});
