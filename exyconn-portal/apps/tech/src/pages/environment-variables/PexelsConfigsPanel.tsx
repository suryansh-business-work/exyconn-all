import { Box } from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudResource } from '@exyconn/crud';
import {
  useListPexelsConfigsQuery,
  useDeletePexelsConfigMutation,
  useTestPexelsConnectionMutation,
} from '@exyconn/shell/graphql/generated';
import { PexelsConfigForm, type PexelsConfigRow } from './forms/pexels-config';

/** Shows only the key's prefix — the full secret never needs to be read back on screen. */
const maskKey = (key: string) => `${key.slice(0, 8)}…`;

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
    confirmMessage: (row) => `Delete Pexels config "${row.label}"?`,
    refetch,
  });

  const rows = data?.listPexelsConfigs ?? [];

  const test = async (row: PexelsConfigRow) => {
    try {
      await testConnection({ variables: { id: row.id } });
      notify(`Pexels accepted the key on "${row.label}"`);
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
    { key: 'apiKey', label: 'API key', render: (r) => maskKey(r.apiKey) },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

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
        emptyMessage={loading ? 'Loading…' : 'No Pexels configs yet.'}
      />
      <CrudDialog
        open={crud.open}
        title={crud.editing ? 'Edit Pexels config' : 'New Pexels config'}
        onClose={crud.close}
      >
        <PexelsConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudDialog>
    </Box>
  );
}
