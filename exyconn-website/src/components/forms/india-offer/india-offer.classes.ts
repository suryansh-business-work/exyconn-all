// The offer page's own compact field styling — smaller text and label than the other forms.
const INPUT_BASE =
  "w-full px-4 py-3 bg-surface-subtle border rounded-xl text-fg placeholder-fg-faint focus:outline-none focus:ring-2 transition-all text-sm";
const INPUT_NORMAL = `${INPUT_BASE} border-line focus:border-blue focus:ring-blue/20`;
const INPUT_ERROR = `${INPUT_BASE} border-red-muted bg-red-subtle focus:border-red focus:ring-red/20`;

export const OFFER_LABEL_CLASSES = "block text-sm font-semibold text-fg-secondary mb-1.5";
export const OFFER_ERROR_CLASSES = "text-red-fg text-xs mt-1 flex items-center gap-1";

/** The input's resting style, or the red one while it holds an error. */
export function offerInputClass(invalid = false): string {
  return invalid ? INPUT_ERROR : INPUT_NORMAL;
}
