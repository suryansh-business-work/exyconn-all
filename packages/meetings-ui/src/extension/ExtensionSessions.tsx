import { useFormatters, useT } from '@exyconn/i18n';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { Box, Heading } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import {
  useMaMyExtensionSessionsQuery,
  useMaRevokeExtensionSessionMutation,
  type MaMyExtensionSessionsQuery,
} from '@exyconn/shell/graphql/generated';
import { LoadError } from '../lib/LoadError';
import { useRunNotified } from '../lib/useRunNotified';

type Session = MaMyExtensionSessionsQuery['maMyExtensionSessions'][number];

/** Every browser the viewer signed the extension into, and a way to sign one out. */
export function ExtensionSessions() {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const confirm = useConfirm();
  const runNotified = useRunNotified();
  const { data, loading, error, refetch } = useMaMyExtensionSessionsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [revokeSession] = useMaRevokeExtensionSessionMutation();
  const when = (value: string | null | undefined, empty: string) =>
    value ? formatDateTime(value) : t(empty);

  const revoke = async (session: Session) => {
    const ok = await confirm({
      title: 'Sign out this browser?',
      message: 'The extension on {device} stops working until it is signed in again.',
      messageValues: { device: session.deviceLabel },
      confirmText: 'Sign out',
      destructive: true,
    });
    if (ok) {
      await runNotified(
        () =>
          revokeSession({
            variables: { id: session.id },
            refetchQueries: ['MaMyExtensionSessions'],
          }),
        'Extension signed out',
      );
    }
  };

  const columns: Column<Session>[] = [
    { key: 'deviceLabel', label: 'Browser' },
    { key: 'extensionVersion', label: 'Version' },
    { key: 'createdAt', label: 'Signed in', render: (row) => formatDateTime(row.createdAt) },
    { key: 'lastSeenAt', label: 'Last seen', render: (row) => when(row.lastSeenAt, 'Never') },
    { key: 'expiresAt', label: 'Expires', render: (row) => formatDateTime(row.expiresAt) },
    { key: 'revokedAt', label: 'Signed out', render: (row) => when(row.revokedAt, 'Active') },
  ];
  const actions: RowAction<Session>[] = [
    {
      icon: <LinkOffIcon fontSize="small" />,
      tooltip: 'Sign out',
      ariaLabel: 'Sign out this browser',
      color: 'error',
      hidden: (row) => Boolean(row.revokedAt),
      onClick: revoke,
    },
  ];

  return (
    <Box sx={panel}>
      <Heading level={2} sx={{ typography: 'h6', mb: 1 }}>
        {t('Signed-in browsers')}
      </Heading>
      {error ? (
        <LoadError message={error.message} onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.maMyExtensionSessions ?? []}
          actions={actions}
          loading={loading && !data}
          onRefresh={() => refetch()}
          emptyMessage="The extension is not signed in anywhere yet."
        />
      )}
    </Box>
  );
}
