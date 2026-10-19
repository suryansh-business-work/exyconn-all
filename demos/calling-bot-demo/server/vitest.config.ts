import { defineConfig } from 'vitest/config';

/** The voice server is plain node; coverage counts every src file as CI does. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    // env.ts reads these when it loads; the suites never reach a real database.
    env: { MONGODB_URI: 'mongodb://voice.test/calls', PUBLIC_URL: 'https://voice.test/api/' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
    },
  },
});
