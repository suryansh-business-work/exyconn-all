import { describe, expect, it } from 'vitest';
import { FilterOp, SortDir } from '@/graphql/generated';
import {
  SEARCH_DEBOUNCE_MS,
  TEXT_FILTER_PARAMS,
  toFilters,
  toSort,
} from '@/components/data/serverGridQuery';

describe('toFilters', () => {
  it('maps each ag-grid text filter type to the server operator', () => {
    expect(
      toFilters({
        name: { type: 'equals', filter: 'Acme' },
        code: { type: 'startsWith', filter: 'INV' },
        city: { type: 'contains', filter: 'Pune' },
        stage: { filter: 'won' },
      }),
    ).toEqual([
      { field: 'name', op: FilterOp.Equals, value: 'Acme' },
      { field: 'code', op: FilterOp.StartsWith, value: 'INV' },
      { field: 'city', op: FilterOp.Contains, value: 'Pune' },
      { field: 'stage', op: FilterOp.Contains, value: 'won' },
    ]);
  });

  it('turns non-string values into text and keeps a zero', () => {
    expect(toFilters({ amount: { type: 'equals', filter: 0 } })).toEqual([
      { field: 'amount', op: FilterOp.Equals, value: '0' },
    ]);
  });

  it('drops filters with nothing typed in them', () => {
    expect(
      toFilters({
        a: { type: 'contains', filter: '' },
        b: { type: 'contains', filter: null },
        c: { type: 'contains' },
      }),
    ).toEqual([]);
  });
});

describe('toSort', () => {
  it('sends no sort when the grid has none', () => {
    expect(toSort([])).toBeNull();
  });

  it('takes only the first column of a multi-sort, in its direction', () => {
    expect(
      toSort([
        { colId: 'createdAt', sort: 'desc' },
        { colId: 'name', sort: 'asc' },
      ]),
    ).toEqual({ field: 'createdAt', dir: SortDir.Desc });
    expect(toSort([{ colId: 'name', sort: 'asc' }])).toEqual({ field: 'name', dir: SortDir.Asc });
  });
});

describe('text filter params', () => {
  it('debounce column filters as long as the search box does', () => {
    expect(TEXT_FILTER_PARAMS.debounceMs).toBe(SEARCH_DEBOUNCE_MS);
    expect(TEXT_FILTER_PARAMS.filterOptions).toEqual(['contains', 'equals', 'startsWith']);
  });
});
