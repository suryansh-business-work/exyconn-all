import type { ReactNode } from 'react';
import { Box, Divider, Flex, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { CampaignRow } from './forms/campaign';

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Flex direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Text size="sm" color="text.secondary">
        {label}
      </Text>
      <Box sx={{ textAlign: 'right' }}>{children}</Box>
    </Flex>
  );
}

/** Read-only summary of a campaign, including its email content and delivery status. */
export function CampaignDetails({ campaign }: { campaign: CampaignRow }) {
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
    </Flex>
  );
}
