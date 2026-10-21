import { useT } from '@exyconn/i18n';
import { Divider, Stack, Text } from '@exyconn/shell/components/ui';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useClientContactsQuery,
  useDeleteClientContactMutation,
  useSetClientContactActiveMutation,
} from '@exyconn/shell/graphql/generated';
import { ClientContactForm, type ClientContactRow } from './forms/client-contact';

interface ClientHubAccessPanelProps {
  clientId: string;
}

/**
 * Who at the client may sign in to the client hub, when they last did, and a way to give or
 * take access — taking it away signs them out at once. Shown in the Clients grid's key dialog
 * and on the client's own Contacts tab.
 */
export function ClientHubAccessPanel({ clientId }: Readonly<ClientHubAccessPanelProps>) {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDate } = useSettings();
  const { data, loading, refetch } = useClientContactsQuery({ variables: { clientId } });
  const [setActive] = useSetClientContactActiveMutation();
  const [deleteContact] = useDeleteClientContactMutation();

  const run = (work: () => Promise<unknown>, done: string) => {
    work()
      .then(() => {
        notify(done, 'success');
        return refetch();
      })
      .catch((error: unknown) => notify(errorMessage(error, t('Something went wrong')), 'error'));
  };

  const remove = async (row: ClientContactRow) => {
    const ok = await confirm({
      title: 'Remove access',
      message: 'Remove {email} from the client hub?',
      messageValues: { email: row.email },
      confirmText: 'Remove',
    });
    if (ok) {
      run(() => deleteContact({ variables: { id: row.id } }), t('Access removed'));
    }
  };

  const columns: Column<ClientContactRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'lastSignInAt',
      label: 'Last sign-in',
      render: (row) => (row.lastSignInAt ? formatDate(row.lastSignInAt) : t('Never')),
    },
    {
      key: 'active',
      label: 'Access',
      render: (row) => <StatusChip value={row.active ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  const actions: RowAction<ClientContactRow>[] = [
    {
      icon: <BlockIcon fontSize="small" />,
      tooltip: 'Switch access off',
      ariaLabel: 'switch client hub access off',
      color: 'warning',
      hidden: (row) => !row.active,
      onClick: (row) =>
        run(
          () => setActive({ variables: { id: row.id, active: false } }),
          t('Access switched off'),
        ),
    },
    {
      icon: <RestoreIcon fontSize="small" />,
      tooltip: 'Switch access back on',
      ariaLabel: 'switch client hub access on',
      color: 'success',
      hidden: (row) => row.active,
      onClick: (row) =>
        run(() => setActive({ variables: { id: row.id, active: true } }), t('Access restored')),
    },
  ];

  return (
    <Stack spacing={2}>
      <Text size="sm" color="text.secondary">
        {t(
          'People listed here sign in at the client hub with their email and a one-time code to pay invoices, raise tickets and follow projects.',
        )}
      </Text>
      <DataTable
        bulkEntity="ClientContact"
        columns={columns}
        rows={data?.clientContacts ?? []}
        actions={actions}
        onDelete={(row) => {
          remove(row).catch((error: unknown) => console.error(error));
        }}
        loading={loading}
        emptyMessage="Nobody at this client has access yet."
      />
      <Divider />
      <ClientContactForm clientId={clientId} onAdded={() => refetch()} />
    </Stack>
  );
}
