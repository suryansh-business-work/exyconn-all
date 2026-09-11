import { Box } from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { BoolChip } from '@exyconn/shell/components/data/BoolChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudResource } from '@exyconn/crud';
import {
  useListInboundMailConfigsQuery,
  useDeleteInboundMailConfigMutation,
  useTestInboundMailConnectionMutation,
} from '@exyconn/shell/graphql/generated';
import { InboundMailConfigForm, type InboundMailConfigRow } from './forms/inbound-mail-config';

/**
 * Environment Variables sub-panel: the mailbox the support desk reads. Mail arriving
 * there becomes a ticket, or a reply on the ticket whose reference it quotes.
 */
export function InboundMailConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useListInboundMailConfigsQuery();
  const [deleteConfig] = useDeleteInboundMailConfigMutation();
  const [testConnection] = useTestInboundMailConnectionMutation();
  const crud = useCrudResource<InboundMailConfigRow>({
    label: 'Inbound mail config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete inbound mailbox "${row.label}"?`,
    refetch,
  });

  const rows = data?.listInboundMailConfigs ?? [];

  const test = async (row: InboundMailConfigRow) => {
    try {
      await testConnection({ variables: { id: row.id } });
      notify(`Signed in to ${row.host} and opened ${row.mailbox}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Connection failed', 'error');
    }
  };

  const actions: RowAction<InboundMailConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test connection',
      ariaLabel: 'test inbound mail connection',
      color: 'primary',
      onClick: test,
    },
  ];

  const columns: Column<InboundMailConfigRow>[] = [
    { key: 'label', label: 'Label' },
    { key: 'host', label: 'Host', render: (r) => `${r.host}:${r.port}` },
    { key: 'user', label: 'Username' },
    { key: 'mailbox', label: 'Mailbox' },
    { key: 'pollSeconds', label: 'Read every', render: (r) => `${r.pollSeconds}s` },
    {
      key: 'deleteAfterImport',
      label: 'Deletes',
      render: (r) => <BoolChip value={r.deleteAfterImport} />,
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  if (crud.open) {
    return (
      <CrudFormPage
        title={crud.editing ? 'Edit inbound mailbox' : 'New inbound mailbox'}
        onBack={crud.close}
        backLabel="Back to Inbound mail"
      >
        <InboundMailConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Inbound mail"
        subtitle="The IMAP mailbox support tickets arrive in"
        actionLabel="New inbound mailbox"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No inbound mailboxes yet."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
