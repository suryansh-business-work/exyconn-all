import { describe, expect, it } from 'vitest';
import { gql } from '@apollo/client';
import type { MockLink } from '@apollo/client/testing';
import {
  FilterOp,
  type TableFilterInput,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { usePagedFetcher } from '../../../src/grid/usePagedFetcher';
import { renderHookWithProviders } from '../test-utils';

const LIST_THINGS = gql`
  query ListThingsPaged($input: TableQueryInput!) {
    listThingsPaged(input: $input) {
      totalCount
      rows {
        id
        name
      }
    }
  }
`;

interface Thing {
  __typename: 'Thing';
  id: string;
  name: string;
}

interface ListThingsQuery {
  listThingsPaged: { __typename: 'ThingPage'; totalCount: number; rows: Thing[] };
}

const thing = (id: string): Thing => ({ __typename: 'Thing', id, name: `Thing ${id}` });

const input: TableQueryInput = { page: 0, pageSize: 20, search: 'acme' };

const okMock = (
  filters: TableFilterInput[],
  rows: Thing[],
  totalCount: number,
): MockLink.MockedResponse => ({
  request: { query: LIST_THINGS, variables: { input: { ...input, filters } } },
  result: {
    data: { listThingsPaged: { __typename: 'ThingPage', totalCount, rows } },
  },
});

type Picker = (data: ListThingsQuery) => ListThingsQuery['listThingsPaged'];

const select: Picker = (data) => data.listThingsPaged;

describe('usePagedFetcher', () => {
  it('queries one page and returns its rows and total', async () => {
    const mocks = [okMock([], [thing('1'), thing('2')], 7)];
    const { result } = renderHookWithProviders(() => usePagedFetcher(LIST_THINGS, select), {
      mocks,
    });
    const page = await result.current(input);
    expect(page.totalCount).toBe(7);
    expect(page.rows.map((row) => row.id)).toEqual(['1', '2']);
    expect(Object.keys(page)).toEqual(['rows', 'totalCount']);
  });

  it("appends the page's extra filters after the grid's own", async () => {
    const own: TableFilterInput = { field: 'name', op: FilterOp.Contains, value: 'a' };
    const extra: TableFilterInput = { field: 'status', op: FilterOp.Equals, value: 'OPEN' };
    const mocks = [okMock([own, extra], [thing('3')], 1)];
    const { result } = renderHookWithProviders(
      () => usePagedFetcher(LIST_THINGS, select, [extra]),
      { mocks },
    );
    const page = await result.current({ ...input, filters: [own] });
    expect(page.rows).toHaveLength(1);
  });

  it('keeps the callback stable while reading the latest select and filters', async () => {
    const second: TableFilterInput = { field: 'status', op: FilterOp.Equals, value: 'CLOSED' };
    const mocks = [okMock([second], [thing('9')], 1)];
    let filter: TableFilterInput = { field: 'status', op: FilterOp.Equals, value: 'OPEN' };
    let picker: Picker = select;
    const { result, rerender } = renderHookWithProviders(
      () => usePagedFetcher(LIST_THINGS, picker, [filter]),
      { mocks },
    );
    const before = result.current;
    filter = second;
    picker = (data) => ({ ...select(data), totalCount: 99 });
    rerender();
    expect(result.current).toBe(before);
    const page = await result.current(input);
    expect(page.totalCount).toBe(99);
  });

  it('rejects when the query fails', async () => {
    const mocks: MockLink.MockedResponse[] = [
      {
        request: { query: LIST_THINGS, variables: { input: { ...input, filters: [] } } },
        error: new Error('Network down'),
      },
    ];
    const { result } = renderHookWithProviders(() => usePagedFetcher(LIST_THINGS, select), {
      mocks,
    });
    await expect(result.current(input)).rejects.toThrow('Network down');
  });
});
