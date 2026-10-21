/**
 * The date and time patterns a workspace or a person may choose — the same list as
 * `@exyconn/i18n`'s `DATE_FORMATS` / `TIME_FORMATS` (the server cannot import that ESM
 * package), so a pattern the portal does not offer can never be saved.
 */
const DATE_FORMATS: ReadonlySet<string> = new Set([
  'yyyy-MM-dd',
  'dd MMM yyyy',
  'd MMMM yyyy',
  'dd/MM/yyyy',
  'MM/dd/yyyy',
  'dd.MM.yyyy',
]);

const TIME_FORMATS: ReadonlySet<string> = new Set(['HH:mm', 'HH:mm:ss', 'hh:mm a']);

export const isDateFormat = (value: string) => DATE_FORMATS.has(value);
export const isTimeFormat = (value: string) => TIME_FORMATS.has(value);
