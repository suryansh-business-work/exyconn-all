import { portalViteConfig } from '@exyconn/config/vite';

/** Every line of the demo is tested; the gate keeps it that way. */
const FULL = { statements: 100, branches: 100, functions: 100, lines: 100 };

const base = portalViteConfig('meeting-bot-demo');

export default {
  ...base,
  test: {
    ...base.test,
    coverage: {
      // Mirrors CI: every source file counts, including ones no test imports yet.
      provider: 'v8' as const,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
      // Only enforced when coverage runs (CI's unit-test step).
      thresholds: FULL,
    },
  },
};
