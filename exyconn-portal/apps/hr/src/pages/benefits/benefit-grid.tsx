import type { ColDef } from 'ag-grid-community';
import { actionsColumn, dateColumn, statusColumn, textColumn } from '@exyconn/crud';
import { employeeNameColumn, type NamedGridContext } from '../../grid/employee-name-column';
import type { ListBenefitsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedBenefitRow = ListBenefitsPagedQuery['listBenefitsPaged']['rows'][number];

/** Row handlers, the date formatter and the employee-name lookup ag-grid hands to shared cells. */
export type BenefitGridContext = NamedGridContext<PagedBenefitRow>;

/** Column model for the server-side Benefits grid. */
export const BENEFIT_COLUMNS: ColDef<PagedBenefitRow>[] = [
  employeeNameColumn(),
  textColumn('name', 'Benefit'),
  statusColumn('kind', 'Type'),
  textColumn('provider', 'Provider'),
  dateColumn('validTo', 'Valid till'),
  actionsColumn(),
];
