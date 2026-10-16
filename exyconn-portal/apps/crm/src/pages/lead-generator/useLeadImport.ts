import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useImportLeadsToCrmMutation,
  type LeadImportInput,
} from '@exyconn/shell/graphql/generated';
import { emailsOf } from './useLeadEmails';
import type { EmailLookup, LeadImportResult, LeadPlace } from './leadTypes';

/** The server files at most this many per call. */
const CHUNK = 100;

const toInput = (place: LeadPlace, lookup: EmailLookup | undefined): LeadImportInput => ({
  placeId: place.placeId,
  name: place.name,
  phone: place.phone,
  website: place.website,
  address: place.address,
  city: place.city,
  country: place.country,
  lat: place.lat,
  lng: place.lng,
  mapUrl: place.mapUrl,
  emails: emailsOf(lookup),
  primaryType: place.primaryType,
});

/** "Add to CRM": files the chosen places as companies and keeps what happened for the summary. */
export function useLeadImport(onFiled: (filed: LeadImportResult['filed']) => void) {
  const t = useT();
  const [importLeads, { loading }] = useImportLeadsToCrmMutation();
  const [summary, setSummary] = useState<LeadImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (places: LeadPlace[], lookups: Record<string, EmailLookup>) => {
    setError(null);
    setSummary(null);
    const total: LeadImportResult = { created: 0, skipped: 0, filed: [], skips: [] };
    try {
      for (let start = 0; start < places.length; start += CHUNK) {
        const leads = places
          .slice(start, start + CHUNK)
          .map((place) => toInput(place, lookups[place.placeId]));
        const { data } = await importLeads({ variables: { leads } });
        const result = data?.importLeadsToCrm;
        if (result) {
          total.created += result.created;
          total.skipped += result.skipped;
          total.filed.push(...result.filed);
          total.skips.push(...result.skips);
        }
      }
    } catch (failure) {
      portalLogger.warn('crm: adding leads to the CRM failed', failure);
      setError(errorMessage(failure, t('Could not add the leads to the CRM')));
    }
    onFiled(total.filed);
    if (total.created + total.skipped > 0) {
      setSummary(total);
    }
  };

  return { run, loading, summary, error, dismiss: () => setSummary(null) };
}
