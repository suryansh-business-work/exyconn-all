import type { ColDef } from 'ag-grid-community';
import { TableFieldKind, type TableInfoQuery } from '@/graphql/generated';
import { DateRangeColumnFilter } from './DateRangeColumnFilter';
import { EnumColumnFilter } from './EnumColumnFilter';
import { NUMBER_FILTER_PARAMS, TEXT_FILTER_PARAMS } from './serverGridQuery';

/** What the server says a grid may ask of its list (the `tableInfo` query). */
export type TableInfo = TableInfoQuery['tableInfo'];
type FilterColumn = TableInfo['filters'][number];
type ColumnFilter = Pick<ColDef, 'filter' | 'filterParams' | 'floatingFilter'>;

const NO_FILTER: ColumnFilter = { filter: false, floatingFilter: false };
const BOOLEAN_OPTIONS = ['true', 'false'];

/** The ag-grid filter for a column of this kind: typed inputs, a value list, or a day range. */
export function filterFor(column: FilterColumn): ColumnFilter {
  switch (column.kind) {
    case TableFieldKind.Number:
      return { filter: 'agNumberColumnFilter', filterParams: NUMBER_FILTER_PARAMS };
    case TableFieldKind.Date:
      return { filter: DateRangeColumnFilter };
    case TableFieldKind.Enum:
      return { filter: EnumColumnFilter, filterParams: { options: column.options } };
    case TableFieldKind.Boolean:
      return { filter: EnumColumnFilter, filterParams: { options: BOOLEAN_OPTIONS } };
    default:
      return { filter: 'agTextColumnFilter', filterParams: TEXT_FILTER_PARAMS };
  }
}

/**
 * The grid's columns as the server allows them: a column filters only when its field is one
 * the list filters on (with the filter its type takes) and sorts only when the list sorts by
 * it. Any other column would offer a filter or sort the server silently drops. Columns with no
 * field (derived values, the actions) are left as their factory made them.
 */
export function applyTableInfo<T>(columnDefs: readonly ColDef<T>[], info: TableInfo): ColDef<T>[] {
  const filters = new Map(info.filters.map((column) => [column.field, column]));
  const sortable = new Set(info.sortFields);
  return columnDefs.map((column) => {
    if (!column.field) {
      return column;
    }
    const filter = filters.get(column.field);
    return {
      ...column,
      sortable: sortable.has(column.field),
      ...(filter ? filterFor(filter) : NO_FILTER),
    };
  });
}
