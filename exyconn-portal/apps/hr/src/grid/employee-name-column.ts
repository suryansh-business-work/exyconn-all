import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import type { DatedCrudGridContext } from '@exyconn/crud';

/** Grid context for a model with an {@link employeeNameColumn}: `nameOf` comes from `useEmployeeNames`. */
export interface NamedGridContext<TRow> extends DatedCrudGridContext<TRow> {
  nameOf: (employeeId: string) => string;
}

/**
 * The employee's name, resolved through the grid context so the column model can
 * stay a module constant. Nothing on the server to sort or filter by, so neither
 * is offered.
 */
export function employeeNameColumn<TRow extends { employeeId: string }>(): ColDef<TRow> {
  return {
    colId: 'employeeName',
    headerName: 'Employee',
    valueFormatter: (params: ValueFormatterParams<TRow>) =>
      params.data ? (params.context as NamedGridContext<TRow>).nameOf(params.data.employeeId) : '',
    sortable: false,
    filter: false,
    floatingFilter: false,
  };
}
