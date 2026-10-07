import { portalViteConfig } from '@exyconn/config/vite';

const base = portalViteConfig('hub');

/** Consumed as source by the apps; this config exists for its component tests. */
export default {
  ...base,
  test: {
    ...base.test,
    // Real components driven through userEvent are slow on a loaded CI runner.
    testTimeout: 20_000,
    // Mirrors CI: every source file counts, including ones no test imports yet.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
    },
  },
};
