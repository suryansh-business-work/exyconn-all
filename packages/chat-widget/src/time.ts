const timeOnly = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });
const dateAndTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const sameDay = (a: Date, b: Date): boolean => a.toDateString() === b.toDateString();

/** A message's time in the visitor's own locale: just the time today, the date otherwise. */
export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  return sameDay(date, new Date()) ? timeOnly.format(date) : dateAndTime.format(date);
}

/** Full date and time, for the downloaded transcript. */
export function formatFullTime(iso: string): string {
  return dateAndTime.format(new Date(iso));
}

/** Seconds as m:ss, for the voice-note timer. */
export function formatDuration(seconds: number): string {
  const rest = String(seconds % 60).padStart(2, '0');
  return `${Math.floor(seconds / 60)}:${rest}`;
}
