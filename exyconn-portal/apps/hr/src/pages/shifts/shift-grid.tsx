import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListShiftsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedShiftRow = ListShiftsPagedQuery['listShiftsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type ShiftGridContext = DatedCrudGridContext<PagedShiftRow>;

/** Column model for the server-side Shifts grid. */
export const SHIFT_COLUMNS: ColDef<PagedShiftRow>[] = [
  textColumn('name', 'Shift'),
  textColumn('code', 'Code'),
  textColumn('startTime', 'Start'),
  textColumn('endTime', 'End'),
  valueColumn('graceMinutes', 'Grace', (row) => String(row.graceMinutes ?? '—')),
  boolColumn('active', 'Active'),
  actionsColumn(),
];
