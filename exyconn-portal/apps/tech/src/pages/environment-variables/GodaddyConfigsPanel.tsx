import { Box } from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudResource } from '@exyconn/crud';
import {
  useListGodaddyConfigsQuery,
  useDeleteGodaddyConfigMutation,
  useTestGodaddyConnectionMutation,
} from '@exyconn/shell/graphql/generated';
import { GodaddyConfigForm, type GodaddyConfigRow } from './forms/godaddy-config';
import { maskedSecret } from './secret';

/**
 * Environment Variables sub-panel: the GoDaddy API key and secret behind Tech > Security >
 * Cloudflare — the domain list, each domain's DNS records and its nameservers.
 */
export function GodaddyConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useListGodaddyConfigsQuery();
  const [deleteConfig] = useDeleteGodaddyConfigMutation();
  const [testConnection] = useTestGodaddyConnectionMutation();
  const crud = useCrudResource<GodaddyConfigRow>({
    label: 'GoDaddy config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete GoDaddy config "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const rows = data?.listGodaddyConfigs ?? [];

  const test = async (row: GodaddyConfigRow) => {
    try {
      await testConnection({ variables: { id: row.id } });
      notify('GoDaddy accepted the key on "{label}"', 'success', { label: row.label });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Connection failed', 'error');
    }
  };

  const actions: RowAction<GodaddyConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test connection',
      ariaLabel: 'test godaddy connection',
      color: 'primary',
      onClick: test,
    },
  ];

  const columns: Column<GodaddyConfigRow>[] = [
    { key: 'label', label: 'Label' },
    { key: 'apiKey', label: 'API key', render: (r) => maskedSecret(r.hasApiKey, r.apiKeyHint) },
    { key: 'apiSecret', label: 'API secret', render: (r) => maskedSecret(r.hasApiSecret) },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  if (crud.open) {
    const formTitle = crud.editing ? 'Edit GoDaddy config' : 'New GoDaddy config';
    return (
      <CrudFormPage title={formTitle} onBack={crud.close} backLabel="Back to GoDaddy">
        <GodaddyConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="GoDaddy"
        subtitle="The registrar key that reads the domains and their DNS, and changes their nameservers"
        actionLabel="New GoDaddy config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No GoDaddy configs yet."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
