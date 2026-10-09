/**
 * Text form of a value of unknown shape: scalars as written, anything structured as JSON,
 * so it never degrades to "[object Object]".
 */
export function toText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value === null || value === undefined) {
    return String(value);
  }
  return JSON.stringify(value) ?? '';
}
