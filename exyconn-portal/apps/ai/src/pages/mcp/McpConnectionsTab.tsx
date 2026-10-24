import { useFormatters } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useMcpConnectionsQuery,
  useRevokeMcpConnectionMutation,
  type McpConnectionsQuery,
} from '@exyconn/shell/graphql/generated';

type ConnectionRow = McpConnectionsQuery['mcpConnections'][number];

/** Every Claude connected to this company's CRM, with who it acts for, and signing one out. */
export function McpConnectionsTab() {
  const { formatDateTime } = useFormatters();
  const confirm = useConfirm();
  const notify = useNotify();
  const { data, loading, error, refetch } = useMcpConnectionsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [revoke] = useRevokeMcpConnectionMutation();
  const columns: Column<ConnectionRow>[] = [
    { key: 'clientName', label: 'Client' },
    { key: 'userName', label: 'Acts for' },
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
      await revoke({ variables: { id: row.id } });
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
