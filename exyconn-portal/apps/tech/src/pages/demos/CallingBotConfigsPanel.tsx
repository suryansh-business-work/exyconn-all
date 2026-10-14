import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudResource } from '@exyconn/crud';
import {
  useCallingBotConfigsQuery,
  useDeleteCallingBotConfigMutation,
  useTestCallingBotConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { maskedSecret } from '../environment-variables/secret';
import { CallingBotConfigForm, type CallingBotConfigRow } from './forms/calling-bot-config';

const COLUMNS: Column<CallingBotConfigRow>[] = [
  { key: 'label', label: 'Label' },
  { key: 'languageCode', label: 'Language' },
  { key: 'ttsSpeaker', label: 'Voice' },
  { key: 'openAiModel', label: 'Model' },
  {
    key: 'sarvamApiKey',
    label: 'Sarvam key',
    render: (r) => maskedSecret(r.hasSarvamApiKey, r.sarvamApiKeyHint),
  },
  {
    key: 'phoneEnabled',
    label: 'Phone calls',
    render: (r) => <StatusChip value={r.phoneEnabled ? 'ACTIVE' : 'INACTIVE'} />,
  },
  {
    key: 'isActive',
    label: 'Active',
    render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
  },
];

/**
 * Tech > Demos > Calling bot > Settings: the Sarvam AI and OpenAI keys, the bot's prompt and
 * voice, and the Vobiz account that rings real phones. One config is active at a time.
 */
export function CallingBotConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useCallingBotConfigsQuery();
  const [deleteConfig] = useDeleteCallingBotConfigMutation();
  const [testConfig] = useTestCallingBotConfigMutation();
  const crud = useCrudResource<CallingBotConfigRow>({
    label: 'Calling bot config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete calling bot config "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const test = async (row: CallingBotConfigRow) => {
    try {
      await testConfig({ variables: { id: row.id } });
      notify('OpenAI and Sarvam AI accepted "{label}"', 'success', { label: row.label });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Connection failed', 'error');
    }
  };

  const actions: RowAction<CallingBotConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test the keys',
      ariaLabel: 'test calling bot keys',
      color: 'primary',
      onClick: test,
    },
  ];

  if (crud.open) {
    const title = crud.editing ? 'Edit calling bot config' : 'New calling bot config';
    return (
      <CrudFormPage title={title} onBack={crud.close} backLabel="Back to Calling bot">
        <CallingBotConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Calling bot"
        subtitle="Keys, prompt and voice of the AI calling bot at demos.exyconn.com/calling-bot-demo"
        actionLabel="New calling bot config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={COLUMNS}
        rows={data?.callingBotConfigs ?? []}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No calling bot config yet."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
