import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  statusColumn,
  valueColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ListSupportSlaPoliciesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedSlaPolicyRow =
  ListSupportSlaPoliciesPagedQuery['listSupportSlaPoliciesPaged']['rows'][number];

export type SlaPoliciesGridContext = CrudGridContext<PagedSlaPolicyRow>;

const MINUTES_PER_HOUR = 60;

/** Minutes read as hours past an hour — "8h" carries more than "480". */
export function asDuration(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes} min`;
  }
  const hours = minutes / MINUTES_PER_HOUR;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

export const SLA_POLICY_COLUMNS: ColDef<PagedSlaPolicyRow>[] = [
  statusColumn('priority', 'Priority'),
  valueColumn('firstResponseMinutes', 'First response', (row) =>
    asDuration(row.firstResponseMinutes),
  ),
  valueColumn('resolutionMinutes', 'Resolution', (row) => asDuration(row.resolutionMinutes)),
  boolColumn('active', 'Active'),
  actionsColumn(),
];
