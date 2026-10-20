import { useFormContext, useWatch } from 'react-hook-form';
import { useFormatters, useT } from '@exyconn/i18n';
import { Alert, Divider, Flex, Grid, Text } from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { CampaignSendState, useListAudienceListsQuery } from '@exyconn/shell/graphql/generated';
import { CampaignScheduleForm } from '../../campaign-schedule';
import { CampaignDeliveryPanel } from '../../../CampaignDeliveryPanel';
import { QualityChecksPanel } from '../studio/QualityChecksPanel';
import type { CampaignRow, CampaignStudioValues } from '../campaign.types';
import type { StudioOptions } from '../studio/useStudioOptions';
import type { useQualityChecks } from '../studio/useQualityChecks';

interface ReviewStepProps {
  campaign: CampaignRow | null;
  options: StudioOptions;
  checks: ReturnType<typeof useQualityChecks>;
  save: () => Promise<unknown>;
  onQueued: () => void;
}

const SENT_OR_MOVING: ReadonlySet<CampaignSendState> = new Set([
  CampaignSendState.Queued,
  CampaignSendState.Sending,
  CampaignSendState.Sent,
  CampaignSendState.Cancelled,
  CampaignSendState.Failed,
]);

/** Everything about the send on one screen, the exact recipient count, then send or schedule. */
export function ReviewStep({
  campaign,
  options,
  checks,
  save,
  onQueued,
}: Readonly<ReviewStepProps>) {
  const t = useT();
  const { formatNumber } = useFormatters();
  const { control } = useFormContext<CampaignStudioValues>();
  const values = useWatch({ control }) as CampaignStudioValues;
  const { data } = useListAudienceListsQuery();
  const audience = data?.listAudienceLists.find((row) => row.id === values.scheduledAudienceListId);
  const category = options.categories.find((row) => row.id === values.preferenceCategoryId);
  const eligible = checks.report?.counts?.eligible ?? 0;
  const moving =
    campaign?.sendState === CampaignSendState.Queued ||
    campaign?.sendState === CampaignSendState.Sending;
  if (!campaign) {
    return (
      <Alert severity="info">
        {t('Name the campaign so it can be saved; then it can be reviewed.')}
      </Alert>
    );
  }
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Flex direction="column" spacing={2}>
          <DetailFactGrid>
            <DetailFact label="Campaign">{values.name}</DetailFact>
            <DetailFact label="From">{`${values.senderName} <${values.senderEmail}>`}</DetailFact>
            <DetailFact label="Reply-to">{values.replyTo || '—'}</DetailFact>
            <DetailFact label="Subject">{values.subject}</DetailFact>
            <DetailFact label="Preview text">{values.preheader || '—'}</DetailFact>
            <DetailFact label="Audience">{audience?.name ?? '—'}</DetailFact>
            <DetailFact label="Preference category">
              {category?.name ?? t('General marketing')}
            </DetailFact>
          </DetailFactGrid>
          <Alert severity={eligible > 0 ? 'info' : 'warning'} role="status">
            {t(
              'This campaign will be sent to {count} unique email address(es) — not records — after duplicates, unsubscribes, blocks and opt-outs.',
              { count: formatNumber(eligible) },
            )}
          </Alert>
          <QualityChecksPanel
            checks={checks.report?.checks ?? null}
            loading={checks.loading}
            error={checks.error}
            onRun={checks.run}
          />
        </Flex>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Flex direction="column" spacing={2}>
          {moving ? (
            <Alert severity="info">
              {t(
                'This campaign is queued or sending. Draft edits are not included in it; cancel and send again to include them.',
              )}
            </Alert>
          ) : (
            <CampaignScheduleForm
              campaignId={campaign.id}
              audienceListId={values.scheduledAudienceListId}
              eligible={eligible}
              canSend={Boolean(checks.report?.canSend)}
              beforeQueue={save}
              onQueued={onQueued}
            />
          )}
          {SENT_OR_MOVING.has(campaign.sendState) && (
            <>
              <Divider />
              <Text size="sm" weight="semibold">
                {t('Delivery')}
              </Text>
              <CampaignDeliveryPanel campaignId={campaign.id} onChanged={onQueued} />
            </>
          )}
        </Flex>
      </Grid>
    </Grid>
  );
}
