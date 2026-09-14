import 'cypress-axe';
import axe, { type Result } from 'axe-core';

/**
 * WCAG 2.2 AA, checked on everything every component spec mounts.
 *
 * Runs after each test against what the test left on screen — the form filled in, the error
 * shown, the dialog open — in a real browser, so colour contrast is measured, not guessed.
 * Only the WCAG A/AA rule sets: a component rendered on its own has no page around it, so
 * page-level best practices ("content must be in a landmark", "one h1") would be noise here;
 * those are checked on the portal layout itself.
 *
 * `npx cypress run --component --expose A11Y=audit` records violations to
 * `cypress/a11y/report.jsonl` instead of failing, to measure every app in one pass; without it
 * a violation fails the test that left it behind.
 */
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

function describeViolations(violations: Result[]): string {
  return violations
    .map((v) => {
      const targets = v.nodes.map((node) => node.target.join(' ')).join(' | ');
      return `[${v.impact ?? 'n/a'}] ${v.id}: ${v.help} (${v.nodes.length}×) → ${targets}`;
    })
    .join('\n');
}

afterEach(() => {
  // Cypress 16 moved non-secret values to `Cypress.expose()` (the `--expose` flag).
  const audit = Cypress.expose('A11Y') === 'audit';
  // Injected from the bundle rather than `cy.injectAxe()`, which reads axe off the disk of
  // whichever app is under test — and it is installed once, here, for all of them.
  // Measure what the user settles on, not a frame of an animation: a snackbar caught while it
  // fades in reads as 1.05:1. Every CSS transition and animation on the page is waited out.
  // Only animations that END: a spinner or a skeleton pulse runs forever and would never settle.
  cy.document({ log: false }).then({ timeout: 10_000 }, (doc) =>
    Promise.all(
      doc
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  if (Cypress.testingType === 'component') {
    cy.window({ log: false }).then((win) => {
      if (!('axe' in win)) {
        (win as unknown as { eval: (source: string) => void }).eval(axe.source);
      }
    });
  } else {
    // End-to-end specs run from the hub, where axe is installed, and are bundled by webpack,
    // which cannot evaluate `axe.source` the way Vite's bundle can.
    cy.injectAxe();
  }
  cy.checkA11y(
    // A component spec checks what it mounted; an end-to-end spec checks the whole page.
    Cypress.testingType === 'component' ? '[data-cy-root]' : undefined,
    { runOnly: { type: 'tag', values: WCAG_AA } },
    (violations) => {
      const test = Cypress.currentTest.titlePath.join(' › ');
      if (audit) {
        cy.task(
          'a11yRecord',
          {
            spec: Cypress.spec.relative,
            test,
            violations: violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              help: v.help,
              nodes: v.nodes.map((n) => ({ target: n.target, html: n.html, summary: n.failureSummary })),
            })),
          },
          { log: false },
        );
      } else {
        Cypress.log({ name: 'a11y', message: `${test}\n${describeViolations(violations)}` });
      }
    },
    audit,
  );
});
