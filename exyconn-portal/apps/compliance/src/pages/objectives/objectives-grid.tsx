import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListObjectivesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedObjectiveRow = ListObjectivesPagedQuery['listObjectivesPaged']['rows'][number];

export type ObjectivesGridContext = DatedCrudGridContext<PagedObjectiveRow>;

/**
 * Each objective with the three numbers that make it measurable — where it started, where it
 * has to get to and where it is — and the distance travelled between them.
 */
export const OBJECTIVE_COLUMNS: ColDef<PagedObjectiveRow>[] = [
  textColumn('title', 'Objective'),
  textColumn('measure', 'Measured by'),
  statusColumn('category', 'Category'),
  textColumn('ownerName', 'Owner'),
  derivedColumn<PagedObjectiveRow>('progress', 'Baseline → target', (row) =>
    `${row.baseline} → ${row.target} ${row.unit}`.trim(),
  ),
  valueColumn('actual', 'Now', (row) => `${row.actual} ${row.unit}`.trim()),
  valueColumn('achievementPercent', 'Achieved', (row) => `${row.achievementPercent}%`),
  statusColumn('status', 'Status'),
  dateColumn('periodEnd', 'Period ends'),
  actionsColumn(),
];
