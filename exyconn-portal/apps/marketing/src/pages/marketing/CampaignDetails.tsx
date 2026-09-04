import { Divider, Flex, Text } from '@exyconn/shell/components/ui';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { CampaignDeliveryLog } from './CampaignDeliveryLog';
import type { CampaignRow } from './forms/campaign';

/** Read-only summary of a campaign: its email content, and who each send reached. */
export function CampaignDetails({ campaign }: Readonly<{ campaign: CampaignRow }>) {
  const { formatDate } = useSettings();
  return (
    <Flex direction="column" spacing={1.5}>
      <DetailRow label="Name">
        <Text size="sm" weight="medium">
          {campaign.name}
        </Text>
      </DetailRow>
      <DetailRow label="Channel">
        <StatusChip value={campaign.channel} />
      </DetailRow>
      <DetailRow label="Status">
        <StatusChip value={campaign.status} />
      </DetailRow>
      <DetailRow label="Budget">
        <Text size="sm">₹{campaign.budget.toLocaleString()}</Text>
      </DetailRow>
      <DetailRow label="Schedule">
        <Text size="sm">
          {formatDate(campaign.startDate)} → {formatDate(campaign.endDate)}
        </Text>
      </DetailRow>
      <DetailRow label="Last sent">
        <Text size="sm">
          {campaign.lastSentAt
            ? `${formatDate(campaign.lastSentAt)} · ${campaign.recipientsCount ?? 0} recipient(s)`
            : 'Not sent yet'}
        </Text>
      </DetailRow>

      <Divider />
      <Text size="label">Email content</Text>
      <Text size="caption" color="text.secondary">
        Subject
      </Text>
      <Text size="sm">{campaign.subject || '— none —'}</Text>
      <Text size="caption" color="text.secondary">
        Body
      </Text>
      <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
        {campaign.body || '— none —'}
      </Text>

      <Divider />
      <CampaignDeliveryLog campaignId={campaign.id} />
    </Flex>
  );
}
