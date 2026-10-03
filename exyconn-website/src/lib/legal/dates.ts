/** A date both machine-readable and formatted for the reader. */
export interface ReaderDate {
  iso: string;
  text: string;
}

/**
 * "27 June 2025" / "June 27, 2025" / "27. Juni 2025" — the reader's market locale decides, so
 * every legal and policy date on the site is written the same way for the same reader. The
 * ISO value keeps the calendar day (UTC), whatever the server's time zone.
 */
export function readerDate(value: string, locale: string): ReaderDate {
  const date = new Date(value);
  return {
    iso: date.toISOString().slice(0, 10),
    text: new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(date),
  };
}
