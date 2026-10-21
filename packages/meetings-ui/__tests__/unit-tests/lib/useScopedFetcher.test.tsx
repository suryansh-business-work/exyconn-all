import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import type { ReactNode } from 'react';
import {
  FilterOp,
  MaScope,
  MaTranscriptSearchDocument,
  MaTranscriptSource,
  type MaTranscriptSearchQuery,
} from '@exyconn/shell/graphql/generated';
import { useScopedFetcher } from '../../../src/lib/useScopedFetcher';

const PRESET = [{ field: 'source', op: FilterOp.Equals, value: 'AI' }];
const INPUT = {
  page: 0,
  pageSize: 25,
  filters: [{ field: 'text', op: FilterOp.Contains, value: 'price' }],
};
const HIT = {
  __typename: 'MaTranscriptHit' as const,
  id: 'h1',
  meetingId: 'm1',
  meetingTitle: 'Weekly sync',
  meetingStartedAt: '2026-10-20T09:00:00.000Z',
  startMs: 1000,
  text: 'price',
  speakerLabel: null,
  source: MaTranscriptSource.Ai,
};

const mocks: MockLink.MockedResponse[] = [
  {
    request: {
      query: MaTranscriptSearchDocument,
      variables: {
        scope: MaScope.All,
        input: { ...INPUT, filters: [...INPUT.filters, ...PRESET] },
      },
    },
    result: {
      data: {
        maTranscriptSearch: { __typename: 'MaTranscriptHitPage', totalCount: 1, rows: [HIT] },
      },
    },
  },
];

const wrapper = ({ children }: { children: ReactNode }) => (
  <MockedProvider mocks={mocks}>{children}</MockedProvider>
);

describe('useScopedFetcher', () => {
  it('sends the scope beside the page input, with the preset filters after the grid ones', async () => {
    const { result } = renderHook(
      () =>
        useScopedFetcher(
          MaTranscriptSearchDocument,
          (data: MaTranscriptSearchQuery) => data.maTranscriptSearch,
          { scope: MaScope.All },
          PRESET,
        ),
      { wrapper },
    );
    const fetchRows = result.current;
    expect(fetchRows.list).toBe('maTranscriptSearch');
    await expect(fetchRows(INPUT)).resolves.toEqual({ rows: [HIT], totalCount: 1 });
  });

  it('adds no filters of its own when none are preset', () => {
    const { result } = renderHook(
      () =>
        useScopedFetcher(
          MaTranscriptSearchDocument,
          (data: MaTranscriptSearchQuery) => data.maTranscriptSearch,
          { scope: MaScope.Mine },
        ),
      { wrapper },
    );
    expect(result.current.variablesFor?.({ page: 1, pageSize: 10 })).toEqual({
      scope: MaScope.Mine,
      input: { page: 1, pageSize: 10, filters: [] },
    });
  });
});
