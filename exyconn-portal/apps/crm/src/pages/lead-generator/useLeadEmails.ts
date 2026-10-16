import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { LeadEmailStatus, useFindLeadEmailsMutation } from '@exyconn/shell/graphql/generated';
import type { EmailLookup, LeadPlace } from './leadTypes';

/** How many websites are read side by side. */
const CONCURRENCY = 3;

/** The "find emails" step: each chosen business's website is read for published addresses. */
export function useLeadEmails() {
  const t = useT();
  const [findEmails] = useFindLeadEmailsMutation();
  const [lookups, setLookups] = useState<Record<string, EmailLookup>>({});
  const set = (placeId: string, lookup: EmailLookup) =>
    setLookups((current) => ({ ...current, [placeId]: lookup }));

  const lookUp = async (place: LeadPlace) => {
    try {
      const { data } = await findEmails({ variables: { website: place.website } });
      if (data) {
        set(place.placeId, data.findLeadEmails);
      }
    } catch (failure) {
      portalLogger.warn('crm: finding a lead website emails failed', failure);
      set(place.placeId, {
        status: LeadEmailStatus.Unreachable,
        emails: [],
        message: errorMessage(failure, t('Could not read the website')),
      });
    }
  };

  /** Looks up every place with a website that has not been looked up yet. */
  const run = async (places: LeadPlace[]) => {
    const queue = places.filter((place) => place.website && !lookups[place.placeId]);
    setLookups((current) => ({
      ...current,
      ...Object.fromEntries(queue.map((place) => [place.placeId, { status: 'PENDING' as const }])),
    }));
    const worker = async () => {
      for (let place = queue.shift(); place; place = queue.shift()) {
        await lookUp(place);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  };

  const running = Object.values(lookups).some((lookup) => lookup.status === 'PENDING');
  return { lookups, running, run };
}

/** The addresses a lookup found, or none. */
export function emailsOf(lookup: EmailLookup | undefined): string[] {
  return lookup && lookup.status !== 'PENDING' ? lookup.emails : [];
}
