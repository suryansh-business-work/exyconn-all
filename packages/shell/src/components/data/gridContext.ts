/** Formats an ISO date in the signed-in user's timezone and format (CLAUDE.md rule 11). */
export type GridFormatDate = (value: string) => string;

/**
 * Every `dateColumn` reads `formatDate` off ag-grid's context, so the grid supplies it
 * centrally instead of each page remembering to put it there — a page that forgot rendered
 * a date cell by calling `undefined`. A page that passes its own `formatDate` still wins.
 */
export function gridContextWith(context: object | undefined, formatDate: GridFormatDate): object {
  return { formatDate, ...context };
}
