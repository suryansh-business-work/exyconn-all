import { Box } from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudResource } from '@exyconn/crud';
import {
  useListCloudflareConfigsQuery,
  useDeleteCloudflareConfigMutation,
  useTestCloudflareConnectionMutation,
} from '@exyconn/shell/graphql/generated';
import { CloudflareConfigForm, type CloudflareConfigRow } from './forms/cloudflare-config';
import { maskedSecret } from './secret';

/**
 * Environment Variables sub-panel: the Cloudflare API token and account behind Tech >
 * Security > Cloudflare — each domain's zone, its records and its assigned nameservers.
 */
export function CloudflareConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useListCloudflareConfigsQuery();
  const [deleteConfig] = useDeleteCloudflareConfigMutation();
  const [testConnection] = useTestCloudflareConnectionMutation();
  const crud = useCrudResource<CloudflareConfigRow>({
    label: 'Cloudflare config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete Cloudflare config "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const rows = data?.listCloudflareConfigs ?? [];

  const test = async (row: CloudflareConfigRow) => {
    try {
      await testConnection({ variables: { id: row.id } });
      notify('Cloudflare accepted the token on "{label}"', 'success', { label: row.label });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Connection failed', 'error');
    }
  };

  const actions: RowAction<CloudflareConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test connection',
      ariaLabel: 'test cloudflare connection',
      color: 'primary',
      onClick: test,
    },
  ];

  const columns: Column<CloudflareConfigRow>[] = [
    { key: 'label', label: 'Label' },
    { key: 'accountId', label: 'Account ID' },
    {
      key: 'apiToken',
      label: 'API token',
      render: (r) => maskedSecret(r.hasApiToken, r.apiTokenHint),
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  if (crud.open) {
    const formTitle = crud.editing ? 'Edit Cloudflare config' : 'New Cloudflare config';
    return (
      <CrudFormPage title={formTitle} onBack={crud.close} backLabel="Back to Cloudflare">
        <CloudflareConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Cloudflare"
        subtitle="The API token and account the domains' Cloudflare zones and records are managed with"
        actionLabel="New Cloudflare config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No Cloudflare configs yet."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
