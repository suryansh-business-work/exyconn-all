import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListGoalsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedGoalRow = ListGoalsPagedQuery['listGoalsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type GoalGridContext = DatedCrudGridContext<PagedGoalRow>;

/** Column model for the server-side Goals grid. */
export const GOAL_COLUMNS: ColDef<PagedGoalRow>[] = [
  textColumn('title', 'Goal'),
  textColumn('kpi', 'KPI'),
  valueColumn('weightage', 'Weight', (row) => String(row.weightage ?? '—')),
  valueColumn('progress', 'Progress', (row) => String(row.progress ?? '—')),
  statusColumn('status', 'Status'),
  dateColumn('endDate', 'Ends'),
  actionsColumn(),
];
