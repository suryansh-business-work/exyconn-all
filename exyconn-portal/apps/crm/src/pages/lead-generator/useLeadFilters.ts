import { useMemo, useState } from 'react';
import { emailsOf } from './useLeadEmails';
import type { EmailLookup, LeadPlace } from './leadTypes';

const lookedUp = (lookup: EmailLookup | undefined) =>
  lookup !== undefined && lookup.status !== 'PENDING';

/** "Has phone" / "Has email" over the places already loaded; the list and the map show `visible`. */
export function useLeadFilters(places: LeadPlace[], lookups: Record<string, EmailLookup>) {
  const [hasPhone, setHasPhone] = useState(false);
  const [hasEmail, setHasEmail] = useState(false);

  const withPhone = useMemo(
    () => (hasPhone ? places.filter((place) => place.phone !== '') : places),
    [hasPhone, places],
  );
  const visible = useMemo(
    () =>
      hasEmail
        ? withPhone.filter((place) => emailsOf(lookups[place.placeId]).length > 0)
        : withPhone,
    [hasEmail, withPhone, lookups],
  );
  /** Places with a website whose emails have not been looked up yet would be hidden unseen. */
  const needsLookup =
    hasEmail &&
    withPhone.some((place) => place.website !== '' && !lookedUp(lookups[place.placeId]));

  return {
    hasPhone,
    hasEmail,
    togglePhone: () => setHasPhone((on) => !on),
    toggleEmail: () => setHasEmail((on) => !on),
    visible,
    needsLookup,
  };
}
