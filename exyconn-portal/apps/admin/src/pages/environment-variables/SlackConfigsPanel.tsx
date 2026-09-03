import { useState } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import SendIcon from '@mui/icons-material/Send';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useCrudResource } from '@exyconn/crud';
import {
  useListSlackConfigsQuery,
  useDeleteSlackConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { SlackConfigForm, type SlackConfigRow } from './forms/slack-config';
import { SendTestSlackForm } from './forms/send-test-slack';

/** Shows only the token's prefix — the full secret never needs to be read back on screen. */
const maskToken = (token: string) => `${token.slice(0, 9)}…`;

/** Environment Variables sub-panel: manage Slack workspace credentials (DB-backed). */
export function SlackConfigsPanel() {
  const { data, loading, refetch } = useListSlackConfigsQuery();
  const [deleteConfig] = useDeleteSlackConfigMutation();
  const [testTarget, setTestTarget] = useState<SlackConfigRow | null>(null);
  const crud = useCrudResource<SlackConfigRow>({
    label: 'Slack config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete Slack config "${row.label}"?`,
    refetch,
  });

  const rows = data?.listSlackConfigs ?? [];

  const actions: RowAction<SlackConfigRow>[] = [
    {
      icon: <SendIcon fontSize="small" />,
      tooltip: 'Send test message',
      ariaLabel: 'send test slack message',
      color: 'primary',
      onClick: setTestTarget,
    },
  ];

  const columns: Column<SlackConfigRow>[] = [
    { key: 'label', label: 'Label' },
    { key: 'defaultChannel', label: 'Default channel' },
    { key: 'botToken', label: 'Bot token', render: (r) => maskToken(r.botToken) },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Slack configurations"
        subtitle="Bot credentials used for outgoing Slack notifications"
        actionLabel="New Slack config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage={loading ? 'Loading…' : 'No Slack configs yet.'}
      />
      <CrudDialog
        open={crud.open}
        title={crud.editing ? 'Edit Slack config' : 'New Slack config'}
        onClose={crud.close}
      >
        <SlackConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudDialog>
      <CrudDialog
        open={Boolean(testTarget)}
        title="Send test message"
        onClose={() => setTestTarget(null)}
      >
        {testTarget && (
          <SendTestSlackForm
            configId={testTarget.id}
            configLabel={testTarget.label}
            defaultChannel={testTarget.defaultChannel}
            onCancel={() => setTestTarget(null)}
            onDone={() => setTestTarget(null)}
          />
        )}
      </CrudDialog>
    </Box>
  );
}
