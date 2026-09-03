import { Box } from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudResource } from '@exyconn/crud';
import {
  useListGithubConfigsQuery,
  useDeleteGithubConfigMutation,
  useTestGithubConnectionMutation,
} from '@exyconn/shell/graphql/generated';
import { GithubConfigForm, type GithubConfigRow } from './forms/github-config';

/** Shows only the token's prefix — the full secret never needs to be read back on screen. */
const maskToken = (token: string) => `${token.slice(0, 8)}…`;

/** Environment Variables sub-panel: the repository tracker builds are started in. */
export function GithubConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useListGithubConfigsQuery();
  const [deleteConfig] = useDeleteGithubConfigMutation();
  const [testConnection] = useTestGithubConnectionMutation();
  const crud = useCrudResource<GithubConfigRow>({
    label: 'GitHub config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete GitHub config "${row.label}"?`,
    refetch,
  });

  const rows = data?.listGithubConfigs ?? [];

  const test = async (row: GithubConfigRow) => {
    try {
      await testConnection({ variables: { id: row.id } });
      notify(`Reached ${row.owner}/${row.repo} and found the tracker workflow`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Connection failed', 'error');
    }
  };

  const actions: RowAction<GithubConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test connection',
      ariaLabel: 'test github connection',
      color: 'primary',
      onClick: test,
    },
  ];

  const columns: Column<GithubConfigRow>[] = [
    { key: 'label', label: 'Label' },
    { key: 'repo', label: 'Repository', render: (r) => `${r.owner}/${r.repo}` },
    { key: 'token', label: 'Token', render: (r) => maskToken(r.token) },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="GitHub repository"
        subtitle="Where tracker builds are started, and the token that starts them"
        actionLabel="New GitHub config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage={loading ? 'Loading…' : 'No GitHub configs yet.'}
      />
      <CrudDialog
        open={crud.open}
        title={crud.editing ? 'Edit GitHub config' : 'New GitHub config'}
        onClose={crud.close}
      >
        <GithubConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudDialog>
    </Box>
  );
}
