import { Box } from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudResource } from '@exyconn/crud';
import {
  useDeleteEmailVerifierConfigMutation,
  useEmailVerifierConfigsQuery,
  useTestEmailVerifierConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { maskedSecret } from './secret';
import {
  EmailVerifierConfigForm,
  type EmailVerifierConfigRow,
} from './forms/email-verifier-config';

const COLUMNS: Column<EmailVerifierConfigRow>[] = [
  { key: 'label', label: 'Label' },
  {
    key: 'proxyHost',
    label: 'Proxy',
    render: (r) => (r.proxyHost ? `${r.proxyHost}:${r.proxyPort}` : '—'),
  },
  { key: 'proxyUsername', label: 'Username', render: (r) => r.proxyUsername || '—' },
  { key: 'hasProxyPassword', label: 'Password', render: (r) => maskedSecret(r.hasProxyPassword) },
  {
    key: 'isActive',
    label: 'Active',
    render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
  },
];

/**
 * Environment Variables > Email verifier: the SOCKS5 proxy CRM > Tools > Email verifier checks
 * mailboxes through. Checking a mailbox needs port 25, which this server's host blocks outbound;
 * without a proxy most addresses come back "unknown".
 */
export function EmailVerifierConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useEmailVerifierConfigsQuery();
  const [deleteConfig] = useDeleteEmailVerifierConfigMutation();
  const [testConfig] = useTestEmailVerifierConfigMutation();
  const crud = useCrudResource<EmailVerifierConfigRow>({
    label: 'Email verifier config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete email verifier config "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const test = async (row: EmailVerifierConfigRow) => {
    try {
      const { data: result } = await testConfig({ variables: { id: row.id } });
      notify(result?.testEmailVerifierConfig ?? 'The proxy answered', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Connection failed', 'error');
    }
  };

  const actions: RowAction<EmailVerifierConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test proxy',
      ariaLabel: 'test email verifier proxy',
      color: 'primary',
      hidden: (row) => !row.proxyHost,
      onClick: test,
    },
  ];

  if (crud.open) {
    const title = crud.editing ? 'Edit email verifier config' : 'New email verifier config';
    return (
      <CrudFormPage title={title} onBack={crud.close} backLabel="Back to Email verifier">
        <EmailVerifierConfigForm
          initial={crud.editing}
          onCancel={crud.close}
          onDone={crud.onDone}
        />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Email verifier"
        subtitle="The SOCKS5 proxy CRM email checks reach mail servers through (port 25)"
        actionLabel="New email verifier config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={COLUMNS}
        rows={data?.emailVerifierConfigs ?? []}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No proxy yet: checks run without one."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
