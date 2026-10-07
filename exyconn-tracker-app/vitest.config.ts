import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@shared': resolve(__dirname, 'src/shared') },
    // The same pinning as the renderer build: @exyconn/ui compiles from source and would
    // otherwise resolve its own React, and hooks would run against a second copy.
    dedupe: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
  },
  esbuild: { jsx: 'automatic' },
  test: {
    // Main-process code runs under node; renderer tests opt into jsdom per file with
    // `// @vitest-environment jsdom`.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', '__tests__/unit-tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Mirrors CI: every source file counts, including the ones no test imports yet.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
    },
  },
});
