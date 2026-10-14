import { portalViteConfig } from '@exyconn/config/vite';

const base = portalViteConfig('hub');

/** Consumed as source by the demos; this config exists for its tests. */
export default {
  ...base,
  test: {
    ...base.test,
    // Mirrors CI: every source file counts, including ones no test imports yet.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
    },
  },
};
