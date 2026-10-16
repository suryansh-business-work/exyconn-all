import { Box } from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudResource } from '@exyconn/crud';
import {
  useDeleteGoogleMapsConfigMutation,
  useGoogleMapsConfigsQuery,
  useTestGoogleMapsConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { maskedSecret } from './secret';
import { GoogleMapsConfigForm, type GoogleMapsConfigRow } from './forms/google-maps-config';

const COLUMNS: Column<GoogleMapsConfigRow>[] = [
  { key: 'label', label: 'Label' },
  {
    key: 'hasBrowserKey',
    label: 'Browser key',
    render: (r) => maskedSecret(r.hasBrowserKey, r.browserKeyHint),
  },
  {
    key: 'hasServerKey',
    label: 'Places server key',
    render: (r) => maskedSecret(r.hasServerKey, r.serverKeyHint),
  },
  {
    key: 'isActive',
    label: 'Active',
    render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
  },
];

/**
 * Environment Variables > Google Maps: the keys behind CRM > Tools > Lead generator (Places
 * search, server key) and the maps on CRM companies and contacts (Maps JavaScript, browser key).
 */
export function GoogleMapsConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useGoogleMapsConfigsQuery();
  const [deleteConfig] = useDeleteGoogleMapsConfigMutation();
  const [testConfig] = useTestGoogleMapsConfigMutation();
  const crud = useCrudResource<GoogleMapsConfigRow>({
    label: 'Google Maps config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete Google Maps config "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const test = async (row: GoogleMapsConfigRow) => {
    try {
      const { data: result } = await testConfig({ variables: { id: row.id } });
      notify(result?.testGoogleMapsConfig ?? 'Google Places accepted the key', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Connection failed', 'error');
    }
  };

  const actions: RowAction<GoogleMapsConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test Places key',
      ariaLabel: 'test google places key',
      color: 'primary',
      hidden: (row) => !row.hasServerKey,
      onClick: test,
    },
  ];

  if (crud.open) {
    const title = crud.editing ? 'Edit Google Maps config' : 'New Google Maps config';
    return (
      <CrudFormPage title={title} onBack={crud.close} backLabel="Back to Google Maps">
        <GoogleMapsConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Google Maps"
        subtitle="Places search for the CRM lead generator, and the maps on CRM companies and contacts"
        actionLabel="New Google Maps config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={COLUMNS}
        rows={data?.googleMapsConfigs ?? []}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No Google Maps keys yet: the lead generator and CRM maps are off."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
