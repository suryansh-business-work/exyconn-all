import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useCrudResource } from '@exyconn/crud';
import {
  useDeleteEmailVerifierConfigMutation,
  useEmailVerifierConfigsQuery,
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
  const { data, loading, refetch } = useEmailVerifierConfigsQuery();
  const [deleteConfig] = useDeleteEmailVerifierConfigMutation();
  const crud = useCrudResource<EmailVerifierConfigRow>({
    label: 'Email verifier config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete email verifier config "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

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
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No proxy yet: checks run without one."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
