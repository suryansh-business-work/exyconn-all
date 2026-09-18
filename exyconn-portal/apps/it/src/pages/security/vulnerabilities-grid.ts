import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListItVulnerabilitiesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedVulnerabilityRow =
  ListItVulnerabilitiesPagedQuery['listItVulnerabilitiesPaged']['rows'][number];

export type VulnerabilitiesGridContext = DatedCrudGridContext<PagedVulnerabilityRow>;

/** Column model for the vulnerability register. */
export const VULNERABILITY_COLUMNS: ColDef<PagedVulnerabilityRow>[] = [
  textColumn('title', 'Vulnerability'),
  textColumn('cve', 'CVE'),
  statusColumn('severity', 'Severity'),
  textColumn('affectedSystem', 'System'),
  statusColumn('status', 'Status'),
  dateColumn('discoveredAt', 'Found'),
  dateColumn('dueAt', 'Fix by', '—'),
  actionsColumn(),
];
