import { useEffect } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Button,
  Flex,
  Grid,
  LinearProgress,
  Skeleton,
  Text,
} from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  CampaignSendState,
  useCampaignDeliveryStatsQuery,
  useCancelCampaignSendMutation,
  useRetryCampaignFailuresMutation,
} from '@exyconn/shell/graphql/generated';

/** While a send is moving, the figures are re-read this often. */
const POLL_MS = 5000;

const ACTIVE: ReadonlySet<CampaignSendState> = new Set([
  CampaignSendState.Queued,
  CampaignSendState.Sending,
]);

/** One figure and what it means. */
function Figure({ label, value, hint }: Readonly<{ label: string; value: string; hint?: string }>) {
  const t = useT();
  return (
    <Grid size={{ xs: 6, sm: 4, md: 3 }}>
      <Text size="lg" weight="semibold" sx={{ display: 'block' }}>
        {value}
      </Text>
      <Text size="sm" sx={{ display: 'block' }}>
        {t(label)}
      </Text>
      {hint && (
        <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
          {t(hint)}
        </Text>
      )}
    </Grid>
  );
}

/**
 * Where a campaign's latest send stands: progress while it goes, then what it did. Cancel
 * stops it before the next batch; Retry sends the failed copies again within the same run.
 */
export function CampaignDeliveryPanel({
  campaignId,
  onChanged,
}: Readonly<{ campaignId: string; onChanged?: () => void }>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatNumber, formatDateTime } = useFormatters();
  const { data, loading, error, refetch, startPolling, stopPolling } =
    useCampaignDeliveryStatsQuery({
      variables: { campaignId },
      fetchPolicy: 'network-only',
    });
  const stats = data?.campaignDeliveryStats;
  const active = stats ? ACTIVE.has(stats.sendState) : false;
  const [cancel] = useCancelCampaignSendMutation();
  const [retry, { loading: retrying }] = useRetryCampaignFailuresMutation();
  // Re-read while the send is moving; stop as soon as it settles.
  useEffect(() => {
    if (active) {
      startPolling(POLL_MS);
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [active, startPolling, stopPolling]);

  const act = async (kind: 'cancel' | 'retry') => {
    const ok = await confirm(
      kind === 'cancel'
        ? {
            title: 'Cancel this send?',
            message:
              'Copies not yet sent will not go out. Copies already delivered cannot be recalled.',
            confirmText: 'Cancel send',
            destructive: true,
          }
        : {
            title: 'Retry failed copies?',
            message: 'Only the copies that failed are sent again. Nobody gets a second copy.',
            confirmText: 'Retry',
          },
    );
    if (!ok) return;
    try {
      if (kind === 'cancel') {
        await cancel({ variables: { id: campaignId } });
      } else {
        await retry({ variables: { id: campaignId } });
      }
      notify(kind === 'cancel' ? 'Send cancelled' : 'Failed copies sent again', 'success');
      await refetch();
      onChanged?.();
    } catch (err) {
      notify(errorMessage(err, 'That did not work'), 'error');
    }
  };

  if (loading && !stats) return <Skeleton variant="rounded" height={140} />;
  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!stats) return null;
  const done = stats.sent + stats.failed + stats.skipped;
  return (
    <Flex direction="column" spacing={1.5} aria-busy={active}>
      <Flex direction="row" alignItems="center" gap={1} flexWrap="wrap">
        <StatusChip value={stats.sendState} />
        {stats.scheduledAt && stats.sendState === CampaignSendState.Queued && (
          <Text size="sm">
            {t('Scheduled for {when}', { when: formatDateTime(stats.scheduledAt) })}
          </Text>
        )}
        {stats.lastSentAt && (
          <Text size="sm" color="text.secondary">
            {t('Last sent {when}', { when: formatDateTime(stats.lastSentAt) })}
          </Text>
        )}
      </Flex>
      {active && stats.resolved > 0 && (
        <Box role="status">
          <LinearProgress
            variant="determinate"
            value={Math.round((done / stats.resolved) * 100)}
            aria-label={t('Send progress')}
          />
          <Text size="caption">
            {t('{done} of {total} processed', {
              done: formatNumber(done),
              total: formatNumber(stats.resolved),
            })}
          </Text>
        </Box>
      )}
      <Grid container spacing={1.5}>
        <Figure label="Total eligible" value={formatNumber(stats.eligible)} />
        <Figure label="Queued" value={formatNumber(stats.queued)} />
        <Figure label="Sent" value={formatNumber(stats.sent)} hint="Accepted by the mail server" />
        <Figure label="Failed" value={formatNumber(stats.failed)} />
        <Figure
          label="Skipped"
          value={formatNumber(stats.skipped)}
          hint="Suppressed, opted out or excluded"
        />
        <Figure
          label="Bounced"
          value={
            stats.bounced === null || stats.bounced === undefined
              ? '—'
              : formatNumber(stats.bounced)
          }
          hint="Not reported by your mail provider"
        />
        <Figure label="Unsubscribed" value={formatNumber(stats.unsubscribed)} />
        <Figure label="Preference changes" value={formatNumber(stats.preferenceChanges)} />
        <Figure
          label="Clicked"
          value={formatNumber(stats.clicked)}
          hint={t('{rate}% of sent', { rate: stats.clickRate })}
        />
        <Figure
          label="Opened (estimate)"
          value={formatNumber(stats.estimatedOpens)}
          hint="Privacy proxies and blocked images make opens unreliable"
        />
      </Grid>
      <Flex direction="row" gap={1}>
        {active && (
          <Button color="error" variant="outlined" onClick={() => act('cancel')}>
            {t('Cancel send')}
          </Button>
        )}
        {!active && stats.failed > 0 && (
          <Button variant="outlined" onClick={() => act('retry')} disabled={retrying}>
            {t('Retry failed copies')}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
