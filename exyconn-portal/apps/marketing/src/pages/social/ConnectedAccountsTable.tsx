import { useT } from '@exyconn/i18n';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import SyncIcon from '@mui/icons-material/Sync';
import { Box, Switch, Text, Tooltip } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { Account, useSocialAccounts } from './useSocialAccounts';
import { AccountNameCell } from './AccountNameCell';
import { NetworkIcon } from './NetworkIcon';
import { accountLabel } from './social.labels';

type Accounts = ReturnType<typeof useSocialAccounts>;

/** The connected accounts: when each was last read, why a read failed, and what to do next. */
export function ConnectedAccountsTable({ social }: Readonly<{ social: Accounts }>) {
  const t = useT();
  const { formatDate, formatDateTime } = useSettings();
  const columns: Column<Account>[] = [
    {
      key: 'network',
      label: 'Network',
      render: (r) => <NetworkIcon network={r.network} label={accountLabel(r)} />,
    },
    { key: 'name', label: 'Account', render: (r) => <AccountNameCell account={r} /> },
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
      key: 'active',
      // A page its member no longer administers has nothing to turn back on.
      hidden: (row) => Boolean(row.disconnectedAt),
      render: (row) => (
        <Tooltip
          title={row.active ? t('Active — switch off to pause') : t('Paused — switch on to resume')}
        >
          <Switch
            size="small"
            checked={row.active}
            onChange={(_event, checked) => {
              social
                .setActive(row, checked)
                .catch((error: unknown) => portalLogger.error('Pausing an account failed', error));
            }}
            slotProps={{
              input: { 'aria-label': t('Active: {name}', { name: accountLabel(row) }) },
            }}
          />
        </Tooltip>
      ),
    },
    {
      icon: <SyncIcon fontSize="small" />,
      tooltip: 'Sync posts now',
      ariaLabel: 'sync account',
      onClick: (row) => {
        social.sync(row.id).catch((error: unknown) => portalLogger.error('Sync failed', error));
      },
      hidden: (row) => social.syncing !== null || !row.active || Boolean(row.disconnectedAt),
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
