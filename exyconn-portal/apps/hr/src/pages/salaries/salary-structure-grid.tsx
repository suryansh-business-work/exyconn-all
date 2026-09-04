import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListSalaryStructuresPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedSalaryStructureRow =
  ListSalaryStructuresPagedQuery['listSalaryStructuresPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type SalaryStructureGridContext = DatedCrudGridContext<PagedSalaryStructureRow>;

/** Column model for the server-side Salary Structures grid. */
export const SALARY_STRUCTURE_COLUMNS: ColDef<PagedSalaryStructureRow>[] = [
  textColumn('employeeId', 'Employee ID'),
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
