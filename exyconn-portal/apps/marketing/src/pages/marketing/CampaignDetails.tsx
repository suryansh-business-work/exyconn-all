import { Link as RouterLink } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Button,
  Divider,
  Flex,
  List,
  ListItem,
  ListItemText,
  Text,
} from '@exyconn/shell/components/ui';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useCampaignRevisionsQuery } from '@exyconn/shell/graphql/generated';
import { CampaignAttribution } from './CampaignAttribution';
import { CampaignEngagement } from './CampaignEngagement';
import { CampaignDeliveryLog } from './CampaignDeliveryLog';
import { CampaignDeliveryPanel } from './CampaignDeliveryPanel';
import { studioPath } from './CampaignStudioPage';
import type { CampaignRow } from './forms/campaign';

/** Every frozen revision a send went out with, newest first. */
function Revisions({ campaignId }: Readonly<{ campaignId: string }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const { data } = useCampaignRevisionsQuery({ variables: { campaignId } });
  const rows = data?.campaignRevisions ?? [];
  if (rows.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        {t('No sending revisions yet.')}
      </Text>
    );
  }
  return (
    <List dense disablePadding>
      {rows.map((row) => (
        <ListItem key={row.id} disableGutters>
          <ListItemText
            primary={t('Revision {version} — {subject}', {
              version: row.version,
              subject: row.subject,
            })}
            secondary={t('{who} · {when}', {
              who: row.createdByName || t('System'),
              when: formatDateTime(row.createdAt),
            })}
          />
        </ListItem>
      ))}
    </List>
  );
}

/** A campaign at a glance: what it says, how its send went, and who it reached. */
export function CampaignDetails({ campaign }: Readonly<{ campaign: CampaignRow }>) {
  const t = useT();
  return (
    <Flex direction="column" spacing={1.5}>
      <DetailRow label={t('Name')}>
        <Text size="sm" weight="medium">
          {campaign.name}
        </Text>
      </DetailRow>
      <DetailRow label={t('Type')}>
        <StatusChip value={campaign.campaignType} />
      </DetailRow>
      <DetailRow label={t('From')}>
        <Text size="sm">
          {campaign.senderEmail ? `${campaign.senderName} <${campaign.senderEmail}>` : t('Not set')}
        </Text>
      </DetailRow>
      <DetailRow label={t('Subject')}>
        <Text size="sm">{campaign.subject || t('— none —')}</Text>
      </DetailRow>
      <DetailRow label={t('Preview text')}>
        <Text size="sm">{campaign.preheader || t('— none —')}</Text>
      </DetailRow>
      <Button
        component={RouterLink}
        to={studioPath(campaign.id)}
        variant="outlined"
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Open in the studio')}
      </Button>
      <CampaignAttribution campaignId={campaign.id} />
      <Divider />
      <Text size="sm" weight="bold">
        {t('Delivery')}
      </Text>
      <CampaignDeliveryPanel campaignId={campaign.id} />
      <Divider />
      <Text size="sm" weight="bold">
        {t('Sending revisions')}
      </Text>
      <Revisions campaignId={campaign.id} />
      <Divider />
      <Text size="sm" weight="bold">
        {t('Engagement')}
      </Text>
      <CampaignEngagement campaignId={campaign.id} />
      <CampaignDeliveryLog campaignId={campaign.id} />
    </Flex>
  );
}
