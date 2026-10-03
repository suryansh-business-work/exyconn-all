/** One choice in a font picker. `''` is "as the document's default". */
export interface FontOption {
  value: string;
  label: string;
}

/**
 * The faces a document may be set in. Each is a stack ending in a generic family, so text
 * still renders on a machine without the named face; the Word download keeps the first name.
 */
export const FONT_FAMILIES: readonly FontOption[] = [
  { value: '', label: 'Default font' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New' },
];

/** Text sizes, in pixels as the editor stores them. */
export const FONT_SIZES: readonly FontOption[] = [
  { value: '', label: 'Default size' },
  ...[12, 14, 16, 18, 20, 24, 30, 36].map((size) => ({ value: `${size}px`, label: String(size) })),
];
