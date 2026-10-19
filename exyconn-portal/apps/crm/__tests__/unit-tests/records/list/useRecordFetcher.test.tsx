import { describe, expect, it, vi } from 'vitest';
import type { RefObject } from 'react';
import { CrmOp, SearchLeadsDocument, SortDir } from '@exyconn/shell/graphql/generated';
import { EMPTY_QUERY, type RecordQueryState } from '../../../../src/records/list/recordQuery';
import { sortsAfterHeader, useRecordFetcher } from '../../../../src/records/list/useRecordFetcher';
import { renderHookWithProviders } from '../../test-utils';

const client = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => client,
}));

const BY_NAME = [{ property: 'name', dir: SortDir.Asc }];

describe('sortsAfterHeader', () => {
  it('keeps the toolbar sorts without a header sort', () => {
    expect(sortsAfterHeader(null, BY_NAME)).toBe(BY_NAME);
    expect(sortsAfterHeader(undefined, BY_NAME)).toBe(BY_NAME);
  });

  it('keeps every level when the header agrees with the first one', () => {
    const levels = [...BY_NAME, { property: 'email', dir: SortDir.Desc }];
    expect(sortsAfterHeader({ field: 'name', dir: SortDir.Asc }, levels)).toBe(levels);
  });

  it('sorts by the clicked column alone otherwise', () => {
    expect(sortsAfterHeader({ field: 'name', dir: SortDir.Desc }, BY_NAME)).toEqual([
      { property: 'name', dir: SortDir.Desc },
    ]);
    expect(sortsAfterHeader({ field: 'email', dir: SortDir.Asc }, [])).toEqual([
      { property: 'email', dir: SortDir.Asc },
    ]);
  });
});

function setup(query: RecordQueryState) {
  const queryRef: RefObject<RecordQueryState> = { current: query };
  const onChange = vi.fn();
  const select = vi.fn(
    (data: { searchLeads: { rows: unknown[]; totalCount: number } }) => data.searchLeads,
  );
  const { result } = renderHookWithProviders(() =>
    useRecordFetcher(SearchLeadsDocument, select as never, queryRef, onChange),
  );
  return { fetchRows: result.current, onChange, select, queryRef };
}

describe('useRecordFetcher', () => {
  const QUERY: RecordQueryState = {
    ...EMPTY_QUERY,
    search: 'acme',
    sorts: BY_NAME,
    groups: [
      { id: 'g', conditions: [{ id: 'c', property: 'stage', op: CrmOp.In, values: ['HOT'] }] },
    ],
  };

  it('hands a bulk job the same query a page request sends, without touching the toolbar', () => {
    const { fetchRows, onChange } = setup(QUERY);

    expect(fetchRows.variablesFor?.({ page: 0, pageSize: 1, search: null })).toEqual({
      query: {
        page: 0,
        pageSize: 1,
        search: null,
        groups: [{ conditions: [{ property: 'stage', op: CrmOp.In, values: ['HOT'] }] }],
        sorts: BY_NAME,
        archived: undefined,
      },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sends the list query with the grid page and returns the selected page', async () => {
    client.query.mockResolvedValue({
      data: { searchLeads: { rows: [{ id: 'r' }], totalCount: 1, extra: 1 } },
    });
    const { fetchRows, onChange } = setup(QUERY);

    const page = await fetchRows({ page: 2, pageSize: 25, search: 'acme', archived: true });

    expect(page).toEqual({ rows: [{ id: 'r' }], totalCount: 1 });
    expect(onChange).not.toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith({
      query: SearchLeadsDocument,
      variables: {
        query: {
          page: 2,
          pageSize: 25,
          search: 'acme',
          groups: [{ conditions: [{ property: 'stage', op: CrmOp.In, values: ['HOT'] }] }],
          sorts: BY_NAME,
          archived: true,
        },
      },
      fetchPolicy: 'network-only',
    });
  });

  it('writes a new search box value back into the query and sends no blank search', async () => {
    client.query.mockResolvedValue({ data: { searchLeads: { rows: [], totalCount: 0 } } });
    const { fetchRows, onChange } = setup(QUERY);

    await fetchRows({ page: 0, pageSize: 25 });

    expect(onChange).toHaveBeenCalledWith({ ...QUERY, search: '', sorts: BY_NAME });
    expect(client.query.mock.calls[0][0].variables.query.search).toBeNull();
  });

  it('writes a header sort back into the query', async () => {
    client.query.mockResolvedValue({ data: { searchLeads: { rows: [], totalCount: 0 } } });
    const { fetchRows, onChange } = setup(QUERY);

    await fetchRows({
      page: 0,
      pageSize: 25,
      search: 'acme',
      sort: { field: 'email', dir: SortDir.Desc },
    });

    const sorts = [{ property: 'email', dir: SortDir.Desc }];
    expect(onChange).toHaveBeenCalledWith({ ...QUERY, search: 'acme', sorts });
    expect(client.query.mock.calls[0][0].variables.query.sorts).toEqual(sorts);
  });

  it('fails a page that came back without data', async () => {
    client.query.mockResolvedValue({});
    const { fetchRows } = setup(EMPTY_QUERY);
    await expect(fetchRows({ page: 0, pageSize: 25 })).rejects.toThrow(
      'The CRM records query returned no data',
    );
  });
});
