import { useT } from '@exyconn/i18n';
import { Divider, Flex, Text } from '@exyconn/shell/components/ui';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { CampaignAttribution } from './CampaignAttribution';
import { CampaignEngagement } from './CampaignEngagement';
import { CampaignDeliveryLog } from './CampaignDeliveryLog';
import type { CampaignRow } from './forms/campaign';

/** Read-only summary of a campaign: its email content, and who each send reached. */
export function CampaignDetails({ campaign }: Readonly<{ campaign: CampaignRow }>) {
  const t = useT();
  const { formatDate } = useSettings();
  const lastSent = campaign.lastSentAt
    ? t('{date} · {count} recipient(s)', {
        date: formatDate(campaign.lastSentAt),
        count: campaign.recipientsCount ?? 0,
      })
    : t('Not sent yet');
  return (
    <Flex direction="column" spacing={1.5}>
      <DetailRow label={t('Name')}>
        <Text size="sm" weight="medium">
          {campaign.name}
        </Text>
      </DetailRow>
      <DetailRow label={t('Channel')}>
        <StatusChip value={campaign.channel} />
      </DetailRow>
      <DetailRow label={t('Status')}>
        <StatusChip value={campaign.status} />
      </DetailRow>
      <DetailRow label={t('Budget')}>
        <Text size="sm">₹{campaign.budget.toLocaleString()}</Text>
      </DetailRow>
      <DetailRow label={t('Schedule')}>
        <Text size="sm">
          {formatDate(campaign.startDate)} → {formatDate(campaign.endDate)}
        </Text>
      </DetailRow>
      <DetailRow label={t('Last sent')}>
        <Text size="sm">{lastSent}</Text>
      </DetailRow>

      <DetailRow label={t('Scheduled')}>
        <Text size="sm">
          {campaign.scheduledAt ? formatDate(campaign.scheduledAt) : t('Not scheduled')}
        </Text>
      </DetailRow>
      <CampaignAttribution campaignId={campaign.id} />

      <Divider />
      <Text size="label">{t('Email content')}</Text>
      <Text size="caption" color="text.secondary">
        {t('Subject')}
      </Text>
      <Text size="sm">{campaign.subject || t('— none —')}</Text>
      <Text size="caption" color="text.secondary">
        {t('Body')}
      </Text>
      <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
        {campaign.body || t('— none —')}
      </Text>

      <Divider />
      <Divider sx={{ my: 1.5 }} />
      <Text size="sm" weight="bold">
        {t('Engagement')}
      </Text>
      <CampaignEngagement campaignId={campaign.id} />

      <CampaignDeliveryLog campaignId={campaign.id} />
    </Flex>
  );
}
