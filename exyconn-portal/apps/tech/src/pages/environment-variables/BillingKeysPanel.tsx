import { Box } from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudResource } from '@exyconn/crud';
import {
  useBillingKeyConfigsQuery,
  useDeleteBillingKeyConfigMutation,
  useTestBillingKeyConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { maskedSecret } from '@exyconn/shell/utils/secret';
import { BillingKeyConfigForm, type BillingKeyConfigRow } from './forms/billing-key-config';

const COLUMNS: Column<BillingKeyConfigRow>[] = [
  { key: 'label', label: 'Label' },
  { key: 'provider', label: 'Provider', render: (r) => <StatusChip value={r.provider} /> },
  { key: 'hasKey', label: 'Key', render: (r) => <>{maskedSecret(r.hasKey, r.keyHint)}</> },
  {
    key: 'isActive',
    label: 'Active',
    render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
  },
];

/**
 * Environment Variables > Billing keys: the extra keys that read what a provider actually billed
 * (OpenAI's Admin key), shown on the dashboard and on the provider's own page.
 */
export function BillingKeysPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useBillingKeyConfigsQuery();
  const [deleteConfig] = useDeleteBillingKeyConfigMutation();
  const [testConfig] = useTestBillingKeyConfigMutation();
  const crud = useCrudResource<BillingKeyConfigRow>({
    label: 'Billing key',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete billing key "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const test = async (row: BillingKeyConfigRow) => {
    try {
      const { data: result } = await testConfig({ variables: { id: row.id } });
      notify(result?.testBillingKeyConfig ?? 'The billing key works', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Connection failed', 'error');
    }
  };

  const actions: RowAction<BillingKeyConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test billing key',
      ariaLabel: 'test billing key',
      color: 'primary',
      onClick: test,
    },
  ];

  if (crud.open) {
    const title = crud.editing ? 'Edit billing key' : 'New billing key';
    return (
      <CrudFormPage title={title} onBack={crud.close} backLabel="Back to Billing keys">
        <BillingKeyConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Billing keys"
        subtitle="Extra keys that read what a provider actually billed. Kept apart from the keys the platform calls the provider with, and sealed at rest."
        actionLabel="New billing key"
        onAction={crud.openCreate}
      />
      <DataTable
        bulkEntity="BillingKeyConfig"
        columns={COLUMNS}
        rows={data?.billingKeyConfigs ?? []}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No billing key yet: dashboards show the cost estimated from our own calls."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
