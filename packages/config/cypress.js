import { appendFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const supportFile = fileURLToPath(
  new URL('../../exyconn-portal/ui/cypress/support/component.tsx', import.meta.url),
);

const indexHtmlFile = fileURLToPath(
  new URL('../../exyconn-portal/ui/cypress/support/component-index.html', import.meta.url),
);

/**
 * Where an accessibility audit run (`CYPRESS_A11Y=audit`) writes what axe found: one JSON line
 * per test with violations, in the package being tested.
 */
const A11Y_REPORT_DIR = 'cypress/a11y';

/** Cypress component-testing config shared by every portal package. */
export function portalCypressConfig() {
  return {
    video: false,
    component: {
      devServer: { framework: 'react', bundler: 'vite' },
      specPattern: 'src/**/*.cy.{ts,tsx}',
      supportFile,
      indexHtmlFile,
      setupNodeEvents(on) {
        on('task', {
          a11yRecord(entry) {
            if (entry.violations.length > 0) {
              mkdirSync(A11Y_REPORT_DIR, { recursive: true });
              appendFileSync(`${A11Y_REPORT_DIR}/report.jsonl`, `${JSON.stringify(entry)}\n`);
            }
            return null;
          },
        });
      },
    },
  };
}
