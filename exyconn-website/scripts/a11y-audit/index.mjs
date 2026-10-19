/**
 * WCAG 2.2 AA audit of a running website: axe-core plus the checks in page-checks.mjs, for
 * every page in pages.json, in light and dark, at phone and desktop widths, and a 320px
 * reflow pass.
 *
 *   pnpm run build && node dist/server/entry.mjs      # or `pnpm dev`
 *   pnpm run a11y:audit -- --base http://127.0.0.1:4000 --out ./a11y-report
 *
 * axe-core is read from the workspace's `@exyconn/ui` install (see audit.mjs).
 * Point CHROME_PATH at a Chrome binary off macOS.
 */
import { main } from "./audit.mjs";

process.exitCode = await main(process.argv.slice(2));
