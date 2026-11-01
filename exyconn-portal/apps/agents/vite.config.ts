import { portalViteConfig } from '@exyconn/config/vite';

const base = portalViteConfig('agents');

/** What the console added beyond the screens it took over: its routes and the overview. */
const FULL = { statements: 100, branches: 100, functions: 100, lines: 100 };

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
      // Only enforced when coverage runs (CI's unit-test step), and only for these files.
      thresholds: {
        'src/{App,main}.tsx': FULL,
        'src/pages/overview/**/*.{ts,tsx}': FULL,
        'src/pages/bots/whatsapp/{WhatsappAgentPage.tsx,whatsappAgent.paths.ts}': FULL,
      },
    },
  },
};
