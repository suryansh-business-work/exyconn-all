import type { Interpolations } from '@exyconn/i18n';

/** Formats an ISO date in the signed-in user's timezone and format (CLAUDE.md rule 11). */
export type GridFormatDate = (value: string) => string;

/** The viewer's translator, as a column model's value formatters reach it. */
export type GridTranslate = (source: string, values?: Interpolations) => string;

/** What every grid, phone card list and export puts on ag-grid's context before a page's own. */
export interface GridSharedContext {
  formatDate: GridFormatDate;
  /**
   * Column models are module scope, so a formatter that writes a word — "Lead", "3 of 6 done"
   * — cannot call `useT`. It reads the translator here instead: `params.context.t('Lead')`.
   */
  t: GridTranslate;
}

/**
 * Every `dateColumn` reads `formatDate` off ag-grid's context, and every translated cell reads
 * `t`, so the grid supplies both centrally instead of each page remembering to put them there
 * — a page that forgot rendered a date cell by calling `undefined`. A page that passes its own
 * `formatDate` still wins.
 */
export function gridContextWith(
  context: object | undefined,
  formatDate: GridFormatDate,
  t: GridTranslate,
): object {
  return { formatDate, t, ...context };
}

/** The translator a column model's formatter or getter was handed. */
export function gridTranslator(context: unknown): GridTranslate {
  return (context as GridSharedContext).t;
}
