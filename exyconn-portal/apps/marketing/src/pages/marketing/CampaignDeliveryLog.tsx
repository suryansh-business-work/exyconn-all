import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { Flex, Text } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useCampaignSendSummaryQuery,
  useListCampaignSendsQuery,
  type ListCampaignSendsQuery,
} from '@exyconn/shell/graphql/generated';

type SendRow = ListCampaignSendsQuery['listCampaignSends'][number];

/**
 * Who this campaign actually reached, one row per recipient. A failed row carries the
 * transport's own reason, which is the only place that answer exists after the send; a
 * skipped row says which consent rule kept the email from going out at all.
 */
export function CampaignDeliveryLog({ campaignId }: Readonly<{ campaignId: string }>) {
  const { formatDateTime } = useSettings();
  const { data, loading } = useListCampaignSendsQuery({ variables: { campaignId } });
  const { data: summaryData } = useCampaignSendSummaryQuery({ variables: { campaignId } });
  const rows = data?.listCampaignSends ?? [];
  const summary = summaryData?.campaignSendSummary;

  const columns: Column<SendRow>[] = [
    { key: 'to', label: 'Recipient', render: (row) => row.recipientName || row.to },
    { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
    { key: 'sentAt', label: 'Sent', render: (row) => formatDateTime(row.sentAt) },
    { key: 'error', label: 'Reason', render: (row) => row.error || '—' },
  ];

  return (
    <Flex direction="column" spacing={1}>
      <Text size="label">Delivery</Text>
      {summary && (
        <Text size="caption" color="text.secondary">
          {summary.sent} sent · {summary.failed} failed · {summary.skipped} skipped
        </Text>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage={loading ? 'Loading…' : 'This campaign has not been sent yet.'}
      />
    </Flex>
  );
}
