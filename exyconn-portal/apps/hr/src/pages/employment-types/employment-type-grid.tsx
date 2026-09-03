import type { ColDef } from 'ag-grid-community';
import { actionsColumn, boolColumn, textColumn, type DatedCrudGridContext } from '@exyconn/crud';
import type { ListEmploymentTypesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedEmploymentTypeRow =
  ListEmploymentTypesPagedQuery['listEmploymentTypesPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type EmploymentTypeGridContext = DatedCrudGridContext<PagedEmploymentTypeRow>;

/** Column model for the server-side Employment Types grid. */
export const EMPLOYMENT_TYPE_COLUMNS: ColDef<PagedEmploymentTypeRow>[] = [
  textColumn('name', 'Type'),
  textColumn('code', 'Code'),
  boolColumn('payrollEligible', 'Payroll'),
  boolColumn('active', 'Active'),
  actionsColumn(),
];
