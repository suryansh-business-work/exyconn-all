import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  WhatsappDemoVisitorSource,
  WhatsappDemoVisitorsPagedDocument,
  useDeleteWhatsappDemoVisitorMutation,
  useWhatsappDemoVisitorStatsQuery,
  useSetWhatsappDemoVisitorBlockedMutation,
  type WhatsappDemoVisitorsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import {
  WHATSAPP_LEAD_COLUMNS,
  type WhatsappLeadRow,
  type WhatsappLeadsGridContext,
} from './whatsapp-leads-grid';

/**
 * Website › WhatsApp Leads — everyone who asked to try the live WhatsApp demo, from the
 * chatbot page on exyconn.com or the demo's own email-and-code sign-in.
 *
 * Read-only apart from access: blocking a visitor retires their demo pass at once, and
 * deleting them removes the lead along with it. Leads are created by visitors, never here.
 */
export function WhatsappLeadsPage() {
  const {
    data: statsData,
    loading: statsLoading,
    refetch: refetchStats,
  } = useWhatsappDemoVisitorStatsQuery();
  const [deleteVisitor] = useDeleteWhatsappDemoVisitorMutation();
  const [setBlocked] = useSetWhatsappDemoVisitorBlockedMutation();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();

  const crud = useCrudResource<WhatsappLeadRow, WhatsappLeadRow>({
    label: 'Lead',
    onDelete: (row) => deleteVisitor({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete {name} and switch off their demo access?',
      values: { name: row.name },
    }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    WhatsappDemoVisitorsPagedDocument,
    (data: WhatsappDemoVisitorsPagedQuery) => data.whatsappDemoVisitorsPaged,
  );

  const changeAccess = async (row: WhatsappLeadRow, blocked: boolean) => {
    const ok = await confirm({
      title: blocked ? 'Block demo access' : 'Allow demo access',
      message: blocked
        ? '{name} is signed out of the demo now and cannot get a new code.'
        : '{name} can sign in to the demo again with a new code.',
      messageValues: { name: row.name },
      confirmText: blocked ? 'Block' : 'Allow',
    });
    if (!ok) {
      return;
    }
    try {
      await setBlocked({ variables: { id: row.id, blocked } });
      notify(blocked ? 'Demo access blocked' : 'Demo access allowed', 'success');
      crud.reload();
      await refetchStats();
    } catch (err) {
      notify(errorMessage(err, 'Could not change demo access'), 'error');
    }
  };

  const report = (blocked: boolean) => (row: WhatsappLeadRow) => {
    changeAccess(row, blocked).catch((err: unknown) =>
      notify(errorMessage(err, 'Could not change demo access'), 'error'),
    );
  };

  const stats = statsData?.whatsappDemoVisitorStats;
  const statItems: StatItem[] = [
    { label: 'Leads', value: String(statTotal(stats)), accent: color.green[500] },
    {
      label: 'From the website',
      value: String(statCount(stats, 'source', WhatsappDemoVisitorSource.Website)),
      accent: color.blue[400],
    },
    {
      label: 'From demo sign-in',
      value: String(statCount(stats, 'source', WhatsappDemoVisitorSource.DemoLogin)),
      accent: color.amber[200],
    },
    {
      label: 'Blocked',
      value: String(statCount(stats, 'blocked', 'true')),
      accent: color.orange[500],
    },
  ];

  const gridContext: WhatsappLeadsGridContext = {
    actions: { block: report(true), unblock: report(false), delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="WhatsApp leads"
      subtitle="Prospects who signed in to the live WhatsApp demo with an emailed code"
      entityLabel="lead"
      exportFileName="whatsapp-demo-leads"
      stats={statItems}
      statsLoading={!statsData && statsLoading}
      refreshSignal={crud.refreshSignal}
      columnDefs={WHATSAPP_LEAD_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by name, email, company or phone…"
    />
  );
}
