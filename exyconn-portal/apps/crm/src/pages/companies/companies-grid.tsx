import type { ColDef } from 'ag-grid-community';
import { actionsColumn, statusColumn, textColumn, type CrudGridContext } from '@exyconn/crud';
import type { ListCompaniesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedCompanyRow = ListCompaniesPagedQuery['listCompaniesPaged']['rows'][number];
export type CompaniesGridContext = CrudGridContext<PagedCompanyRow>;

/** Column model for the server-side Companies grid. */
export const COMPANY_COLUMNS: ColDef<PagedCompanyRow>[] = [
  textColumn('name', 'Company'),
  textColumn('domain', 'Domain'),
  textColumn('industry', 'Industry'),
  textColumn('size', 'Size'),
  statusColumn('status', 'Status'),
  textColumn('owner', 'Owner'),
  actionsColumn(),
];
