/**
 * The calculator's interface copy. Kept in one module (like the chat embed's strings.ts) because
 * text rendered in the browser after hydration is not reached by the site's HTML translation.
 */
export const UI = {
  loading: "Loading your saved estimates…",
  store: {
    defaultName: "My GCC estimate",
    corrupt:
      "A saved estimate could not be read and was skipped. Your other estimates are unaffected.",
    missing: "A saved estimate was not found in this browser.",
    localOnly:
      "Estimates are saved in this browser only (local storage). They are not synced to other devices — export JSON to move one.",
  },
  save: {
    pending: "Saving…",
    saved: (time: string) => `Saved locally · ${time}`,
    idle: "Saved locally",
    invalid: (count: number) =>
      `Not saved — fix ${count} highlighted ${count === 1 ? "field" : "fields"} to save and update totals`,
    unavailable:
      "This browser is not saving (storage is blocked or private). Export JSON to keep your work.",
    quota:
      "Browser storage is full, so this estimate was not saved. Export JSON, or delete an old estimate.",
    conflict:
      "This estimate was changed in another tab. Choose which version to keep before saving again.",
    keepMine: "Keep this tab's version",
    keepTheirs: "Load the other tab's version",
    saveNow: "Save",
  },
  estimates: {
    label: "Estimate",
    menu: "Estimate actions",
    create: "New estimate",
    rename: "Rename",
    duplicate: "Duplicate estimate",
    remove: "Delete estimate",
    reset: "Reset to defaults",
    nameLabel: "Estimate name",
    copySuffix: " (copy)",
    confirmDelete: (name: string) => `Delete “${name}” from this browser? This cannot be undone.`,
    confirmReset:
      "Reset this estimate to the default assumptions? Everything you entered in it will be replaced. Export JSON first if you may need it.",
    presetOffer: (name: string) => `You opened the calculator with the ${name} preset.`,
    presetAction: "Start a new estimate from it",
  },
  scenarios: {
    label: "Scenario",
    duplicate: "Duplicate scenario",
    remove: "Delete scenario",
    rename: "Scenario name",
    copySuffix: " copy",
    confirmDelete: (name: string) => `Delete the “${name}” scenario from this estimate?`,
    limit: "An estimate can hold up to six scenarios.",
  },
  nav: {
    progress: (step: number, total: number) => `Step ${step} of ${total}`,
    sections: "Calculator sections",
    back: "Back",
    next: "Next",
    results: "See results",
    fixErrors: "Some fields in this section need attention.",
  },
  summary: {
    title: "Estimate summary",
    scenario: (name: string, months: number) => `${name} · ${months}-month forecast`,
    setup: "One-time setup",
    deposits: "Refundable deposits",
    initialCash: "Initial cash requirement",
    monthly: (month: number) => `Monthly operating (month ${month})`,
    perEmployee: "Cost per employee / month",
    forecast: "Forecast total",
    breakdown: "Cost breakdown",
    stale: "Totals reflect the last valid inputs.",
    missingRate: (currency: string) =>
      `Add an exchange rate for ${currency} — items priced in it are not counted yet.`,
    preTax: "Pre-tax. Forecast total includes tax and contingency, excludes deposits.",
    empty: "Add roles or costs to see an estimate.",
  },
  confirm: { cancel: "Cancel", confirm: "Confirm", remove: "Delete", reset: "Reset" },
  common: {
    add: "Add",
    remove: "Remove",
    duplicate: "Duplicate",
    moveUp: "Move up",
    moveDown: "Move down",
    advanced: "Advanced settings",
    optional: "Optional",
    close: "Close",
    retry: "Try again",
  },
} as const;
