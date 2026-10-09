/**
 * The text a table cell, CSV cell or filter shows for a value of unknown type.
 * Primitives and dates read as they always have, arrays as their comma-joined items, and any
 * other object as JSON — never the unreadable `[object Object]`.
 */
export function cellText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Date) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(cellText).join(',');
  }
  return JSON.stringify(value) ?? '';
}
