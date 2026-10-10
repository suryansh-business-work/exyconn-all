import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@exyconn/seo': path.resolve(__dirname, '../../packages/seo/src/index.ts') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    exclude: ['node_modules', 'dist', 'build'],
    // The first test to import the app pays for transforming MUI and the tool pages, which can
    // pass vitest's default 5s on a busy runner (more so under coverage instrumentation).
    testTimeout: 30000,
    // Cap workers: the per-tool suites each boot jsdom + heavy canvas/PDF mocks,
    // and an unbounded fork pool exhausts IPC handles on Windows CI runners.
    pool: 'threads',
    poolOptions: { threads: { maxThreads: 4, minThreads: 1 } },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', 'build', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
