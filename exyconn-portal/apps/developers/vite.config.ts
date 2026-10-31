import { portalViteConfig } from '@exyconn/config/vite';

const base = portalViteConfig('developers');

export default {
  ...base,
  test: {
    ...base.test,
    coverage: {
      ...base.test?.coverage,
      // Mirrors CI: every source file counts, including ones no test imports yet.
      provider: 'v8' as const,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
};
