/** The focus colour a form borrows from its page — blue for most, amber on the legal page. */
export type Accent = "blue" | "amber";

// Full literal class strings, never assembled, so Tailwind's scanner can find every one.
const INPUT_CLASSES: Record<Accent, string> = {
  blue: "w-full px-4 py-3 bg-surface-subtle border border-line rounded-xl text-fg placeholder-fg-faint focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 transition-all",
  amber:
    "w-full px-4 py-3 bg-surface-subtle border border-line rounded-xl text-fg placeholder-fg-faint focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/20 transition-all",
};

const ERROR_INPUT_CLASSES =
  "w-full px-4 py-3 bg-red-subtle border border-red-muted rounded-xl text-fg placeholder-fg-faint focus:outline-none focus:border-red focus:ring-2 focus:ring-red/20 transition-all";

export const LABEL_CLASSES = "block text-sm font-medium text-fg-secondary mb-2";
export const ERROR_CLASSES = "text-red-fg text-xs mt-1";

/** The input's classes: the accent's resting style, or the red one while it holds an error. */
export function inputClassName(accent: Accent, invalid = false): string {
  return invalid ? ERROR_INPUT_CLASSES : INPUT_CLASSES[accent];
}
