import { describe, expect, it } from 'vitest';
import { FilterOp, SortDir } from '@/graphql/generated';
import {
  NUMBER_FILTER_PARAMS,
  SEARCH_DEBOUNCE_MS,
  TEXT_FILTER_PARAMS,
  toFilters,
  toSorts,
} from '@/components/data/serverGridQuery';

describe('toFilters (text and number)', () => {
  it('maps each ag-grid filter type to the server operator, Contains when none is set', () => {
    expect(
      toFilters(
        {
          name: { type: 'equals', filter: 'Acme' },
          code: { type: 'startsWith', filter: 'INV' },
          city: { type: 'notContains', filter: 'Pune' },
          tag: { type: 'endsWith', filter: 'x' },
          owner: { type: 'notEqual', filter: 'Ravi' },
          stage: { filter: 'won' },
          odd: { type: 'somethingNew', filter: 'y' },
          amount: { filterType: 'number', type: 'greaterThan', filter: 5 },
          tax: { filterType: 'number', type: 'lessThanOrEqual', filter: 9 },
        },
        'UTC',
      ),
    ).toEqual([
      { field: 'name', op: FilterOp.Equals, value: 'Acme' },
      { field: 'code', op: FilterOp.StartsWith, value: 'INV' },
      { field: 'city', op: FilterOp.NotContains, value: 'Pune' },
      { field: 'tag', op: FilterOp.EndsWith, value: 'x' },
      { field: 'owner', op: FilterOp.NotEquals, value: 'Ravi' },
      { field: 'stage', op: FilterOp.Contains, value: 'won' },
      { field: 'odd', op: FilterOp.Contains, value: 'y' },
      { field: 'amount', op: FilterOp.Gt, value: '5' },
      { field: 'tax', op: FilterOp.Lte, value: '9' },
    ]);
  });

  it('turns non-string values into text and keeps a zero', () => {
    expect(toFilters({ amount: { type: 'equals', filter: 0 } }, 'UTC')).toEqual([
      { field: 'amount', op: FilterOp.Equals, value: '0' },
    ]);
  });

  it('drops filters with nothing typed in them', () => {
    expect(
      toFilters(
        {
          a: { type: 'contains', filter: '' },
          b: { type: 'contains', filter: null },
          c: { type: 'contains' },
        },
        'UTC',
      ),
    ).toEqual([]);
  });

  it('sends blank and not-blank without a value', () => {
    expect(
      toFilters(
        { email: { type: 'blank' }, phone: { type: 'notBlank', filter: 'ignored' } },
        'UTC',
      ),
    ).toEqual([
      { field: 'email', op: FilterOp.Blank, value: '' },
      { field: 'phone', op: FilterOp.NotBlank, value: '' },
    ]);
  });

  it('splits an in-range number filter into an inclusive lower and upper bound', () => {
    expect(
      toFilters(
        { amount: { filterType: 'number', type: 'inRange', filter: 10, filterTo: 20 } },
        'UTC',
      ),
    ).toEqual([
      { field: 'amount', op: FilterOp.Gte, value: '10' },
      { field: 'amount', op: FilterOp.Lte, value: '20' },
    ]);
  });
});

describe('toFilters (enum)', () => {
  it('sends the ticked values as one In filter', () => {
    expect(toFilters({ status: { filterType: 'enum', values: ['OPEN', 'WON'] } }, 'UTC')).toEqual([
      { field: 'status', op: FilterOp.In, value: '', values: ['OPEN', 'WON'] },
    ]);
  });

  it('sends nothing when no value is ticked', () => {
    expect(toFilters({ status: { filterType: 'enum', values: [] } }, 'UTC')).toEqual([]);
  });
});

describe('toFilters (date range)', () => {
  it('reads both days in the configured timezone, the whole of each day', () => {
    expect(
      toFilters(
        { createdAt: { filterType: 'dateRange', from: '2026-03-01', to: '2026-03-03' } },
        'Asia/Kolkata',
      ),
    ).toEqual([
      { field: 'createdAt', op: FilterOp.Gte, value: '2026-02-28T18:30:00.000Z' },
      { field: 'createdAt', op: FilterOp.Lte, value: '2026-03-03T18:29:59.999Z' },
    ]);
  });

  it('leaves an open end out', () => {
    expect(
      toFilters({ due: { filterType: 'dateRange', from: '2026-03-01', to: null } }, 'UTC'),
    ).toEqual([{ field: 'due', op: FilterOp.Gte, value: '2026-03-01T00:00:00.000Z' }]);
    expect(
      toFilters({ due: { filterType: 'dateRange', from: null, to: '2026-03-01' } }, 'UTC'),
    ).toEqual([{ field: 'due', op: FilterOp.Lte, value: '2026-03-01T23:59:59.999Z' }]);
    expect(toFilters({ due: { filterType: 'dateRange', from: null, to: null } }, 'UTC')).toEqual(
      [],
    );
  });
});

describe('toSorts', () => {
  it('sends no sort when the grid has none', () => {
    expect(toSorts([])).toEqual([]);
  });

  it('keeps every sort level, in order and direction', () => {
    expect(
      toSorts([
        { colId: 'createdAt', sort: 'desc' },
        { colId: 'name', sort: 'asc' },
      ]),
    ).toEqual([
      { field: 'createdAt', dir: SortDir.Desc },
      { field: 'name', dir: SortDir.Asc },
    ]);
  });
});

describe('filter params', () => {
  it('debounce column filters as long as the search box does, one condition each', () => {
    for (const params of [TEXT_FILTER_PARAMS, NUMBER_FILTER_PARAMS]) {
      expect(params.debounceMs).toBe(SEARCH_DEBOUNCE_MS);
      expect(params.maxNumConditions).toBe(1);
      expect(params.buttons).toEqual(['reset']);
    }
  });

  it('offer only the operators the server understands', () => {
    expect(TEXT_FILTER_PARAMS.filterOptions).toEqual([
      'contains',
      'notContains',
      'equals',
      'notEqual',
      'startsWith',
      'endsWith',
      'blank',
      'notBlank',
    ]);
    expect(NUMBER_FILTER_PARAMS.filterOptions).toEqual([
      'equals',
      'notEqual',
      'greaterThan',
      'greaterThanOrEqual',
      'lessThan',
      'lessThanOrEqual',
      'inRange',
      'blank',
      'notBlank',
    ]);
  });
});
