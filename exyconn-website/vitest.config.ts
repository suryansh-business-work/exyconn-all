import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Not astro/config's getViteConfig: under Vitest it throws during config load and no test
// file is collected. No test imports a .astro file, so the Astro vite pipeline is not needed;
// the one Astro virtual module the TS sources import is aliased to a stand-in below.
export default defineConfig({
  // Astro's tsconfig sets `jsx: "preserve"` (its React integration compiles islands); Vitest
  // has no such plugin, so the React islands are compiled with the automatic runtime here.
  oxc: { jsx: { runtime: "automatic", importSource: "react" } },
  resolve: {
    alias: {
      "astro:middleware": fileURLToPath(
        new URL("./__tests__/unit-tests/mocks/astro-middleware.ts", import.meta.url)
      ),
    },
  },
  test: {
    include: [
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}",
      "__tests__/unit-tests/**/*.test.{ts,tsx}",
    ],
    exclude: ["node_modules", "dist", ".astro"],
    globals: true,
    // Node by default; React islands and DOM scripts opt in with `// @vitest-environment jsdom`.
    environment: "node",
    setupFiles: ["./__tests__/unit-tests/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      // Mirrors CI: every source file counts, including ones no test imports yet.
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["**/*.{test,cy}.{ts,tsx}", "**/graphql/generated/**"],
    },
  },
});
