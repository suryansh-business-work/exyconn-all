import { defineConfig } from 'vitest/config';
import { portalViteConfig } from '../../../packages/shell/vite.shared';

export default defineConfig({
  ...portalViteConfig(4028),
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/unit-tests/**/*.{test,spec}.{ts,tsx}'],
  },
});
