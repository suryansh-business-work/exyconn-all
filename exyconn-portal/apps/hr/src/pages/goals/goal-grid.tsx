import type { ColDef } from 'ag-grid-community';
import { actionsColumn, dateColumn, statusColumn, textColumn, valueColumn } from '@exyconn/crud';
import { employeeNameColumn, type NamedGridContext } from '../../grid/employee-name-column';
import type { ListGoalsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedGoalRow = ListGoalsPagedQuery['listGoalsPaged']['rows'][number];

/** Row handlers, the date formatter and the employee-name lookup ag-grid hands to shared cells. */
export type GoalGridContext = NamedGridContext<PagedGoalRow>;

/** Column model for the server-side Goals grid. */
export const GOAL_COLUMNS: ColDef<PagedGoalRow>[] = [
  employeeNameColumn(),
  textColumn('title', 'Goal'),
  textColumn('kpi', 'KPI'),
  valueColumn('weightage', 'Weight', (row) => String(row.weightage ?? '—')),
  valueColumn('progress', 'Progress', (row) => String(row.progress ?? '—')),
  statusColumn('status', 'Status'),
  dateColumn('endDate', 'Ends'),
  actionsColumn(),
];
