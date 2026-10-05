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
  useListRazorpayConfigsQuery,
  useDeleteRazorpayConfigMutation,
  useTestRazorpayConnectionMutation,
} from '@exyconn/shell/graphql/generated';
import { RazorpayConfigForm, type RazorpayConfigRow } from './forms/razorpay-config';
import { maskedSecret } from './secret';

const COLUMNS: Column<RazorpayConfigRow>[] = [
  { key: 'label', label: 'Label' },
  { key: 'keyId', label: 'Key id' },
  {
    key: 'keySecret',
    label: 'Key secret',
    render: (r) => maskedSecret(r.hasKeySecret, r.keySecretHint),
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
 * Environment Variables sub-panel: Exyconn's Razorpay account, which clients pay invoices by
 * card through in the client hub. The webhook confirms each payment on the invoice.
 */
export function RazorpayConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useListRazorpayConfigsQuery();
  const [deleteConfig] = useDeleteRazorpayConfigMutation();
  const [testConnection] = useTestRazorpayConnectionMutation();
  const crud = useCrudResource<RazorpayConfigRow>({
    label: 'Razorpay account',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete Razorpay account "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const test = async (row: RazorpayConfigRow) => {
    try {
      await testConnection({ variables: { id: row.id } });
      notify('Razorpay accepted the keys on "{label}"', 'success', { label: row.label });
    } catch (err) {
      notify(errorMessage(err, 'Connection failed'), 'error');
    }
  };

  const actions: RowAction<RazorpayConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test connection',
      ariaLabel: 'test razorpay connection',
      color: 'primary',
      onClick: test,
    },
  ];

  if (crud.open) {
    return (
      <CrudFormPage
        title={crud.editing ? 'Edit Razorpay account' : 'New Razorpay account'}
        onBack={crud.close}
        backLabel="Back to Razorpay"
      >
        <RazorpayConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Razorpay"
        subtitle="UPI, card and netbanking payments for invoices in the client hub"
        actionLabel="New Razorpay account"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={COLUMNS}
        rows={data?.listRazorpayConfigs ?? []}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No Razorpay account yet."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
