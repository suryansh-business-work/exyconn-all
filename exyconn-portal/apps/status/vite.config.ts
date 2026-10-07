import { portalViteConfig } from '@exyconn/config/vite';

const base = portalViteConfig('status');

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
    },
  },
};
