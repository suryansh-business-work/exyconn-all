import type { ColDef } from 'ag-grid-community';
import { actionsColumn, boolColumn, dateColumn, statusColumn, valueColumn } from '@exyconn/crud';
import { employeeNameColumn, type NamedGridContext } from '../../grid/employee-name-column';
import type { ListExitRecordsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedExitRecordRow = ListExitRecordsPagedQuery['listExitRecordsPaged']['rows'][number];

/** Row handlers, the date formatter and the employee-name lookup ag-grid hands to shared cells. */
export type ExitRecordGridContext = NamedGridContext<PagedExitRecordRow>;

/** Column model for the server-side Exits & Offboarding grid. */
export const EXIT_RECORD_COLUMNS: ColDef<PagedExitRecordRow>[] = [
  employeeNameColumn(),
  statusColumn('stage', 'Stage'),
  dateColumn('resignationDate', 'Resigned'),
  dateColumn('lastWorkingDate', 'Last day'),
  valueColumn('daysToLastWorkingDay', 'Days left', (row) =>
    String(row.daysToLastWorkingDay ?? '—'),
  ),
  boolColumn('documentsIssued', 'Docs'),
  actionsColumn(),
];
