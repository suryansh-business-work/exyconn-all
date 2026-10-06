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
  useListPayoneerConfigsQuery,
  useDeletePayoneerConfigMutation,
  useTestPayoneerConnectionMutation,
} from '@exyconn/shell/graphql/generated';
import { PayoneerConfigForm, type PayoneerConfigRow } from './forms/payoneer-config';
import { maskedSecret } from './secret';
import { WebhookInfo } from './WebhookInfo';

const COLUMNS: Column<PayoneerConfigRow>[] = [
  { key: 'label', label: 'Label' },
  { key: 'merchantCode', label: 'Merchant code' },
  {
    key: 'apiToken',
    label: 'API token',
    render: (r) => maskedSecret(r.hasApiToken, r.apiTokenHint),
  },
  { key: 'division', label: 'Division', render: (r) => r.division || '—' },
  { key: 'mode', label: 'Mode', render: (r) => <StatusChip value={r.mode} /> },
  {
    key: 'isActive',
    label: 'Active',
    render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
  },
];

/**
 * Environment Variables sub-panel: Exyconn's Payoneer Checkout account, which clients pay
 * invoices through in the client hub. Payoneer notifies the API of each payment.
 */
export function PayoneerConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useListPayoneerConfigsQuery();
  const [deleteConfig] = useDeletePayoneerConfigMutation();
  const [testConnection] = useTestPayoneerConnectionMutation();
  const crud = useCrudResource<PayoneerConfigRow>({
    label: 'Payoneer account',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete Payoneer account "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const test = async (row: PayoneerConfigRow) => {
    try {
      await testConnection({ variables: { id: row.id } });
      notify('Payoneer accepted the credentials on "{label}"', 'success', { label: row.label });
    } catch (err) {
      notify(errorMessage(err, 'Connection failed'), 'error');
    }
  };

  const actions: RowAction<PayoneerConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test connection',
      ariaLabel: 'test payoneer connection',
      color: 'primary',
      onClick: test,
    },
  ];

  if (crud.open) {
    return (
      <CrudFormPage
        title={crud.editing ? 'Edit Payoneer account' : 'New Payoneer account'}
        onBack={crud.close}
        backLabel="Back to Payoneer"
      >
        <PayoneerConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Payoneer"
        subtitle="International card and wallet payments for invoices in the client hub"
        actionLabel="New Payoneer account"
        onAction={crud.openCreate}
      />
      <WebhookInfo
        title="Notification URL"
        path="/webhooks/payoneer"
        description="Sent to Payoneer with every checkout, so there is nothing to register. Allow it if your account restricts notification URLs."
      />
      <DataTable
        columns={COLUMNS}
        rows={data?.listPayoneerConfigs ?? []}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No Payoneer account yet."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
