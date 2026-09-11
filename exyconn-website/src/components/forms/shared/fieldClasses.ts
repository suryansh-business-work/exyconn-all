/** The focus colour a form borrows from its page — blue for most, amber on the legal page. */
export type Accent = "blue" | "amber";

// Full literal class strings, never assembled, so Tailwind's scanner can find every one.
const INPUT_CLASSES: Record<Accent, string> = {
  blue: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all",
  amber:
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all",
};

const ERROR_INPUT_CLASSES =
  "w-full px-4 py-3 bg-red-50 border border-red-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all";

export const LABEL_CLASSES = "block text-sm font-medium text-gray-700 mb-2";
export const ERROR_CLASSES = "text-red-500 text-xs mt-1";

/** The input's classes: the accent's resting style, or the red one while it holds an error. */
export function inputClassName(accent: Accent, invalid = false): string {
  return invalid ? ERROR_INPUT_CLASSES : INPUT_CLASSES[accent];
}
