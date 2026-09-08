import { defineConfig } from 'vitest/config';

/** Consumed as source by the apps; this config only runs the package's tests. */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['@testing-library/jest-dom/vitest'],
    include: ['__tests__/unit-tests/**/*.{test,spec}.{ts,tsx}'],
  },
});
