import { describe, expect, it } from 'vitest';
import { TableFieldKind } from '@/graphql/generated';
import { applyTableInfo, filterFor, type TableInfo } from '@/components/data/tableColumns';
import { DateRangeColumnFilter } from '@/components/data/DateRangeColumnFilter';
import { EnumColumnFilter } from '@/components/data/EnumColumnFilter';
import { NUMBER_FILTER_PARAMS, TEXT_FILTER_PARAMS } from '@/components/data/serverGridQuery';

const column = (kind: TableFieldKind, options: string[] = []) => ({ field: 'f', kind, options });

describe('filterFor', () => {
  it('gives each kind of column the filter its values take', () => {
    expect(filterFor(column(TableFieldKind.Number))).toEqual({
      filter: 'agNumberColumnFilter',
      filterParams: NUMBER_FILTER_PARAMS,
    });
    expect(filterFor(column(TableFieldKind.Date))).toEqual({ filter: DateRangeColumnFilter });
    expect(filterFor(column(TableFieldKind.Enum, ['OPEN', 'WON']))).toEqual({
      filter: EnumColumnFilter,
      filterParams: { options: ['OPEN', 'WON'] },
    });
    expect(filterFor(column(TableFieldKind.Boolean))).toEqual({
      filter: EnumColumnFilter,
      filterParams: { options: ['true', 'false'] },
    });
  });

  it('falls back to a text filter for text and any other kind', () => {
    const text = { filter: 'agTextColumnFilter', filterParams: TEXT_FILTER_PARAMS };
    expect(filterFor(column(TableFieldKind.Text))).toEqual(text);
    expect(filterFor(column(TableFieldKind.List))).toEqual(text);
  });
});

describe('applyTableInfo', () => {
  const info: TableInfo = {
    filters: [{ field: 'amount', kind: TableFieldKind.Number, options: [] }],
    sortFields: ['amount'],
    importable: false,
    matchFields: [],
    importFields: [],
  };

  it('filters and sorts only the fields the list allows and leaves field-less columns alone', () => {
    const actions = { colId: 'actions', sortable: true };
    expect(
      applyTableInfo(
        [{ field: 'amount', headerName: 'Amount' }, { field: 'note', sortable: true }, actions],
        info,
      ),
    ).toEqual([
      {
        field: 'amount',
        headerName: 'Amount',
        sortable: true,
        filter: 'agNumberColumnFilter',
        filterParams: NUMBER_FILTER_PARAMS,
      },
      { field: 'note', sortable: false, filter: false, floatingFilter: false },
      actions,
    ]);
  });
});
