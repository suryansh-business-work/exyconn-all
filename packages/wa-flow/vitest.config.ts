import { defineConfig } from 'vitest/config';

/*
 * Pure TypeScript (Zod + @exyconn/regex), so plain node. The engine reads local dates
 * (getDay, new Date(y, m, d)), so every run pins UTC; workers inherit it from here.
 * Coverage counts every src file as CI does.
 */
process.env.TZ = 'UTC';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
    },
  },
});
