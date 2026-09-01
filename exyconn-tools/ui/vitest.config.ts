import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    exclude: ['node_modules', 'dist', 'build'],
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
