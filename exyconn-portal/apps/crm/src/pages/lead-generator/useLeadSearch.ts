import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { useT } from '@exyconn/i18n';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  SearchLeadPlacesDocument,
  type LeadSearchInput,
  type SearchLeadPlacesQuery,
  type SearchLeadPlacesQueryVariables,
} from '@exyconn/shell/graphql/generated';
import type { LeadPlace, LeadImportResult } from './leadTypes';

/** Adds the next page's places, skipping any already listed. */
function appendNew(current: LeadPlace[], next: LeadPlace[]): LeadPlace[] {
  const seen = new Set(current.map((place) => place.placeId));
  return [...current, ...next.filter((place) => !seen.has(place.placeId))];
}

/** Google Places results for the lead generator, a page (20) at a time. */
export function useLeadSearch() {
  const t = useT();
  const client = useApolloClient();
  const [places, setPlaces] = useState<LeadPlace[]>([]);
  const [input, setInput] = useState<LeadSearchInput | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (variables: LeadSearchInput, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await client.query<SearchLeadPlacesQuery, SearchLeadPlacesQueryVariables>({
          query: SearchLeadPlacesDocument,
          variables: { input: variables },
          fetchPolicy: 'network-only',
        });
        const page = data?.searchLeadPlaces;
        setPlaces((current) =>
          append ? appendNew(current, page?.places ?? []) : (page?.places ?? []),
        );
        setNextPageToken(page?.nextPageToken ?? null);
      } catch (failure) {
        portalLogger.warn('crm: lead search failed', failure);
        setError(errorMessage(failure, t('Could not search Google Places')));
      } finally {
        setLoading(false);
      }
    },
    [client, t],
  );

  const search = (next: LeadSearchInput) => {
    setInput(next);
    setPlaces([]);
    run(next, false).catch((failure: unknown) => portalLogger.warn('crm: lead search', failure));
  };

  const loadMore = () => {
    if (!input || !nextPageToken) {
      return;
    }
    run({ ...input, pageToken: nextPageToken }, true).catch((failure: unknown) =>
      portalLogger.warn('crm: lead search next page', failure),
    );
  };

  /** Marks the places just filed, so their rows link to the new companies. */
  const markFiled = (filed: LeadImportResult['filed']) => {
    const byPlace = new Map(filed.map((row) => [row.placeId, row.companyId]));
    setPlaces((current) =>
      current.map((place) => ({
        ...place,
        existingCompanyId: byPlace.get(place.placeId) ?? place.existingCompanyId,
      })),
    );
  };

  return {
    places,
    loading,
    error,
    searched: input !== null,
    hasMore: nextPageToken !== null,
    search,
    loadMore,
    markFiled,
  };
}
