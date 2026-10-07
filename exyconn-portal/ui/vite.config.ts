import { portalViteConfig } from '@exyconn/config/vite';

const base = portalViteConfig('hub');

export default {
  ...base,
  test: {
    ...base.test,
    // Replaces the bare jest-dom entry: registers the matchers and clears the auth stores
    // between tests, so one test's sign-in never leaks into the next.
    setupFiles: ['./__tests__/unit-tests/setup.ts'],
    coverage: {
      // Mirrors CI: every source file counts, including ones no test imports yet. Component
      // specs (*.cy.tsx) run under Cypress, not here, so they are not source.
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
    },
  },
};
