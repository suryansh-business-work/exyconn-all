import { describe, expect, it } from 'vitest';
import { gql } from '@apollo/client';
import { listFieldOf, usePagedFetcher } from '../../../src/grid/usePagedFetcher';
import { renderHookWithProviders } from '../test-utils';

const LIST_LEADS = gql`
  query ListLeadsPaged($input: TableQueryInput!) {
    listLeadsPaged(input: $input) {
      totalCount
    }
  }
`;

describe('listFieldOf', () => {
  it('names the query field a list document reads', () => {
    expect(listFieldOf(LIST_LEADS)).toBe('listLeadsPaged');
  });

  it('names nothing for a document whose first selection is not a field', () => {
    const spread = gql`
      query Spread {
        ...LeadPage
      }
      fragment LeadPage on Query {
        listLeadsPaged {
          totalCount
        }
      }
    `;
    expect(listFieldOf(spread)).toBeUndefined();
  });

  it('names nothing for a document with no single operation', () => {
    const fragmentOnly = gql`
      fragment LeadName on Lead {
        name
      }
    `;
    expect(listFieldOf(fragmentOnly)).toBeUndefined();
  });
});

describe('usePagedFetcher list', () => {
  it('carries the list name on the fetcher it returns', () => {
    const { result } = renderHookWithProviders(() =>
      usePagedFetcher(LIST_LEADS, (data: { listLeadsPaged: never }) => data.listLeadsPaged),
    );
    expect(result.current.list).toBe('listLeadsPaged');
  });
});
