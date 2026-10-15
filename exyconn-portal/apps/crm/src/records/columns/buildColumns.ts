import type { ColDef, ValueGetterParams } from 'ag-grid-community';
import type { CrmSortInput } from '@exyconn/shell/graphql/generated';
import {
  displayValue,
  valueOf,
  type CrmPropertyInfo,
  type CrmRecordRow,
  type ValueFormatters,
} from '../schema';

/** The id ag-grid knows a column by: its `colId`, else its field. */
export function columnId<TRow>(column: ColDef<TRow>): string {
  return column.colId ?? String(column.field ?? '');
}

const ACTIONS_ID = 'actions';

/**
 * A column the Columns dialog offers. Only properties can be chosen — a saved view stores
 * property keys — so a page column with no property behind it (Client, say) is part of the
 * page's default layout only.
 */
export interface ColumnChoice {
  id: string;
  /** The English source for a page or built-in column; a custom property's own label. */
  label: string;
  custom: boolean;
  /** Built-in labels are translated; a custom label is the company's own words. */
  translate: boolean;
}

/** Every property as a column choice, named the way the page's own column names it. */
export function columnChoices<TRow>(
  pageColumns: readonly ColDef<TRow>[],
  properties: readonly CrmPropertyInfo[],
): ColumnChoice[] {
  const headings = new Map(pageColumns.map((column) => [columnId(column), column.headerName]));
  return properties.map((property) => ({
    id: property.key,
    label: headings.get(property.key) ?? property.label,
    custom: !property.builtIn,
    translate: property.builtIn,
  }));
}

/** A plain cell for a property the page has no hand-written column for — a custom one, say. */
function propertyColumn<TRow extends CrmRecordRow>(
  property: CrmPropertyInfo,
  formatters: ValueFormatters,
): ColDef<TRow> {
  return {
    colId: property.key,
    headerName: property.label,
    valueGetter: (params: ValueGetterParams<TRow>) =>
      params.data ? displayValue(property, valueOf(params.data, property), formatters) : '',
  };
}

export interface BuildColumnsInput<TRow> {
  /** The page's hand-written columns, the trailing actions column included. */
  pageColumns: readonly ColDef<TRow>[];
  properties: readonly CrmPropertyInfo[];
  /** The view's visible column ids, in order; empty for the page's defaults. */
  visible: readonly string[];
  sorts: readonly CrmSortInput[];
  formatters: ValueFormatters;
}

/** The ids actually shown: the view's columns that still exist, else the page's defaults. */
export function visibleColumnIds<TRow>(
  pageColumns: readonly ColDef<TRow>[],
  choices: readonly ColumnChoice[],
  visible: readonly string[],
): string[] {
  const known = new Set(choices.map((choice) => choice.id));
  const kept = visible.filter((id) => known.has(id));
  if (kept.length > 0) {
    return kept;
  }
  return pageColumns.map((column) => columnId(column)).filter((id) => id !== ACTIONS_ID);
}

/**
 * The grid's column model for a view. The page's own columns keep their chips, badges and
 * formatting; any other property gets a plain formatted cell. Filtering lives in the filter
 * builder, so no column offers a filter of its own, and only a real property can be sorted
 * (the server sorts by property). The first sort level marks its column's header.
 */
export function buildColumnDefs<TRow extends CrmRecordRow>({
  pageColumns,
  properties,
  visible,
  sorts,
  formatters,
}: BuildColumnsInput<TRow>): ColDef<TRow>[] {
  const byId = new Map(pageColumns.map((column) => [columnId(column), column]));
  const byKey = new Map(properties.map((property) => [property.key, property]));
  const choices = columnChoices(pageColumns, properties);
  const primary = sorts[0];
  const columns: ColDef<TRow>[] = [];
  for (const id of visibleColumnIds(pageColumns, choices, visible)) {
    const property = byKey.get(id);
    const base = byId.get(id) ?? (property && propertyColumn<TRow>(property, formatters));
    if (!base) {
      continue;
    }
    const initialSort = primary?.property === id ? primary.dir.toLowerCase() : undefined;
    columns.push({
      ...base,
      sortable: Boolean(property),
      filter: false,
      floatingFilter: false,
      initialSort: initialSort as ColDef<TRow>['initialSort'],
    });
  }
  const actions = byId.get(ACTIONS_ID);
  return actions ? [...columns, actions] : columns;
}
