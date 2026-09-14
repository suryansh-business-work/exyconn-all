import { appendFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

const supportFile = fileURLToPath(
  new URL(
    "../../exyconn-portal/ui/cypress/support/component.tsx",
    import.meta.url,
  ),
);

const indexHtmlFile = fileURLToPath(
  new URL(
    "../../exyconn-portal/ui/cypress/support/component-index.html",
    import.meta.url,
  ),
);

/**
 * Where axe's results go: one JSON line per test it checked (with that test's violations, if
 * any), in the package being tested. CI turns every package's file into the PR's accessibility
 * report (.github/scripts/pr-reports/a11y.mjs).
 */
const A11Y_REPORT_DIR = "cypress/a11y";

/** Registers the `a11yRecord` task the shared support file calls after every test. */
export function registerA11yTasks(on) {
  on("task", {
    a11yRecord(entry) {
      mkdirSync(A11Y_REPORT_DIR, { recursive: true });
      appendFileSync(
        `${A11Y_REPORT_DIR}/report.jsonl`,
        `${JSON.stringify(entry)}\n`,
      );
      return null;
    },
  });
}

/** Cypress component-testing config shared by every portal package. */
export function portalCypressConfig() {
  return {
    video: false,
    component: {
      devServer: { framework: "react", bundler: "vite" },
      specPattern: "src/**/*.cy.{ts,tsx}",
      supportFile,
      indexHtmlFile,
      setupNodeEvents: registerA11yTasks,
    },
  };
}
