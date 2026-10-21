import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import type { CrudGridContext } from '@exyconn/crud';

/** Row handlers, plus the date-time formatter the "when" columns read off the grid context. */
export interface TimedGridContext<TRow> extends CrudGridContext<TRow> {
  /** Formats an ISO timestamp in the viewer's timezone and admin-configured format. */
  formatDateTime: (value: string) => string;
}

/** A field name ag-grid accepts for the row type. */
type Field<TRow> = NonNullable<ColDef<TRow>['field']>;

/**
 * A timestamp column with the time of day as well as the date — two calls on one day must
 * read apart. Sortable; formatted through the viewer's settings.
 */
export function dateTimeColumn<TRow>(field: Field<TRow>, headerName: string): ColDef<TRow> {
  return {
    field,
    headerName,
    width: 190,
    valueFormatter: (params: ValueFormatterParams<TRow>) => {
      const value: unknown = params.value;
      if (typeof value !== 'string' || value === '') {
        return '';
      }
      return (params.context as TimedGridContext<TRow>).formatDateTime(value);
    },
    filter: false,
    floatingFilter: false,
  };
}
