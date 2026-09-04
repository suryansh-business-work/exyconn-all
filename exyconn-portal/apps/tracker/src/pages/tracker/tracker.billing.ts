/** The date range the billing report opens on: the current calendar month. */
export function monthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * A picker's value as a usable Date, or null.
 *
 * MUIX hands back whatever is in the field, including a half-typed date that parses to
 * Invalid Date. Sending that as a range bound asks the portal to aggregate over NaN.
 */
export function toDateOrNull(value: Date | null): Date | null {
  if (value === null || Number.isNaN(value.getTime())) {
    return null;
  }
  return value;
}
