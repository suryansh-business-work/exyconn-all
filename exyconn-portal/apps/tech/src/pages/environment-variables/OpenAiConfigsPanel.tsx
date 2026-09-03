import { Box } from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudResource } from '@exyconn/crud';
import {
  useListOpenAiConfigsQuery,
  useDeleteOpenAiConfigMutation,
  useTestOpenAiConnectionMutation,
} from '@exyconn/shell/graphql/generated';
import { OpenAiConfigForm, type OpenAiConfigRow } from './forms/openai-config';

/** Shows only the key's prefix — the full secret never needs to be read back on screen. */
const maskKey = (key: string) => `${key.slice(0, 8)}…`;

/**
 * Environment Variables sub-panel: the OpenAI key and model the platform's AI features
 * run on. Testing a config asks OpenAI for that model, so a key that cannot reach the
 * model it names fails here rather than on the first real request.
 */
export function OpenAiConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useListOpenAiConfigsQuery();
  const [deleteConfig] = useDeleteOpenAiConfigMutation();
  const [testConnection] = useTestOpenAiConnectionMutation();
  const crud = useCrudResource<OpenAiConfigRow>({
    label: 'OpenAI config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete OpenAI config "${row.label}"?`,
    refetch,
  });

  const rows = data?.listOpenAiConfigs ?? [];

  const test = async (row: OpenAiConfigRow) => {
    try {
      await testConnection({ variables: { id: row.id } });
      notify(`OpenAI accepted the key on "${row.label}" for ${row.defaultModel}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Connection failed', 'error');
    }
  };

  const actions: RowAction<OpenAiConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test API key',
      ariaLabel: 'test openai api key',
      color: 'primary',
      onClick: test,
    },
  ];

  const columns: Column<OpenAiConfigRow>[] = [
    { key: 'label', label: 'Label' },
    { key: 'apiKey', label: 'API key', render: (r) => maskKey(r.apiKey) },
    { key: 'defaultModel', label: 'Model' },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="OpenAI"
        subtitle="The API key and model the platform's AI features run on"
        actionLabel="New OpenAI config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage={loading ? 'Loading…' : 'No OpenAI configs yet.'}
      />
      <CrudDialog
        open={crud.open}
        title={crud.editing ? 'Edit OpenAI config' : 'New OpenAI config'}
        onClose={crud.close}
      >
        <OpenAiConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudDialog>
    </Box>
  );
}
