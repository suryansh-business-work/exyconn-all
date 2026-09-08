/** One field of an update, as the drawer's from/to table shows it. */
export interface AuditChangeRow {
  field: string;
  from: string;
  to: string;
}

/** A value as the table prints it: blanks as a dash, everything else as it was stored. */
function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

/**
 * The `changes` column is a JSON string of `{ field: { from, to } }` written by the server.
 * A row from before the format existed, or a hand-edited one, yields no rows rather than a
 * crash in the drawer.
 */
export function parseAuditChanges(changes: string): AuditChangeRow[] {
  if (!changes) {
    return [];
  }
  try {
    const parsed = JSON.parse(changes) as Record<string, { from?: unknown; to?: unknown }>;
    return Object.entries(parsed).map(([field, change]) => ({
      field,
      from: displayValue(change?.from),
      to: displayValue(change?.to),
    }));
  } catch {
    return [];
  }
}
