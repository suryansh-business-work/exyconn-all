import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListFindingsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedFindingRow = ListFindingsPagedQuery['listFindingsPaged']['rows'][number];

export type FindingsGridContext = DatedCrudGridContext<PagedFindingRow>;

/**
 * Findings with their corrective action beside them, because the two are one record: what
 * went wrong, who owns putting it right, when it is due, and whether it worked.
 */
export const FINDING_COLUMNS: ColDef<PagedFindingRow>[] = [
  textColumn('reference', 'Ref'),
  textColumn('title', 'Finding'),
  statusColumn('type', 'Type'),
  statusColumn('source', 'Raised by'),
  textColumn('clause', 'Clause'),
  textColumn('ownerName', 'Owner'),
  dateColumn('raisedOn', 'Raised'),
  dateColumn('dueOn', 'Due', '—'),
  statusColumn('status', 'Status'),
  boolColumn('effective', 'Effective'),
  actionsColumn(),
];
