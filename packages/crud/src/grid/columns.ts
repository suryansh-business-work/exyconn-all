import type { ColDef, ValueGetterParams, ValueFormatterParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { BoolCell, RowActionsCell, StatusCell, formatDateValue } from './cells';
import type { RowActionSpec } from './types';

/** A field name ag-grid accepts for the row type. */
type Field<TRow> = NonNullable<ColDef<TRow>['field']>;

/** Renders a value derived from the whole row, or '' while the row is still loading. */
type RowFormat<TRow> = (row: TRow) => string;

/**
 * Only text columns are wired to the server's `TableQueryInput.filters`, so every other
 * column opts out of the floating filter row rather than offering a filter that does nothing.
 */
const DISPLAY_ONLY = { filter: false, floatingFilter: false } as const;

/** A column with no backing field cannot be sorted or filtered by the server either. */
const DERIVED_ONLY = { sortable: false, ...DISPLAY_ONLY } as const;

/** Edit pencil — the first action on every CRUD grid. */
export const EDIT_ACTION: RowActionSpec = { key: 'edit', label: 'edit', icon: EditIcon };

/** Delete bin — the last action on every CRUD grid. */
export const DELETE_ACTION: RowActionSpec = { key: 'delete', label: 'delete', icon: DeleteIcon };

const DEFAULT_ACTIONS: readonly RowActionSpec[] = [EDIT_ACTION, DELETE_ACTION];

/** Icon buttons are 30px wide, inside 60px of cell padding. */
const ACTION_WIDTH = 30;
const ACTIONS_PADDING = 60;

const rowFormatter =
  <TRow>(format: RowFormat<TRow>) =>
  (params: ValueFormatterParams<TRow>): string =>
    params.data ? format(params.data) : '';

const rowGetter =
  <TRow>(derive: RowFormat<TRow>) =>
  (params: ValueGetterParams<TRow>): string | null =>
    params.data ? derive(params.data) : null;

/** A sortable, server-filterable text column; `format` shapes what the cell shows. */
export function textColumn<TRow>(
  field: Field<TRow>,
  headerName: string,
  format?: RowFormat<TRow>,
): ColDef<TRow> {
  return { field, headerName, valueFormatter: format && rowFormatter(format) };
}

/** A sortable column the server does not filter — money, counts, anything non-textual. */
export function valueColumn<TRow>(
  field: Field<TRow>,
  headerName: string,
  format: RowFormat<TRow>,
): ColDef<TRow> {
  return { field, headerName, valueFormatter: rowFormatter(format), ...DISPLAY_ONLY };
}

/** A read-only column with no backing field, e.g. a joined author name or a tag list. */
export function derivedColumn<TRow>(
  colId: string,
  headerName: string,
  format: RowFormat<TRow>,
): ColDef<TRow> {
  return { colId, headerName, valueFormatter: rowFormatter(format), ...DERIVED_ONLY };
}

/**
 * An enum or lifecycle column rendered as the shared colour-coded status chip. Pass
 * `toStatus` when the chip's label is derived rather than the raw field value.
 */
export function statusColumn<TRow>(
  field: Field<TRow>,
  headerName: string,
  toStatus?: RowFormat<TRow>,
): ColDef<TRow> {
  return {
    field,
    headerName,
    cellRenderer: StatusCell,
    valueGetter: toStatus && rowGetter(toStatus),
    ...DISPLAY_ONLY,
  };
}

/** A status chip column with no backing field, e.g. one derived from several flags. */
export function derivedStatusColumn<TRow>(
  colId: string,
  headerName: string,
  toStatus: RowFormat<TRow>,
): ColDef<TRow> {
  return {
    colId,
    headerName,
    cellRenderer: StatusCell,
    valueGetter: rowGetter(toStatus),
    ...DERIVED_ONLY,
  };
}

/** A boolean flag column rendered as a Yes/No chip. */
export function boolColumn<TRow>(field: Field<TRow>, headerName: string): ColDef<TRow> {
  return { field, headerName, cellRenderer: BoolCell, ...DISPLAY_ONLY };
}

/**
 * An ISO date column formatted through the viewer's date settings. The page must put
 * `formatDate` on the grid context — type it as `DatedCrudGridContext`.
 */
export function dateColumn<TRow>(
  field: Field<TRow>,
  headerName: string,
  emptyText = '',
): ColDef<TRow> {
  return {
    field,
    headerName,
    valueFormatter: (params: ValueFormatterParams<TRow>) => formatDateValue(params, emptyText),
    ...DISPLAY_ONLY,
  };
}

/**
 * The trailing actions column. Handlers come from the grid context keyed by
 * `RowActionSpec.key`, so the column model stays a module-level constant; the width
 * follows the number of buttons unless it is overridden.
 */
export function actionsColumn<TRow>(
  actions: readonly RowActionSpec[] = DEFAULT_ACTIONS,
  width = ACTIONS_PADDING + ACTION_WIDTH * actions.length,
): ColDef<TRow> {
  return {
    colId: 'actions',
    headerName: '',
    cellRenderer: RowActionsCell,
    cellRendererParams: { actionSpecs: actions },
    ...DERIVED_ONLY,
    flex: 0,
    width,
    minWidth: width,
  };
}
