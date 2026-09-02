import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

/** The shell is consumed as source by the apps; this config only runs its tests. */
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../config/vitest.setup.ts'],
    include: ['__tests__/unit-tests/**/*.{test,spec}.{ts,tsx}'],
  },
});
