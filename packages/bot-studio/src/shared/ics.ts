/** An iCalendar file for the "Add to calendar" button. */
export interface CalendarEventData {
  title: string;
  start: number;
  durationMin: number;
  location?: string;
}

const NON_DIGIT_OR_T = /[-:]|\.\d{3}/g;

function stamp(ms: number): string {
  return new Date(ms).toISOString().replaceAll(NON_DIGIT_OR_T, '');
}

function escapeText(text: string): string {
  return text
    .replaceAll('\\', '\\\\')
    .replaceAll(',', String.raw`\,`)
    .replaceAll(';', String.raw`\;`)
    .replaceAll('\n', String.raw`\n`);
}

export function toIcs(event: CalendarEventData, uid: string): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Exyconn//WhatsApp demo//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.start + event.durationMin * 60_000)}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.location ? `LOCATION:${escapeText(event.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/** Hands the viewer the .ics file to save — the browser's own download, nothing uploaded. */
export function downloadIcs(event: CalendarEventData, fileName: string): void {
  const url = URL.createObjectURL(
    new Blob([toIcs(event, `${event.start}@exyconn-demo`)], { type: 'text/calendar' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
