import { portalViteConfig } from '@exyconn/config/vite';

const base = portalViteConfig('admin');

/** Roles & Permissions decides who can do what everywhere, so its tests must reach every line. */
const FULL = { statements: 100, branches: 100, functions: 100, lines: 100 };

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
      // Only enforced when coverage runs (CI's unit-test step), and only for this folder.
      thresholds: { 'src/pages/permissions/**/*.{ts,tsx}': FULL },
    },
  },
};
