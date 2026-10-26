import { defineConfig } from 'vitest/config';

/** Pure validation code, so plain node; coverage counts every src file as CI does. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
    },
  },
});
