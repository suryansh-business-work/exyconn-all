import type { ReportDay, ReportExport } from './types';
import { activityPercent } from './format';

/** The columns, in the order the on-screen table shows them — one report, not two. */
const HEADERS = [
  'Date',
  'Worked (hours)',
  'Idle (hours)',
  'Activity (%)',
  'Keystrokes',
  'Mouse clicks',
  'Sessions',
] as const;

/** Milliseconds as decimal hours, to two places — a spreadsheet can add these up. */
function hours(ms: number): string {
  return (ms / 3_600_000).toFixed(2);
}

/**
 * One CSV field, quoted only when it has to be.
 *
 * Every value here is a date or a number, so nothing needs escaping today — but a column
 * added later that carries a project name or a note would otherwise split its own row in
 * half at the first comma, silently, in a file somebody had already sent on.
 */
function cell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function row(values: readonly (string | number)[]): string {
  return values.map(cell).join(',');
}

/**
 * The month's tracked time as a file the employee can keep.
 *
 * They can already SEE these figures in the app and in the portal, and could take them
 * nowhere else — a number somebody is measured on that they cannot export is a number they
 * cannot check against their own records, or attach to a question about it.
 *
 * Hours rather than milliseconds: the file is opened in a spreadsheet by a person, not
 * re-imported by a machine, and 27000000 is not a working day anybody recognises.
 */
export function buildReportCsv(days: readonly ReportDay[], monthKey: string): ReportExport {
  const ordered = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const lines = [
    row(HEADERS),
    ...ordered.map((day) =>
      row([
        day.date,
        hours(day.activeMs),
        hours(day.idleMs),
        activityPercent(day.activeMs, day.idleMs),
        day.keyCount,
        day.mouseCount,
        day.sessions,
      ]),
    ),
  ];

  const totalActive = ordered.reduce((sum, day) => sum + day.activeMs, 0);
  const totalIdle = ordered.reduce((sum, day) => sum + day.idleMs, 0);
  // A totals row, because the first thing anybody does with a month of days is add it up —
  // and a total the app computed cannot disagree with the one on screen.
  lines.push(
    row([
      'Total',
      hours(totalActive),
      hours(totalIdle),
      activityPercent(totalActive, totalIdle),
      ordered.reduce((sum, day) => sum + day.keyCount, 0),
      ordered.reduce((sum, day) => sum + day.mouseCount, 0),
      ordered.reduce((sum, day) => sum + day.sessions, 0),
    ]),
  );

  return {
    fileName: `tracker-report-${monthKey}.csv`,
    // A trailing newline: a file whose last line has no terminator is one some tools read as
    // truncated.
    content: `${lines.join('\n')}\n`,
  };
}
