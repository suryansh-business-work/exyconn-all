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
      // Only enforced when coverage runs (CI's unit-test step), and only for this folder.
      thresholds: { 'src/pages/permissions/**/*.{ts,tsx}': FULL },
    },
  },
};
