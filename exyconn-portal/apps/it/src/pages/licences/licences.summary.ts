import type { LicenceFieldsFragment } from '@exyconn/shell/graphql/generated';

/** Milliseconds in a day, for the renewal window. */
const MS_PER_DAY = 86_400_000;

/** Seats handed out across every licence — the number the seat total is judged against. */
export function seatsInUse(licences: readonly LicenceFieldsFragment[]): number {
  return licences.reduce((total, licence) => total + licence.assigneeIds.length, 0);
}

/**
 * Licences renewing within `days`, soonest first. A cancelled licence is left out: it is
 * not going to charge anyone, and it would only pad the number people act on.
 */
export function renewalsDueWithin(
  licences: readonly LicenceFieldsFragment[],
  days: number,
): LicenceFieldsFragment[] {
  const cutoff = Date.now() + days * MS_PER_DAY;
  const due = licences.filter(
    (licence) => licence.status === 'ACTIVE' && Date.parse(licence.renewalDate) <= cutoff,
  );
  // A copy, so the caller's list keeps the order the server sent.
  return [...due].sort((a, b) => Date.parse(a.renewalDate) - Date.parse(b.renewalDate));
}
