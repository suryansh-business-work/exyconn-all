import { describe, expect, it } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { SearchLeadPlacesDocument, type LeadSearchInput } from '@exyconn/shell/graphql/generated';
import { useLeadSearch } from '../../../../src/pages/lead-generator/useLeadSearch';
import type { LeadPlace } from '../../../../src/pages/lead-generator/leadTypes';
import { renderHookWithProviders } from '../../test-utils';
import { leadPlace } from './lead-fixtures';

const DENTISTS: LeadSearchInput = { query: 'dentists', location: 'Pune' };

const a = leadPlace({ placeId: 'a', name: 'A' });
const b = leadPlace({ placeId: 'b', name: 'B' });
const c = leadPlace({ placeId: 'c', name: 'C' });

function answer(input: LeadSearchInput, places: LeadPlace[], nextPageToken: string | null) {
  return {
    request: { query: SearchLeadPlacesDocument, variables: { input } },
    result: {
      data: {
        searchLeadPlaces: { __typename: 'LeadSearchPage', nextPageToken, places },
      },
    },
  };
}

function failure(input: LeadSearchInput, error: Error) {
  return { request: { query: SearchLeadPlacesDocument, variables: { input } }, error };
}

describe('useLeadSearch', () => {
  it('starts empty, with nothing searched yet', () => {
    const { result } = renderHookWithProviders(() => useLeadSearch());

    expect(result.current.places).toEqual([]);
    expect(result.current.searched).toBe(false);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('lists the first page, then appends the next one without repeating places', async () => {
    const { result } = renderHookWithProviders(() => useLeadSearch(), {
      mocks: [
        answer(DENTISTS, [a, b], 'page-2'),
        answer({ ...DENTISTS, pageToken: 'page-2' }, [b, c], null),
      ],
    });

    act(() => result.current.search(DENTISTS));
    expect(result.current.loading).toBe(true);
    expect(result.current.searched).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.places.map((place) => place.placeId)).toEqual(['a', 'b']);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.places).toHaveLength(3));
    expect(result.current.places.map((place) => place.placeId)).toEqual(['a', 'b', 'c']);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('does not load more before a search or after the last page', async () => {
    const { result } = renderHookWithProviders(() => useLeadSearch(), {
      mocks: [answer(DENTISTS, [a], null)],
    });

    act(() => result.current.loadMore());
    expect(result.current.loading).toBe(false);

    act(() => result.current.search(DENTISTS));
    await waitFor(() => expect(result.current.places).toHaveLength(1));
    act(() => result.current.loadMore());
    expect(result.current.loading).toBe(false);
    expect(result.current.places).toHaveLength(1);
  });

  it('shows the error when the search fails, and clears it on the next search', async () => {
    const { result } = renderHookWithProviders(() => useLeadSearch(), {
      mocks: [
        failure(DENTISTS, new Error('Places API is not enabled')),
        answer(DENTISTS, [a], null),
      ],
    });

    act(() => result.current.search(DENTISTS));
    await waitFor(() => expect(result.current.error).toBe('Places API is not enabled'));
    expect(result.current.loading).toBe(false);
    expect(result.current.places).toEqual([]);

    act(() => result.current.search(DENTISTS));
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(result.current.places).toHaveLength(1));
  });

  it('keeps the listed places when the next page fails', async () => {
    const { result } = renderHookWithProviders(() => useLeadSearch(), {
      mocks: [
        answer(DENTISTS, [a], 'page-2'),
        failure({ ...DENTISTS, pageToken: 'page-2' }, new Error('Token expired')),
      ],
    });

    act(() => result.current.search(DENTISTS));
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.error).toBe('Token expired'));
    expect(result.current.places.map((place) => place.placeId)).toEqual(['a']);
  });

  it('links the places just filed to their new companies, leaving the others as they were', async () => {
    const known = leadPlace({ placeId: 'k', existingCompanyId: 'c-k' });
    const { result } = renderHookWithProviders(() => useLeadSearch(), {
      mocks: [answer(DENTISTS, [a, b, known], null)],
    });
    act(() => result.current.search(DENTISTS));
    await waitFor(() => expect(result.current.places).toHaveLength(3));

    act(() => result.current.markFiled([{ placeId: 'a', companyId: 'c-a' }]));

    expect(result.current.places.map((place) => place.existingCompanyId)).toEqual([
      'c-a',
      null,
      'c-k',
    ]);
  });
});
