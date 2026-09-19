import { useCallback, useState } from 'react';
import { useT } from '@exyconn/i18n';
import DeleteIcon from '@mui/icons-material/LinkOff';
import { Box, Grid, Heading, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useDisconnectSocialAccountMutation,
  useSocialAccountsQuery,
  useSocialAppStatusesQuery,
  useStartSocialConnectMutation,
  type SocialAccountsQuery,
  type SocialApp,
} from '@exyconn/shell/graphql/generated';
import { ProviderCard } from './ProviderCard';
import { useConnectOutcome } from './useConnectOutcome';

type Account = SocialAccountsQuery['socialAccounts'][number];

/** Marketing › Social accounts: connect the company's LinkedIn, Meta, X and YouTube accounts. */
export function SocialAccountsPage() {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDate } = useSettings();
  const providers = useSocialAppStatusesQuery({ fetchPolicy: 'cache-and-network' });
  const accounts = useSocialAccountsQuery({ fetchPolicy: 'cache-and-network' });
  const [startConnect] = useStartSocialConnectMutation();
  const [disconnect] = useDisconnectSocialAccountMutation();
  const [connecting, setConnecting] = useState<SocialApp | null>(null);

  const reload = useCallback(() => {
    accounts
      .refetch()
      .catch((error: unknown) => portalLogger.warn('Could not reload accounts', error));
  }, [accounts]);
  useConnectOutcome(reload);

  const connect = async (app: SocialApp) => {
    setConnecting(app);
    try {
      const { data } = await startConnect({ variables: { app } });
      // Off to the provider's consent page; it sends the browser back here when done.
      if (data) globalThis.location.assign(data.startSocialConnect);
    } catch (error) {
      setConnecting(null);
      notify(error instanceof Error ? error.message : 'Could not start the connection', 'error');
    }
  };

  const remove = async (row: Account) => {
    const ok = await confirm({
      message: 'Disconnect {name}? Posts already published stay where they are.',
      messageValues: { name: row.name },
      confirmText: 'Disconnect',
    });
    if (!ok) return;
    try {
      await disconnect({ variables: { id: row.id } });
      notify('Account disconnected');
      reload();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not disconnect', 'error');
    }
  };

  const columns: Column<Account>[] = [
    { key: 'network', label: 'Network', render: (r) => <StatusChip value={r.network} /> },
    { key: 'name', label: 'Account', render: (r) => <Text weight="medium">{r.name}</Text> },
    { key: 'handle', label: 'Handle', render: (r) => r.handle || '—' },
    { key: 'createdAt', label: 'Connected', render: (r) => formatDate(r.createdAt) },
    {
      key: 'expiresAt',
      label: 'Access until',
      render: (r) => (r.expiresAt ? formatDate(r.expiresAt) : t('Does not expire')),
    },
  ];
  const actions: RowAction<Account>[] = [
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Disconnect',
      ariaLabel: 'disconnect account',
      color: 'error',
      onClick: (row) => {
        remove(row).catch((error: unknown) => portalLogger.error('Disconnect failed', error));
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Social accounts"
        subtitle="Connect the company's social accounts. You sign in on the network's own page — Exyconn never sees the password."
      />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(providers.data?.socialAppStatuses ?? []).map((provider) => (
          <Grid key={provider.app} size={{ xs: 12, sm: 6, md: 3 }}>
            <ProviderCard
              provider={provider}
              connecting={connecting === provider.app}
              onConnect={() => {
                connect(provider.app).catch((error: unknown) =>
                  portalLogger.error('Starting a social connection failed', error),
                );
              }}
            />
          </Grid>
        ))}
      </Grid>
      <Heading level={6} sx={{ mb: 1 }}>
        {t('Connected accounts')}
      </Heading>
      <Box sx={densePanel}>
        <DataTable
          columns={columns}
          rows={[...(accounts.data?.socialAccounts ?? [])]}
          actions={actions}
          loading={accounts.loading || providers.loading}
          onRefresh={accounts.refetch}
          emptyMessage="No accounts connected yet. Pick a network above to connect one."
        />
      </Box>
    </Box>
  );
}
