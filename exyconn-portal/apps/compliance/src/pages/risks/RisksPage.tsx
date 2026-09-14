import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import { useT } from '@exyconn/i18n';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { color } from '@exyconn/shell/components/ui';
import {
  useListRisksStatsQuery,
  useDeleteRiskMutation,
  ListRisksPagedDocument,
  type ListRisksPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { RiskForm, type RiskRow } from './forms/risk';
import { RISK_COLUMNS, type PagedRiskRow, type RisksGridContext } from './risks-grid';

/**
 * The risk register — the record ISO 9001, 27001, 45001 and 14001 all ask for at clause 6.1,
 * and the first thing an auditor opens.
 */
export function RisksPage() {
  const t = useT();
  const { data: statsData, refetch } = useListRisksStatsQuery();
  const [deleteRisk] = useDeleteRiskMutation();
  const { formatDate } = useSettings();
  const crud = useCrudResource<RiskRow, PagedRiskRow>({
    label: 'Risk',
    onDelete: (row) => deleteRisk({ variables: { id: row.id } }),
    confirmMessage: (row) =>
      t('Delete risk "{reference} — {title}"?', { reference: row.reference, title: row.title }),
    refetch,
  });
  const fetchRows = usePagedFetcher(
    ListRisksPagedDocument,
    (data: ListRisksPagedQuery) => data.listRisksPaged,
  );

  const stats = statsData?.listRisksStats;
  const statItems: StatItem[] = [
    { label: 'Risks', value: String(statTotal(stats)), accent: color.teal[600] },
    {
      label: 'Being treated',
      value: String(statCount(stats, 'status', 'TREATING')),
      accent: color.orange[500],
    },
    {
      label: 'Monitored',
      value: String(statCount(stats, 'status', 'MONITORING')),
      accent: color.blue[400],
    },
    {
      label: 'Closed',
      value: String(statCount(stats, 'status', 'CLOSED')),
      accent: color.green[300],
    },
  ];

  const gridContext: RisksGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Risk register"
      subtitle="What could go wrong, what is being done about it, and what is left"
      entityLabel="risk"
      exportFileName="risk-register"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <RiskForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={RISK_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by reference, risk, subject or owner…"
    />
  );
}
