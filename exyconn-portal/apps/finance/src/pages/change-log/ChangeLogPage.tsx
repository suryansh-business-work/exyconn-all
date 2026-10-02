import { useState } from 'react';
import {
  AUDIT_COLUMNS,
  CrudDashboard,
  usePagedFetcher,
  type AuditGridContext,
} from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { AuditDetailsDrawer, type AuditLogRow } from '@exyconn/shell/components/audit';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListFinanceChangeLogPagedDocument,
  useListFinanceChangeLogStatsQuery,
  type ListFinanceChangeLogPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/shell/components/ui';

/**
 * Finance › Change log: every change to an invoice, schedule, payment, bill, claim, cost
 * centre or budget, newest first, with what each field moved from and to. Read-only — the
 * server writes it as the changes happen.
 */
export function ChangeLogPage() {
  const { formatDateTime } = useSettings();
  const { data: statsData, loading: statsLoading } = useListFinanceChangeLogStatsQuery();
  const [selected, setSelected] = useState<AuditLogRow | null>(null);

  const fetchRows = usePagedFetcher(
    ListFinanceChangeLogPagedDocument,
    (data: ListFinanceChangeLogPagedQuery) => data.listFinanceChangeLogPaged,
  );

  const stats = statsData?.listFinanceChangeLogStats;
  const statItems: StatItem[] = [
    { label: 'Entries', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Created',
      value: String(statCount(stats, 'action', 'CREATE')),
      accent: color.green[300],
    },
    {
      label: 'Updated',
      value: String(statCount(stats, 'action', 'UPDATE')),
      accent: color.violet[400],
    },
    {
      label: 'Deleted',
      value: String(statCount(stats, 'action', 'DELETE')),
      accent: color.red[200],
    },
  ];

  const gridContext: AuditGridContext = {
    actions: { details: setSelected },
    formatDateTime,
  };

  return (
    <CrudDashboard<AuditLogRow, AuditLogRow>
      exportFileName="finance-change-log"
      title="Change log"
      subtitle="Who changed which finance record, and how"
      entityLabel="entry"
      stats={statItems}
      statsLoading={!statsData && statsLoading}
      permissionModule="FinanceChangeLog"
      columnDefs={AUDIT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      onRowClick={setSelected}
      searchPlaceholder="Search by actor, record or summary…"
      extraDialogs={
        <AuditDetailsDrawer
          row={selected}
          title="Change details"
          onClose={() => setSelected(null)}
          formatDateTime={formatDateTime}
        />
      }
    />
  );
}
