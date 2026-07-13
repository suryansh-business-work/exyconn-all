import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    /* Vitest configuration */
    include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
    exclude: ["node_modules", "dist", ".astro"],
    globals: true,
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
