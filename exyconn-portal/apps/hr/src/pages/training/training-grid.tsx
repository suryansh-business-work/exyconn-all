import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListTrainingsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedTrainingRow = ListTrainingsPagedQuery['listTrainingsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type TrainingGridContext = DatedCrudGridContext<PagedTrainingRow>;

/** Column model for the server-side Learning & Training grid. */
export const TRAINING_COLUMNS: ColDef<PagedTrainingRow>[] = [
  textColumn('title', 'Course'),
  textColumn('category', 'Category'),
  statusColumn('status', 'Status'),
  dateColumn('dueOn', 'Due'),
  actionsColumn(),
];
