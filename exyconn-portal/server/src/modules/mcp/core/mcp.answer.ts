/** The longest answer handed back to Claude, in characters. */
export const MAX_ANSWER_CHARS = 60_000;

/** An answer as Claude reads it, and whether rows had to be left out to fit. */
export interface McpAnswer {
  text: string;
  truncated: boolean;
}

const json = (value: unknown) => JSON.stringify(value ?? null, null, 2);

/** The rows of an answer that fit in `budget` characters, first ones first. */
function rowsThatFit(rows: readonly unknown[], budget: number): unknown[] {
  const kept: unknown[] = [];
  let used = 0;
  for (const row of rows) {
    used += json(row).length + 2;
    if (used > budget) break;
    kept.push(row);
  }
  return kept;
}

/** A note Claude reads with a shortened list, so it can ask for the rest. */
const shortened = (shown: number, of: number) =>
  `Showing ${shown} of ${of} rows to fit the answer: ask for a smaller page or a narrower filter for the rest.`;

/**
 * The answer as JSON Claude can always parse. A list, or a page's `rows`, that would not fit is
 * cut by whole rows with a note saying how many were left out; anything else that would not fit
 * is cut by characters, and says so.
 */
export function answerOf(value: unknown): McpAnswer {
  const full = json(value);
  if (full.length <= MAX_ANSWER_CHARS) {
    return { text: full, truncated: false };
  }
  const budget = MAX_ANSWER_CHARS - 500;
  if (Array.isArray(value)) {
    const rows = rowsThatFit(value, budget);
    const note = shortened(rows.length, value.length);
    return { text: json({ note, rows }), truncated: true };
  }
  const page = value as { rows?: unknown };
  if (page && Array.isArray(page.rows)) {
    const rows = rowsThatFit(page.rows, budget);
    const note = shortened(rows.length, page.rows.length);
    return { text: json({ ...page, rows, note }), truncated: true };
  }
  return {
    text: `${full.slice(0, MAX_ANSWER_CHARS)}\n… (cut: ask for fewer rows or a narrower filter)`,
    truncated: true,
  };
}
