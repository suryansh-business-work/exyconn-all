import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ListJobCompaniesPagedQuery } from '@exyconn/shell/graphql/generated';
import { activeStatus } from './active-status';

export type PagedJobCompanyRow =
  ListJobCompaniesPagedQuery['listJobCompaniesPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type JobCompaniesGridContext = CrudGridContext<PagedJobCompanyRow>;

/** Column model for the server-side Job Companies grid. Name/Slug/Code hit the server filter. */
export const JOB_COMPANY_COLUMNS: ColDef<PagedJobCompanyRow>[] = [
  textColumn('name', 'Name'),
  textColumn('slug', 'Slug'),
  textColumn('companyCode', 'Code'),
  textColumn('industry', 'Industry'),
  statusColumn<PagedJobCompanyRow>('isActive', 'Status', activeStatus),
  valueColumn('order', 'Order', (row) => String(row.order)),
  actionsColumn(),
];
