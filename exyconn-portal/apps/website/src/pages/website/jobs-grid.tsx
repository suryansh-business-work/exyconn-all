import type { ColDef } from 'ag-grid-community';
import { actionsColumn, statusColumn, textColumn, type CrudGridContext } from '@exyconn/crud';
import type { ListJobsPagedQuery } from '@exyconn/shell/graphql/generated';
import { activeStatus } from './active-status';

export type PagedJobRow = ListJobsPagedQuery['listJobsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type JobsGridContext = CrudGridContext<PagedJobRow>;

/** Column model for the server-side Jobs grid. Title/Code/Company hit the server filter. */
export const JOB_COLUMNS: ColDef<PagedJobRow>[] = [
  textColumn('title', 'Title'),
  textColumn('jobCode', 'Code'),
  textColumn('companySlug', 'Company'),
  textColumn('category', 'Category'),
  textColumn('jobType', 'Type'),
  textColumn('workMode', 'Work mode'),
  statusColumn<PagedJobRow>('isActive', 'Status', activeStatus),
  actionsColumn(),
];
