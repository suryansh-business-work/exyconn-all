import { useT } from '@exyconn/i18n';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import SyncIcon from '@mui/icons-material/Sync';
import { Box, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { Account, useSocialAccounts } from './useSocialAccounts';

type Accounts = ReturnType<typeof useSocialAccounts>;

/** The connected accounts: when each was last read, why a read failed, and what to do next. */
export function ConnectedAccountsTable({ social }: Readonly<{ social: Accounts }>) {
  const t = useT();
  const { formatDate, formatDateTime } = useSettings();
  const columns: Column<Account>[] = [
    { key: 'network', label: 'Network', render: (r) => <StatusChip value={r.network} /> },
    { key: 'name', label: 'Account', render: (r) => <Text weight="medium">{r.name}</Text> },
    { key: 'handle', label: 'Handle', render: (r) => r.handle || '—' },
    { key: 'createdAt', label: 'Connected', render: (r) => formatDate(r.createdAt) },
    {
      key: 'lastSyncedAt',
      label: 'Last synced',
      render: (r) => {
        if (!r.lastSyncedAt) return t('Not yet');
        if (!r.syncError) return formatDateTime(r.lastSyncedAt);
        return (
          <Text size="sm" color="error">
            {r.syncError}
          </Text>
        );
      },
    },
    {
      key: 'expiresAt',
      label: 'Access until',
      render: (r) => (r.expiresAt ? formatDate(r.expiresAt) : t('Does not expire')),
    },
  ];
  const actions: RowAction<Account>[] = [
    {
      icon: <SyncIcon fontSize="small" />,
      tooltip: 'Sync posts now',
      ariaLabel: 'sync account',
      onClick: (row) => {
        social.sync(row.id).catch((error: unknown) => portalLogger.error('Sync failed', error));
      },
      hidden: () => social.syncing !== null,
    },
    {
      icon: <LinkOffIcon fontSize="small" />,
      tooltip: 'Disconnect',
      ariaLabel: 'disconnect account',
      color: 'error',
      onClick: (row) => {
        social
          .disconnect(row)
          .catch((error: unknown) => portalLogger.error('Disconnect failed', error));
      },
    },
  ];
  return (
    <Box sx={densePanel}>
      <DataTable
        columns={columns}
        rows={[...social.accounts]}
        actions={actions}
        loading={social.loading}
        onRefresh={social.refetch}
        emptyMessage="No accounts connected yet. Pick a network above to connect one."
      />
    </Box>
  );
}
