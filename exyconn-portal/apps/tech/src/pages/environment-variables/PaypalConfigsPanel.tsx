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
  useListPaypalConfigsQuery,
  useDeletePaypalConfigMutation,
  useTestPaypalConnectionMutation,
} from '@exyconn/shell/graphql/generated';
import { PaypalConfigForm, type PaypalConfigRow } from './forms/paypal-config';
import { maskedSecret } from './secret';
import { WebhookInfo } from './WebhookInfo';

/** What the PayPal webhook must be subscribed to for a payment to reach the invoice. */
const PAYPAL_EVENTS = [
  'CHECKOUT.ORDER.APPROVED',
  'PAYMENT.CAPTURE.COMPLETED',
  'PAYMENT.CAPTURE.DENIED',
  'CHECKOUT.ORDER.VOIDED',
] as const;

const COLUMNS: Column<PaypalConfigRow>[] = [
  { key: 'label', label: 'Label' },
  { key: 'clientId', label: 'Client id' },
  {
    key: 'clientSecret',
    label: 'Client secret',
    render: (r) => maskedSecret(r.hasClientSecret, r.clientSecretHint),
  },
  { key: 'webhookId', label: 'Webhook id' },
  { key: 'mode', label: 'Mode', render: (r) => <StatusChip value={r.mode} /> },
  {
    key: 'isActive',
    label: 'Active',
    render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
  },
];

/**
 * Environment Variables sub-panel: Exyconn's PayPal account, which clients pay invoices
 * through in the client hub. The webhook confirms each payment on the invoice.
 */
export function PaypalConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useListPaypalConfigsQuery();
  const [deleteConfig] = useDeletePaypalConfigMutation();
  const [testConnection] = useTestPaypalConnectionMutation();
  const crud = useCrudResource<PaypalConfigRow>({
    label: 'PayPal account',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete PayPal account "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const test = async (row: PaypalConfigRow) => {
    try {
      await testConnection({ variables: { id: row.id } });
      notify('PayPal accepted the credentials on "{label}"', 'success', { label: row.label });
    } catch (err) {
      notify(errorMessage(err, 'Connection failed'), 'error');
    }
  };

  const actions: RowAction<PaypalConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test connection',
      ariaLabel: 'test paypal connection',
      color: 'primary',
      onClick: test,
    },
  ];

  if (crud.open) {
    return (
      <CrudFormPage
        title={crud.editing ? 'Edit PayPal account' : 'New PayPal account'}
        onBack={crud.close}
        backLabel="Back to PayPal"
      >
        <PaypalConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="PayPal"
        subtitle="PayPal and card payments for invoices in the client hub"
        actionLabel="New PayPal account"
        onAction={crud.openCreate}
      />
      <WebhookInfo
        title="Webhook to register"
        path="/webhooks/paypal"
        description="Add this URL as a webhook on the PayPal app, subscribed to the events below, then save its webhook id here."
        events={PAYPAL_EVENTS}
      />
      <DataTable
        columns={COLUMNS}
        rows={data?.listPaypalConfigs ?? []}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No PayPal account yet."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
