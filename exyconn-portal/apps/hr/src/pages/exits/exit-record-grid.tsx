import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  dateColumn,
  statusColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListExitRecordsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedExitRecordRow = ListExitRecordsPagedQuery['listExitRecordsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type ExitRecordGridContext = DatedCrudGridContext<PagedExitRecordRow>;

/** Column model for the server-side Exits & Offboarding grid. */
export const EXIT_RECORD_COLUMNS: ColDef<PagedExitRecordRow>[] = [
  statusColumn('stage', 'Stage'),
  dateColumn('resignationDate', 'Resigned'),
  dateColumn('lastWorkingDate', 'Last day'),
  valueColumn('daysToLastWorkingDay', 'Days left', (row) =>
    String(row.daysToLastWorkingDay ?? '—'),
  ),
  boolColumn('documentsIssued', 'Docs'),
  actionsColumn(),
];
