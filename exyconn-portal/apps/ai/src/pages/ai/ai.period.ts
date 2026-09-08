import { endOfMonth, startOfMonth } from 'date-fns';

/** The window the AI overview reports spend over: the first of this month until now. */
export function monthToDate(now: Date = new Date()): { from: string; to: string } {
  return {
    from: startOfMonth(now).toISOString(),
    // The end of the month rather than "now", so a run finishing while the page is open
    // is still inside the window the summary was asked for.
    to: endOfMonth(now).toISOString(),
  };
}
