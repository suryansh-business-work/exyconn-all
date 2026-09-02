import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListGradesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedGradeRow = ListGradesPagedQuery['listGradesPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type GradeGridContext = DatedCrudGridContext<PagedGradeRow>;

/** Column model for the server-side Grades grid. */
export const GRADE_COLUMNS: ColDef<PagedGradeRow>[] = [
  textColumn('name', 'Grade'),
  textColumn('code', 'Code'),
  valueColumn('level', 'Level', (row) => String(row.level ?? '—')),
  valueColumn('minSalary', 'Min', (row) => String(row.minSalary ?? '—')),
  valueColumn('maxSalary', 'Max', (row) => String(row.maxSalary ?? '—')),
  boolColumn('active', 'Active'),
  actionsColumn(),
];
