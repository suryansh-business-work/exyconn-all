import { useFormatters, useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  McpEndpoint,
  useMcpConnectionsQuery,
  useRevokeMcpConnectionMutation,
  type McpConnectionsQuery,
} from '@exyconn/shell/graphql/generated';

type ConnectionRow = McpConnectionsQuery['mcpConnections'][number];

/**
 * Every Claude connected to one server in this company, with who it acts for and whether it may
 * change anything or only read, and signing one out. On the global server, every connection the person may see, each naming its server.
 */
export function McpConnectionsTab({ endpoint }: Readonly<{ endpoint: McpEndpoint }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const confirm = useConfirm();
  const notify = useNotify();
  const { data, loading, error, refetch } = useMcpConnectionsQuery({
    variables: { endpoint },
    fetchPolicy: 'cache-and-network',
  });
  const [revoke] = useRevokeMcpConnectionMutation();
  const columns: Column<ConnectionRow>[] = [
    { key: 'clientName', label: 'Client' },
    { key: 'userName', label: 'Acts for' },
    {
      key: 'readOnly',
      label: 'Access',
      render: (row: ConnectionRow) => (row.readOnly ? t('Read only') : t('Read and change')),
    },
    ...(endpoint === McpEndpoint.All
      ? [{ key: 'endpoint', label: 'Server', render: (row: ConnectionRow) => row.endpoint }]
      : []),
    { key: 'createdAt', label: 'Connected', render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'lastUsedAt',
      label: 'Last used',
      render: (row) => (row.lastUsedAt ? formatDateTime(row.lastUsedAt) : '—'),
    },
  ];

  const signOut = async (row: ConnectionRow) => {
    const ok = await confirm({
      title: 'Sign this connection out?',
      message: '{client} acting for {name} loses access at once, and has to connect again.',
      messageValues: { client: row.clientName, name: row.userName },
      confirmText: 'Sign out',
      destructive: true,
    });
    if (!ok) return;
    try {
      await revoke({ variables: { id: row.id }, refetchQueries: ['McpServers'] });
      notify('Connection signed out', 'success');
      await refetch();
    } catch (err) {
      notify(errorMessage(err, 'Could not sign the connection out'), 'error');
    }
  };

  const actions: RowAction<ConnectionRow>[] = [
    {
      icon: <LinkOffIcon fontSize="small" />,
      tooltip: 'Sign out',
      ariaLabel: 'Sign this connection out',
      color: 'error',
      onClick: signOut,
    },
  ];

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  return (
    <DataTable
      columns={columns}
      rows={data?.mcpConnections ?? []}
      actions={actions}
      loading={loading}
      onRefresh={refetch}
      emptyMessage="Nobody has connected Claude yet."
    />
  );
}
