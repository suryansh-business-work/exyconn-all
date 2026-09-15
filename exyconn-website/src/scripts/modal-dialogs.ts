/**
 * Keyboard behaviour every modal on the site shares — the mobile menu, search, and the
 * cookie and accessibility drawers.
 *
 * A modal is an `aria-modal="true"` element carrying `data-open`; its own script only flips
 * that attribute. From it, this module:
 *
 *  - makes a closed modal `inert`, so a drawer parked off-screen is not a row of invisible
 *    tab stops (WCAG 2.4.3, 2.4.7);
 *  - keeps Tab and Shift+Tab inside the open modal, so focus never wanders behind its
 *    backdrop (2.4.3, 2.4.11).
 *
 * Opening, Escape and returning focus stay with each modal, which knows its own trigger.
 */
const MODAL = '[aria-modal="true"][data-open]';
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const isOpen = (dialog: HTMLElement): boolean => dialog.dataset.open === "true";

function syncInert(dialog: HTMLElement): void {
  dialog.inert = !isOpen(dialog);
}

function tabStops(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => element.getClientRects().length > 0
  );
}

function containTab(event: KeyboardEvent): void {
  if (event.key !== "Tab") {
    return;
  }
  const dialog = [...document.querySelectorAll<HTMLElement>(MODAL)].findLast(isOpen);
  if (!dialog) {
    return;
  }
  const stops = tabStops(dialog);
  const first = stops.at(0);
  const last = stops.at(-1);
  if (!first || !last) {
    event.preventDefault();
    dialog.focus();
    return;
  }
  const active = document.activeElement;
  const outside = !dialog.contains(active);
  if (event.shiftKey && (outside || active === first)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (outside || active === last)) {
    event.preventDefault();
    first.focus();
  }
}

for (const dialog of document.querySelectorAll<HTMLElement>(MODAL)) {
  syncInert(dialog);
  new MutationObserver(() => syncInert(dialog)).observe(dialog, {
    attributes: true,
    attributeFilter: ["data-open"],
  });
}
document.addEventListener("keydown", containTab);
