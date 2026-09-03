import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ListProblemReportsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedProblemReportRow =
  ListProblemReportsPagedQuery['listProblemReportsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type ProblemReportsGridContext = CrudGridContext<PagedProblemReportRow>;

/**
 * Column model for the triage grid. Reference, subject and the reporter are what Tech
 * searches by, so those are the server-filtered ones.
 */
export const PROBLEM_REPORT_COLUMNS: ColDef<PagedProblemReportRow>[] = [
  textColumn('reference', 'Reference'),
  textColumn('subject', 'Problem'),
  textColumn('serviceName', 'Service'),
  statusColumn('category', 'Type'),
  statusColumn('severity', 'Severity'),
  statusColumn('status', 'Status'),
  textColumn('reporterName', 'Reported by'),
  textColumn('reporterEmail', 'Email'),
  textColumn('assignee', 'Assignee'),
  dateColumn('createdAt', 'Received'),
  actionsColumn(),
];
