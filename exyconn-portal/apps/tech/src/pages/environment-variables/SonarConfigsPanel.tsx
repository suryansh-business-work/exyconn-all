import { Box } from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useCrudResource } from '@exyconn/crud';
import {
  useListSonarConfigsQuery,
  useDeleteSonarConfigMutation,
  useTestSonarConnectionMutation,
} from '@exyconn/shell/graphql/generated';
import { SonarConfigForm, type SonarConfigRow } from './forms/sonar-config';
import { maskedSecret } from './secret';

const COLUMNS: Column<SonarConfigRow>[] = [
  { key: 'label', label: 'Label' },
  { key: 'hostUrl', label: 'Server' },
  { key: 'projectKey', label: 'Project key' },
  { key: 'organization', label: 'Organization', render: (r) => r.organization || '—' },
  { key: 'token', label: 'Token', render: (r) => maskedSecret(r.hasToken, r.tokenHint) },
  {
    key: 'isActive',
    label: 'Active',
    render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
  },
];

/** Environment Variables sub-panel: the SonarQube project Tech › Security › SonarQube reads. */
export function SonarConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useListSonarConfigsQuery();
  const [deleteConfig] = useDeleteSonarConfigMutation();
  const [testConnection] = useTestSonarConnectionMutation();
  const crud = useCrudResource<SonarConfigRow>({
    label: 'SonarQube config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete SonarQube config "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const test = async (row: SonarConfigRow) => {
    try {
      const result = await testConnection({ variables: { id: row.id } });
      const outcome = result.data?.testSonarConnection;
      if (outcome) {
        notify(outcome.message, outcome.ok ? 'success' : 'error');
      }
    } catch (err) {
      notify(errorMessage(err, 'Connection failed'), 'error');
    }
  };

  const actions: RowAction<SonarConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test connection',
      ariaLabel: 'test sonarqube connection',
      color: 'primary',
      onClick: test,
    },
  ];

  if (crud.open) {
    const formTitle = crud.editing ? 'Edit SonarQube config' : 'New SonarQube config';
    return (
      <CrudFormPage title={formTitle} onBack={crud.close} backLabel="Back to SonarQube">
        <SonarConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="SonarQube"
        subtitle="The server, token and project the Security › SonarQube screen reads"
        actionLabel="New SonarQube config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={COLUMNS}
        rows={data?.listSonarConfigs ?? []}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No SonarQube configs yet."
        loading={!data && loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
