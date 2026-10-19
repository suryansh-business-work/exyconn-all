import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import { useFormatters, useT } from '@exyconn/i18n';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { Button, Flex, Text } from '@exyconn/shell/components/ui';
import { color } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useMarketingSuppressionSummaryQuery,
  useSetMarketingSuppressionArchivedMutation,
  ListMarketingSuppressionsPagedDocument,
  type ListMarketingSuppressionsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { SuppressionForm, type SuppressionRow } from './forms/suppression';
import { SuppressionDialogs, type SuppressionDialog } from './SuppressionDialogs';
import {
  SUPPRESSION_COLUMNS,
  type PagedSuppressionRow,
  type SuppressionGridContext,
} from './suppression-grid';

/**
 * Marketing → Suppression List: every address no marketing campaign may reach.
 *
 * Archiving only hides a row; the sender reads archived rows too. Removing one is a separate,
 * justified action, and there is no bulk removal.
 */
export function SuppressionPage() {
  const t = useT();
  const notify = useNotify();
  const { formatDate, formatDateTime, formatNumber } = useFormatters();
  const { data, loading, refetch } = useMarketingSuppressionSummaryQuery({
    fetchPolicy: 'network-only',
  });
  const [setArchived] = useSetMarketingSuppressionArchivedMutation();
  const [dialog, setDialog] = useState<SuppressionDialog>(null);
  const crud = useCrudResource<SuppressionRow, PagedSuppressionRow>({
    label: 'Suppression',
    // The grid has no plain delete; removal goes through the justified dialog.
    onDelete: async (row) => setDialog({ kind: 'remove', row }),
    confirmMessage: (row) => ({ message: 'Remove {email}?', values: { email: row.email } }),
    refetch,
  });
  const fetchRows = usePagedFetcher(
    ListMarketingSuppressionsPagedDocument,
    (result: ListMarketingSuppressionsPagedQuery) => result.listMarketingSuppressionsPaged,
  );

  const archive = async (row: PagedSuppressionRow, archived: boolean) => {
    try {
      await setArchived({ variables: { id: row.id, archived } });
      notify(
        archived ? '{email} archived — still suppressed' : '{email} restored to the list',
        'success',
        {
          email: row.email,
        },
      );
      crud.reload();
    } catch (err) {
      notify(errorMessage(err, 'The address could not be updated'), 'error');
    }
  };
  const changed = () => {
    setDialog(null);
    crud.reload();
  };

  const summary = data?.marketingSuppressionSummary;
  const figure = (value?: number) => formatNumber(value ?? 0);
  const statItems: StatItem[] = [
    { label: 'Total suppressed', value: figure(summary?.total), accent: color.red[500] },
    { label: 'Unsubscribed', value: figure(summary?.unsubscribed), accent: color.blue[400] },
    { label: 'Hard bounced', value: figure(summary?.hardBounced), accent: color.orange[500] },
    { label: 'Added manually', value: figure(summary?.addedManually), accent: color.violet[400] },
  ];

  const gridContext: SuppressionGridContext = {
    actions: {
      details: (row) => setDialog({ kind: 'details', row }),
      note: (row) => setDialog({ kind: 'note', row }),
      remove: (row) => setDialog({ kind: 'remove', row }),
      archive: (row) => archive(row, true),
      unarchive: (row) => archive(row, false),
    },
    formatDate,
  };

  const toolbar = (
    <Flex
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ sm: 'center' }}
      gap={1}
    >
      <Text size="caption" color="text.secondary" role="status">
        {t(
          'Each address is counted once, under its recorded reason. Archived addresses ({archived}) count and stay suppressed.',
          { archived: figure(summary?.archived) },
        )}
        {summary?.updatedAt &&
          ` ${t('Last updated {time}.', { time: formatDateTime(summary.updatedAt) })}`}
      </Text>
      <Button
        variant="outlined"
        startIcon={<PlaylistAddIcon />}
        onClick={() => setDialog({ kind: 'bulk' })}
      >
        {t('Suppress several')}
      </Button>
    </Flex>
  );

  return (
    <CrudDashboard
      exportFileName="suppression-list"
      title="Suppression List"
      subtitle="Addresses excluded from marketing campaigns"
      entityLabel="suppressed address"
      actionLabel="Add address"
      permissionModule="MarketingSuppression"
      stats={statItems}
      statsLoading={!data && loading}
      crud={crud}
      renderForm={() => <SuppressionForm onCancel={crud.close} onDone={crud.onDone} />}
      columnDefs={SUPPRESSION_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search email, contact or company…"
      toolbar={toolbar}
      extraDialogs={
        <SuppressionDialogs dialog={dialog} onClose={() => setDialog(null)} onChanged={changed} />
      }
    />
  );
}
