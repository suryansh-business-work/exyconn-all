import type { ColDef } from 'ag-grid-community';
import { actionsColumn, dateColumn, textColumn, valueColumn } from '@exyconn/crud';
import { employeeNameColumn, type NamedGridContext } from '../../grid/employee-name-column';
import type { ListSalaryStructuresPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedSalaryStructureRow =
  ListSalaryStructuresPagedQuery['listSalaryStructuresPaged']['rows'][number];

/** Row handlers, the date formatter and the employee-name lookup ag-grid hands to shared cells. */
export type SalaryStructureGridContext = NamedGridContext<PagedSalaryStructureRow>;

/** Column model for the server-side Salary Structures grid. */
export const SALARY_STRUCTURE_COLUMNS: ColDef<PagedSalaryStructureRow>[] = [
  employeeNameColumn(),
  textColumn('currency', 'Currency'),
  textColumn('payType', 'Pay type'),
  valueColumn('basic', 'Basic', (row) => String(row.basic ?? '—')),
  // The single amount the non-fixed types are paid at, and what the tracker bills an hour at.
  valueColumn('rate', 'Rate', (row) => (row.rate ? String(row.rate) : '—')),
  valueColumn('billingRate', 'Bill / hr', (row) =>
    row.billingRate ? String(row.billingRate) : '—',
  ),
  valueColumn('gross', 'Gross', (row) => String(row.gross ?? '—')),
  valueColumn('net', 'Net', (row) => String(row.net ?? '—')),
  dateColumn('effectiveFrom', 'Effective'),
  actionsColumn(),
];
