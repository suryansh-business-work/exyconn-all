import { Box } from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudResource } from '@exyconn/crud';
import {
  useListPexelsConfigsQuery,
  useDeletePexelsConfigMutation,
  useTestPexelsConnectionMutation,
} from '@exyconn/shell/graphql/generated';
import { PexelsConfigForm, type PexelsConfigRow } from './forms/pexels-config';
import { maskedSecret } from './secret';

/**
 * Environment Variables sub-panel: the Pexels API key behind the stock photo and
 * stock video tabs of the shared upload dialog.
 */
export function PexelsConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useListPexelsConfigsQuery();
  const [deleteConfig] = useDeletePexelsConfigMutation();
  const [testConnection] = useTestPexelsConnectionMutation();
  const crud = useCrudResource<PexelsConfigRow>({
    label: 'Pexels config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete Pexels config "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const rows = data?.listPexelsConfigs ?? [];

  const test = async (row: PexelsConfigRow) => {
    try {
      await testConnection({ variables: { id: row.id } });
      notify('Pexels accepted the key on "{label}"', 'success', { label: row.label });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Connection failed', 'error');
    }
  };

  const actions: RowAction<PexelsConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test API key',
      ariaLabel: 'test pexels api key',
      color: 'primary',
      onClick: test,
    },
  ];

  const columns: Column<PexelsConfigRow>[] = [
    { key: 'label', label: 'Label' },
    { key: 'apiKey', label: 'API key', render: (r) => maskedSecret(r.hasApiKey, r.apiKeyHint) },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  if (crud.open) {
    const formTitle = crud.editing ? 'Edit Pexels config' : 'New Pexels config';
    return (
      <CrudFormPage title={formTitle} onBack={crud.close} backLabel="Back to Pexels stock media">
        <PexelsConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Pexels stock media"
        subtitle="The API key behind the stock photo and video tabs of the upload dialog"
        actionLabel="New Pexels config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No Pexels configs yet."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
