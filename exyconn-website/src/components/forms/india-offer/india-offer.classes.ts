// The offer page's own compact field styling — smaller text and label than the other forms.
const INPUT_BASE =
  "w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-sm";
const INPUT_NORMAL = `${INPUT_BASE} border-gray-200 focus:border-blue-500 focus:ring-blue-500/20`;
const INPUT_ERROR = `${INPUT_BASE} border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20`;

export const OFFER_LABEL_CLASSES = "block text-sm font-semibold text-gray-700 mb-1.5";
export const OFFER_ERROR_CLASSES = "text-red-500 text-xs mt-1 flex items-center gap-1";

/** The input's resting style, or the red one while it holds an error. */
export function offerInputClass(invalid = false): string {
  return invalid ? INPUT_ERROR : INPUT_NORMAL;
}
