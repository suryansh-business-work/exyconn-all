import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListInternalAuditsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedAuditRow = ListInternalAuditsPagedQuery['listInternalAuditsPaged']['rows'][number];

export type AuditsGridContext = DatedCrudGridContext<PagedAuditRow>;

/**
 * The audit programme: one row per audit, planned first and reported afterwards. `scope` and
 * `criteria` sit beside each other because a finding needs both to mean anything later.
 */
export const AUDIT_COLUMNS: ColDef<PagedAuditRow>[] = [
  textColumn('reference', 'Ref'),
  textColumn('title', 'Audit'),
  statusColumn('kind', 'Kind'),
  textColumn('scope', 'Scope'),
  derivedColumn<PagedAuditRow>('standards', 'Standards', (row) =>
    row.standards.map((standard) => standard.replace('_', ' ')).join(', '),
  ),
  textColumn('leadAuditorName', 'Lead auditor'),
  textColumn('auditeeName', 'Auditee'),
  dateColumn('plannedOn', 'Planned'),
  dateColumn('performedOn', 'Performed', '—'),
  statusColumn('status', 'Status'),
  actionsColumn(),
];
