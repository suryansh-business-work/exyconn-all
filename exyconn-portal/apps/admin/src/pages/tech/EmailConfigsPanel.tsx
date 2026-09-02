import { useState } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import SendIcon from '@mui/icons-material/Send';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useCrudResource } from '@exyconn/crud';
import {
  useListEmailConfigsQuery,
  useDeleteEmailConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { EmailConfigForm, type EmailConfigRow } from './forms/email-config';
import { SendTestEmailForm } from './forms/send-test-email';

/** Tech sub-panel: manage SMTP/email configurations (DB-backed). */
export function EmailConfigsPanel() {
  const { data, loading, refetch } = useListEmailConfigsQuery();
  const [deleteConfig] = useDeleteEmailConfigMutation();
  const [testTarget, setTestTarget] = useState<EmailConfigRow | null>(null);
  const crud = useCrudResource<EmailConfigRow>({
    label: 'Email config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete email config "${row.label}"?`,
    refetch,
  });

  const rows = data?.listEmailConfigs ?? [];

  const actions: RowAction<EmailConfigRow>[] = [
    {
      icon: <SendIcon fontSize="small" />,
      tooltip: 'Send test email',
      ariaLabel: 'send test email',
      color: 'primary',
      onClick: setTestTarget,
    },
  ];

  const columns: Column<EmailConfigRow>[] = [
    { key: 'label', label: 'Label' },
    { key: 'host', label: 'Host' },
    { key: 'fromAddress', label: 'From' },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Email configurations"
        subtitle="SMTP accounts used for outgoing email"
        actionLabel="New email config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage={loading ? 'Loading…' : 'No email configs yet.'}
      />
      <CrudDialog
        open={crud.open}
        title={crud.editing ? 'Edit email config' : 'New email config'}
        onClose={crud.close}
      >
        <EmailConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudDialog>
      <CrudDialog
        open={Boolean(testTarget)}
        title="Send test email"
        onClose={() => setTestTarget(null)}
      >
        {testTarget && (
          <SendTestEmailForm
            configId={testTarget.id}
            configLabel={testTarget.label}
            defaultTo={testTarget.fromAddress}
            onCancel={() => setTestTarget(null)}
            onDone={() => setTestTarget(null)}
          />
        )}
      </CrudDialog>
    </Box>
  );
}
