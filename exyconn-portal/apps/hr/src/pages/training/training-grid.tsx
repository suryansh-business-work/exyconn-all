import type { ColDef } from 'ag-grid-community';
import { actionsColumn, dateColumn, statusColumn, textColumn } from '@exyconn/crud';
import { employeeNameColumn, type NamedGridContext } from '../../grid/employee-name-column';
import type { ListTrainingsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedTrainingRow = ListTrainingsPagedQuery['listTrainingsPaged']['rows'][number];

/** Row handlers, the date formatter and the employee-name lookup ag-grid hands to shared cells. */
export type TrainingGridContext = NamedGridContext<PagedTrainingRow>;

/** Column model for the server-side Learning & Training grid. */
export const TRAINING_COLUMNS: ColDef<PagedTrainingRow>[] = [
  employeeNameColumn(),
  textColumn('title', 'Course'),
  textColumn('category', 'Category'),
  statusColumn('status', 'Status'),
  dateColumn('dueOn', 'Due'),
  actionsColumn(),
];
