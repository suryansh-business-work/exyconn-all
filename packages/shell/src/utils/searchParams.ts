/**
 * Returns a copy of `current` with `key` set to `value` — or removed when the
 * value is `null`. Every other param is preserved, so the tracker's `employee`,
 * `month` and `date` params can be written independently of one another.
 */
export function withParam(
  current: URLSearchParams,
  key: string,
  value: string | null,
): URLSearchParams {
  const next = new URLSearchParams(current);
  if (value === null) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  return next;
}
