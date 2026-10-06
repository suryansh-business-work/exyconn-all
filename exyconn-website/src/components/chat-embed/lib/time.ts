const timeOnly = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });
const dateAndTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const dayOnly = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

const DAY_MS = 86_400_000;

/** A message's time in the visitor's own locale and timezone. */
export function formatTime(iso: string): string {
  return timeOnly.format(new Date(iso));
}

/** Full date and time, for the downloaded transcript. */
export function formatFullTime(iso: string): string {
  return dateAndTime.format(new Date(iso));
}

/** The visitor's local calendar day of a timestamp, as a stable key. */
export function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

/** "Today", "Yesterday" or the date, for the separator above a day's messages. */
export function dayLabel(iso: string, labels: Readonly<{ today: string; yesterday: string }>) {
  const key = dayKey(iso);
  if (key === new Date().toDateString()) {
    return labels.today;
  }
  if (key === new Date(Date.now() - DAY_MS).toDateString()) {
    return labels.yesterday;
  }
  return dayOnly.format(new Date(iso));
}

/** Seconds as m:ss, for the voice-note timer and the session countdown. */
export function formatDuration(seconds: number): string {
  const rest = String(seconds % 60).padStart(2, "0");
  return `${Math.floor(seconds / 60)}:${rest}`;
}
