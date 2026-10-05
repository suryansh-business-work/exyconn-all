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
  useListStripeConfigsQuery,
  useDeleteStripeConfigMutation,
  useTestStripeConnectionMutation,
} from '@exyconn/shell/graphql/generated';
import { StripeConfigForm, type StripeConfigRow } from './forms/stripe-config';
import { maskedSecret } from './secret';

const COLUMNS: Column<StripeConfigRow>[] = [
  { key: 'label', label: 'Label' },
  {
    key: 'secretKey',
    label: 'Secret key',
    render: (r) => maskedSecret(r.hasSecretKey, r.secretKeyHint),
  },
  {
    key: 'webhookSecret',
    label: 'Webhook secret',
    render: (r) => maskedSecret(r.hasWebhookSecret, r.webhookSecretHint),
  },
  {
    key: 'isActive',
    label: 'Active',
    render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
  },
];

/**
 * Environment Variables sub-panel: Exyconn's Stripe account, which clients pay invoices by
 * card through in the client hub. The webhook confirms each payment on the invoice.
 */
export function StripeConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useListStripeConfigsQuery();
  const [deleteConfig] = useDeleteStripeConfigMutation();
  const [testConnection] = useTestStripeConnectionMutation();
  const crud = useCrudResource<StripeConfigRow>({
    label: 'Stripe account',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete Stripe account "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const test = async (row: StripeConfigRow) => {
    try {
      await testConnection({ variables: { id: row.id } });
      notify('Stripe accepted the key on "{label}"', 'success', { label: row.label });
    } catch (err) {
      notify(errorMessage(err, 'Connection failed'), 'error');
    }
  };

  const actions: RowAction<StripeConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test connection',
      ariaLabel: 'test stripe connection',
      color: 'primary',
      onClick: test,
    },
  ];

  if (crud.open) {
    return (
      <CrudFormPage
        title={crud.editing ? 'Edit Stripe account' : 'New Stripe account'}
        onBack={crud.close}
        backLabel="Back to Stripe"
      >
        <StripeConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Stripe"
        subtitle="Card payments for invoices in the client hub"
        actionLabel="New Stripe account"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={COLUMNS}
        rows={data?.listStripeConfigs ?? []}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No Stripe account yet."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
