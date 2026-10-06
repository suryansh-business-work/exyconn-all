/** Pure helpers behind the detail sections: list points and the tabs' keys and pager. */

/** "Example: Basic chatbots" → a bold term and its text; anything else is plain text. */
export const splitPoint = (value: string): { term?: string; text: string } => {
  const match = /^([A-Z][\w-]*(?: [\w-]+){0,2}): (.+)$/.exec(value);
  return match ? { term: match[1], text: match[2] } : { text: value };
};

const TAB_KEYS: Readonly<Record<string, (current: number, total: number) => number>> = {
  ArrowRight: (current, total) => (current + 1) % total,
  ArrowDown: (current, total) => (current + 1) % total,
  ArrowLeft: (current, total) => (current - 1 + total) % total,
  ArrowUp: (current, total) => (current - 1 + total) % total,
  Home: () => 0,
  End: (_, total) => total - 1,
};

/** The tab a key moves to (WAI-ARIA tabs pattern, wrapping), or undefined for other keys. */
export const tabForKey = (key: string, current: number, total: number): number | undefined =>
  TAB_KEYS[key]?.(current, total);

/** The pager's position, e.g. "03 / 24". */
export const tabPosition = (current: number, total: number): string =>
  `${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
