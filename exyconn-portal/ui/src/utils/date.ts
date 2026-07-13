import { format as formatFn, isValid, parseISO } from 'date-fns';

/** Parses an ISO string or Date into a valid Date, or null. */
export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

/** Formats a value with the given date-fns pattern; empty string when invalid. */
export function formatWith(value: string | Date | null | undefined, pattern: string): string {
  const date = toDate(value);
  return date ? formatFn(date, pattern) : '';
}
