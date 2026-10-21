import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { queryData } from '@exyconn/shell/utils/queryData';
import {
  LeadImportStatus,
  useImportLeadsToCrmMutation,
  usePreviewLeadImportLazyQuery,
  type LeadMergeInput,
} from '@exyconn/shell/graphql/generated';
import {
  addResult,
  chunksOf,
  companiesOf,
  emptyResult,
  mergeListOf,
  toInput,
} from './leadImportInput';
import type { EmailLookup, LeadImportPreview, LeadImportResult, LeadPlace } from './leadTypes';
import { inSequence } from '@exyconn/shell/utils/inSequence';

/** A batch waiting for the person to decide what happens to its duplicates. */
export interface PendingReview {
  places: LeadPlace[];
  lookups: Record<string, EmailLookup>;
  previews: LeadImportPreview[];
}

/**
 * "Add to CRM": previews the chosen places first; when some are already companies the person
 * reviews them (skip, or add their extra details), otherwise they are filed straight away.
 */
export function useLeadImport(onFiled: (filed: LeadImportResult['filed']) => void) {
  const t = useT();
  const [previewLeads, { loading: previewing }] = usePreviewLeadImportLazyQuery({
    fetchPolicy: 'no-cache',
  });
  const [importLeads, { loading: importing }] = useImportLeadsToCrmMutation();
  const [summary, setSummary] = useState<LeadImportResult | null>(null);
  const [review, setReview] = useState<PendingReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const file = async (
    places: LeadPlace[],
    lookups: Record<string, EmailLookup>,
    merges: LeadMergeInput[],
  ) => {
    const total = emptyResult();
    try {
      // One chunk at a time, so whatever was filed before a failure is still counted.
      await inSequence(chunksOf(places), async (chunk) => {
        const ids = new Set(chunk.map((place) => place.placeId));
        const leads = chunk.map((place) => toInput(place, lookups[place.placeId]));
        const mergeInto = merges.filter((merge) => ids.has(merge.placeId));
        const result = await importLeads({ variables: { leads, mergeInto } });
        addResult(total, queryData(result, 'The lead import').importLeadsToCrm);
      });
    } catch (error_) {
      portalLogger.warn('crm: adding leads to the CRM failed', error_);
      setError(errorMessage(error_, t('Could not add the leads to the CRM')));
    }
    onFiled(companiesOf(total));
    if (total.created + total.merged + total.skipped > 0) {
      setSummary(total);
    }
  };

  const preview = async (places: LeadPlace[], lookups: Record<string, EmailLookup>) => {
    const chunks = await inSequence(chunksOf(places), async (chunk) => {
      const leads = chunk.map((place) => toInput(place, lookups[place.placeId]));
      const { data, error: failure } = await previewLeads({ variables: { leads } });
      if (failure ?? !data) {
        throw failure ?? new Error('No import preview came back');
      }
      return data.previewLeadImport;
    });
    return chunks.flat();
  };

  const run = async (places: LeadPlace[], lookups: Record<string, EmailLookup>) => {
    setError(null);
    setSummary(null);
    let previews: LeadImportPreview[];
    try {
      previews = await preview(places, lookups);
    } catch (error_) {
      portalLogger.warn('crm: checking leads against the CRM failed', error_);
      setError(errorMessage(error_, t('Could not check the leads against the CRM')));
      return;
    }
    if (previews.every((row) => row.status === LeadImportStatus.New)) {
      await file(places, lookups, []);
    } else {
      setReview({ places, lookups, previews });
    }
  };

  /** Files the new places and updates the chosen duplicates (none for "Add new only"). */
  const confirm = async (chosen: ReadonlySet<string>) => {
    if (!review) {
      return;
    }
    setReview(null);
    await file(review.places, review.lookups, mergeListOf(review.previews, chosen));
  };

  return {
    run,
    confirm,
    cancel: () => setReview(null),
    review,
    loading: previewing || importing,
    summary,
    error,
    dismiss: () => setSummary(null),
  };
}
