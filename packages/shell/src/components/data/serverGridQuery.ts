import type { SortModelItem } from 'ag-grid-community';
import { fromZonedTime } from 'date-fns-tz';
import {
  FilterOp,
  SortDir,
  type TableFilterInput,
  type TableQueryInput,
  type TableSortInput,
} from '@/graphql/generated';
import { cellText } from '../../utils/cellText';

export const SEARCH_DEBOUNCE_MS = 300;

/** What the grid is currently asking the server for, minus the page — search, sorts, filters. */
export type GridQuery = Omit<TableQueryInput, 'page' | 'pageSize'>;

const SHARED_PARAMS = { maxNumConditions: 1, debounceMs: SEARCH_DEBOUNCE_MS, buttons: ['reset'] };

export const TEXT_FILTER_PARAMS = {
  ...SHARED_PARAMS,
  filterOptions: [
    'contains',
    'notContains',
    'equals',
    'notEqual',
    'startsWith',
    'endsWith',
    'blank',
    'notBlank',
  ],
};

export const NUMBER_FILTER_PARAMS = {
  ...SHARED_PARAMS,
  filterOptions: [
    'equals',
    'notEqual',
    'greaterThan',
    'greaterThanOrEqual',
    'lessThan',
    'lessThanOrEqual',
    'inRange',
    'blank',
    'notBlank',
  ],
};

/** The model of the shared enum filter: the values any of which a row may hold. */
export interface EnumFilterModel {
  filterType: 'enum';
  values: string[];
}

/** The model of the shared date filter: whole days, `yyyy-MM-dd`, either end optional. */
export interface DateRangeFilterModel {
  filterType: 'dateRange';
  from: string | null;
  to: string | null;
}

/** ag-grid's own text and number filter model, with one condition. */
interface SimpleFilterModel {
  filterType?: string;
  type?: string;
  filter?: unknown;
  filterTo?: unknown;
}

type ColumnFilterModel = SimpleFilterModel | EnumFilterModel | DateRangeFilterModel;

/** ag-grid's option names for the server operators they map one to one. */
const SIMPLE_OPS: Readonly<Record<string, FilterOp>> = {
  contains: FilterOp.Contains,
  notContains: FilterOp.NotContains,
  equals: FilterOp.Equals,
  notEqual: FilterOp.NotEquals,
  startsWith: FilterOp.StartsWith,
  endsWith: FilterOp.EndsWith,
  greaterThan: FilterOp.Gt,
  greaterThanOrEqual: FilterOp.Gte,
  lessThan: FilterOp.Lt,
  lessThanOrEqual: FilterOp.Lte,
  blank: FilterOp.Blank,
  notBlank: FilterOp.NotBlank,
};
const VALUELESS: ReadonlySet<FilterOp> = new Set([FilterOp.Blank, FilterOp.NotBlank]);

function simpleFilters(field: string, model: SimpleFilterModel): TableFilterInput[] {
  const value = cellText(model.filter);
  if (model.type === 'inRange') {
    return [
      { field, op: FilterOp.Gte, value },
      { field, op: FilterOp.Lte, value: cellText(model.filterTo) },
    ];
  }
  const op = SIMPLE_OPS[model.type ?? ''] ?? FilterOp.Contains;
  if (VALUELESS.has(op)) {
    return [{ field, op, value: '' }];
  }
  return value === '' ? [] : [{ field, op, value }];
}

/**
 * A day range as instants in the configured timezone: from the start of the first day, to the
 * last moment of the last — so "1 to 3 March" means those three days where the company is.
 */
function dateFilters(field: string, model: DateRangeFilterModel, zone: string) {
  const filters: TableFilterInput[] = [];
  if (model.from) {
    const value = fromZonedTime(`${model.from}T00:00:00`, zone).toISOString();
    filters.push({ field, op: FilterOp.Gte, value });
  }
  if (model.to) {
    const value = fromZonedTime(`${model.to}T23:59:59.999`, zone).toISOString();
    filters.push({ field, op: FilterOp.Lte, value });
  }
  return filters;
}

function columnFilters(field: string, model: ColumnFilterModel, zone: string) {
  if (model.filterType === 'enum') {
    const { values } = model as EnumFilterModel;
    return values.length > 0 ? [{ field, op: FilterOp.In, value: '', values }] : [];
  }
  if (model.filterType === 'dateRange') {
    return dateFilters(field, model as DateRangeFilterModel, zone);
  }
  return simpleFilters(field, model as SimpleFilterModel);
}

/**
 * Flattens ag-grid's per-column filter model into the server's filter list. `zone` is the
 * admin-configured timezone a date filter's days are read in.
 */
export function toFilters(
  model: Record<string, ColumnFilterModel>,
  zone: string,
): TableFilterInput[] {
  return Object.entries(model).flatMap(([field, column]) => columnFilters(field, column, zone));
}

/** Every sorted column, in the order the person sorted them (shift-click adds one). */
export function toSorts(sortModel: readonly SortModelItem[]): TableSortInput[] {
  return sortModel.map((item) => ({
    field: item.colId,
    dir: item.sort === 'desc' ? SortDir.Desc : SortDir.Asc,
  }));
}
