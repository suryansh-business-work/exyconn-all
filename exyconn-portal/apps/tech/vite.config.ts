import { portalViteConfig } from '@exyconn/config/vite';

const base = portalViteConfig('tech');

export default {
  ...base,
  test: {
    ...base.test,
    // The shared jest-dom matchers, then this app's stand-in for the browser-only code editor.
    setupFiles: [...(base.test?.setupFiles ?? []), './__tests__/unit-tests/setup.tsx'],
    coverage: {
      // Mirrors CI: every source file counts, including ones no test imports yet.
      provider: 'v8' as const,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
    },
  },
};
