import { useState } from 'react';
import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListAuditLogsPagedDocument,
  useListAuditLogsStatsQuery,
  type ListAuditLogsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { AuditDetailsDrawer } from './AuditDetailsDrawer';
import { AUDIT_COLUMNS, type AuditGridContext, type PagedAuditRow } from './audit-grid';
import { color } from '@exyconn/shell/components/ui';

/**
 * Admin › Audit Log: every create, update, delete, sign-in, role, permission and access
 * change the server recorded, newest first. Read-only by design — the log is only worth
 * reading because nothing here can edit it.
 */
export function AuditLogPage() {
  const { formatDateTime } = useSettings();
  const { data: statsData } = useListAuditLogsStatsQuery();
  const [selected, setSelected] = useState<PagedAuditRow | null>(null);

  const fetchRows = usePagedFetcher(
    ListAuditLogsPagedDocument,
    (data: ListAuditLogsPagedQuery) => data.listAuditLogsPaged,
  );

  const stats = statsData?.listAuditLogsStats;
  const statItems: StatItem[] = [
    { label: 'Entries', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Updates',
      value: String(statCount(stats, 'action', 'UPDATE')),
      accent: color.violet[400],
    },
    {
      label: 'Deletes',
      value: String(statCount(stats, 'action', 'DELETE')),
      accent: color.red[200],
    },
    {
      label: 'Sign-ins',
      value: String(statCount(stats, 'action', 'LOGIN')),
      accent: color.green[300],
    },
  ];

  const gridContext: AuditGridContext = {
    actions: { details: setSelected },
    formatDateTime,
  };

  return (
    <CrudDashboard<PagedAuditRow, PagedAuditRow>
      title="Audit Log"
      subtitle="Who changed what, and when"
      entityLabel="entry"
      stats={statItems}
      permissionModule="AuditLog"
      columnDefs={AUDIT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      onRowClick={setSelected}
      searchPlaceholder="Search by actor, entity or summary…"
      extraDialogs={
        <AuditDetailsDrawer
          row={selected}
          onClose={() => setSelected(null)}
          formatDateTime={formatDateTime}
        />
      }
    />
  );
}
