import { defineConfig } from "vitest/config";

// Not astro/config's getViteConfig: under Vitest 3 it throws during config load and
// no test file is collected. Neither suite imports a .astro file — one covers a plain
// TS module, the other shells out to the CLI — so the Astro vite pipeline is not needed.
export default defineConfig({
  test: {
    include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
    exclude: ["node_modules", "dist", ".astro"],
    globals: true,
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
