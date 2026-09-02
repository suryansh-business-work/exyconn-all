import { Box, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@exyconn/shell/graphql/generated';

type Row = {
  id: string;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

/** Employee self-service: the notification centre. */
export function NotificationsPage() {
  const { data, loading, refetch } = useMyNotificationsQuery({ fetchPolicy: 'cache-and-network' });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const { formatDate } = useSettings();
  const notify = useNotify();
  const rows = (data?.myNotifications ?? []) as Row[];
  const unread = rows.filter((r) => !r.read).length;

  const readAll = async () => {
    const { data: result } = await markAllRead();
    notify(`Marked ${result?.markAllNotificationsRead ?? 0} as read.`, 'success');
    await refetch();
  };

  const columns: Column<Row>[] = [
    {
      key: 'title',
      label: 'Notification',
      render: (n) => <Text weight={n.read ? 'regular' : 'medium'}>{n.title}</Text>,
    },
    { key: 'kind', label: 'Type', render: (n) => <StatusChip value={n.kind} /> },
    { key: 'body', label: 'Details', render: (n) => n.body || '—' },
    { key: 'createdAt', label: 'When', render: (n) => formatDate(n.createdAt) },
    {
      key: 'read',
      label: '',
      render: (n) =>
        n.read ? (
          <Text size="caption" color="text.secondary">
            Read
          </Text>
        ) : (
          <Button
            size="small"
            onClick={async () => {
              await markRead({ variables: { id: n.id } });
              await refetch();
            }}
          >
            Mark read
          </Button>
        ),
    },
  ];

  return (
    <Box>
      <Flex direction="row" justifyContent="space-between" alignItems="center">
        <PageHeader
          title="Notifications"
          subtitle={unread > 0 ? `${unread} unread` : 'You are all caught up'}
        />
        {unread > 0 && <Button onClick={readAll}>Mark all read</Button>}
      </Flex>
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? 'Loading…' : 'Nothing here yet.'}
        />
      </Box>
    </Box>
  );
}
