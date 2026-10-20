/**
 * The date and time patterns (date-fns tokens) a workspace — or a person, over the
 * workspace — may render with. ISO 8601 first; the rest are the common regional writings.
 * One list, read by Admin › Settings, the profile override and the server's validation.
 */
export const DATE_FORMATS: readonly string[] = [
  'yyyy-MM-dd',
  'dd MMM yyyy',
  'd MMMM yyyy',
  'dd/MM/yyyy',
  'MM/dd/yyyy',
  'dd.MM.yyyy',
];

export const TIME_FORMATS: readonly string[] = ['HH:mm', 'HH:mm:ss', 'hh:mm a'];

const DATE_FORMAT_SET: ReadonlySet<string> = new Set(DATE_FORMATS);
const TIME_FORMAT_SET: ReadonlySet<string> = new Set(TIME_FORMATS);

export const isDateFormat = (value: string) => DATE_FORMAT_SET.has(value);
export const isTimeFormat = (value: string) => TIME_FORMAT_SET.has(value);
