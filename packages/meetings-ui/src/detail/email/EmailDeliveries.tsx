import { useFormatters, useT } from '@exyconn/i18n';
import ReplayIcon from '@mui/icons-material/Replay';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  MaDeliveryStatus,
  useMaRetryEmailDeliveryMutation,
  type MaEmailDeliveriesQuery,
} from '@exyconn/shell/graphql/generated';
import { useRunNotified } from '../../lib/useRunNotified';

type Delivery = MaEmailDeliveriesQuery['maEmailDeliveries'][number];

interface EmailDeliveriesProps {
  deliveries: Delivery[];
  loading: boolean;
  onRefresh: () => Promise<unknown>;
}

/** Every summary email sent for the meeting, one row per recipient, with Retry on a failure. */
export function EmailDeliveries({
  deliveries,
  loading,
  onRefresh,
}: Readonly<EmailDeliveriesProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const [retryDelivery] = useMaRetryEmailDeliveryMutation();
  const runNotified = useRunNotified();
  const retry = async (row: Delivery) => {
    await runNotified(
      () => retryDelivery({ variables: { id: row.id } }),
      'Sending to {recipient} again',
      { recipient: row.recipient },
    );
  };
  const columns: Column<Delivery>[] = [
    { key: 'recipient', label: 'Recipient' },
    { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
    { key: 'attempts', label: 'Attempts', render: (row) => String(row.attempts) },
    { key: 'error', label: 'Error', render: (row) => row.error || '—' },
    {
      key: 'sentAt',
      label: 'Sent',
      render: (row) => (row.sentAt ? formatDateTime(row.sentAt) : t('Not sent')),
    },
    { key: 'notesVersion', label: 'Notes version', render: (row) => String(row.notesVersion) },
    { key: 'triggeredByName', label: 'Sent by' },
  ];
  const actions: RowAction<Delivery>[] = [
    {
      icon: <ReplayIcon fontSize="small" />,
      tooltip: 'Retry',
      ariaLabel: 'Retry sending',
      hidden: (row) => row.status !== MaDeliveryStatus.Failed,
      onClick: retry,
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={deliveries}
      actions={actions}
      loading={loading}
      onRefresh={onRefresh}
      emptyMessage="No summary email has been sent for this meeting."
    />
  );
}
