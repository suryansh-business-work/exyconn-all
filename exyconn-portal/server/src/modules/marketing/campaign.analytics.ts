import { CampaignSendModel } from './campaign-send.model';
import { CampaignModel } from './marketing.model';
import { MarketingSuppressionModel } from './suppression.model';
import { AudienceListModel } from './audience.model';
import { campaignMetricsFor } from './marketing.metrics';
import { latestRunId } from './marketing.send';
import { AuditLogModel } from '../audit';
import { escapeRegex } from '../../utils/tableQuery';

const DAY_MS = 24 * 60 * 60 * 1000;
const DASHBOARD_DAYS = 30;
const LIST_SIZE = 5;

async function statusCounts(filter: Record<string, unknown>) {
  const rows = await CampaignSendModel.aggregate<{ _id: string; count: number }>([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const countOf = (status: string) => rows.find((row) => row._id === status)?.count ?? 0;
  return {
    total: rows.reduce((sum, row) => sum + row.count, 0),
    queued: countOf('QUEUED'),
    sent: countOf('SENT'),
    failed: countOf('FAILED'),
    skipped: countOf('SKIPPED'),
  };
}

/**
 * What one campaign's latest send did, from its own send log. "Sent" means the mail server
 * accepted the copy; bounces are only known when a provider reports them, which this
 * installation does not receive, so they are null rather than a guessed zero.
 */
export async function campaignDeliveryStats(campaignId: string) {
  const [runId, campaign, metrics, unsubscribed, preferenceChanges] = await Promise.all([
    latestRunId(campaignId),
    CampaignModel.findById(campaignId)
      .select('sendState lastSentAt scheduledAt sendingRevisionId')
      .lean(),
    campaignMetricsFor(campaignId),
    MarketingSuppressionModel.countDocuments({
      source: `campaign:${campaignId}`,
      origin: 'SUBSCRIBER',
    }),
    AuditLogModel.countDocuments({
      module: 'MarketingPreference',
      summary: new RegExp(`campaign ${escapeRegex(campaignId)}`),
    }),
  ]);
  const run = runId
    ? await statusCounts({ runId })
    : { total: 0, queued: 0, sent: 0, failed: 0, skipped: 0 };
  return {
    runId: runId ?? '',
    sendState: campaign?.sendState ?? 'DRAFT',
    scheduledAt: campaign?.scheduledAt ?? null,
    lastSentAt: campaign?.lastSentAt ?? null,
    resolved: run.total,
    eligible: run.total - run.skipped,
    ...run,
    bounced: null,
    unsubscribed,
    preferenceChanges,
    clicked: metrics.clicked,
    estimatedOpens: metrics.opened,
    clickRate: metrics.clickRate,
  };
}

/** Copies the mail server accepted per day, oldest first, gaps filled with zero. */
async function dailySent(since: Date) {
  const rows = await CampaignSendModel.aggregate<{ _id: string; count: number }>([
    { $match: { status: 'SENT', sentAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } },
        count: { $sum: 1 },
      },
    },
  ]);
  const byDay = new Map(rows.map((row) => [row._id, row.count]));
  return Array.from({ length: DASHBOARD_DAYS }, (_unused, index) => {
    const day = new Date(since.getTime() + index * DAY_MS).toISOString().slice(0, 10);
    return { day, sent: byDay.get(day) ?? 0 };
  });
}

/** The marketing dashboard's figures, every one an aggregation rather than a page of rows. */
export async function marketingDashboard() {
  const since = new Date(Date.now() - DASHBOARD_DAYS * DAY_MS);
  const [states, last30, clicked, unsubscribes, suppressed, audiences, upcoming, recent, daily] =
    await Promise.all([
      CampaignModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$sendState', count: { $sum: 1 } } },
      ]),
      statusCounts({ sentAt: { $gte: since } }),
      CampaignSendModel.countDocuments({
        status: 'SENT',
        sentAt: { $gte: since },
        clickCount: { $gt: 0 },
      }),
      MarketingSuppressionModel.countDocuments({
        origin: 'SUBSCRIBER',
        createdAt: { $gte: since },
      }),
      MarketingSuppressionModel.countDocuments({}),
      AudienceListModel.countDocuments({}),
      CampaignModel.find({ sendState: 'QUEUED', scheduledAt: { $ne: null } })
        .sort({ scheduledAt: 1 })
        .limit(LIST_SIZE)
        .select('name scheduledAt')
        .lean(),
      CampaignModel.find({ lastSentAt: { $ne: null } })
        .sort({ lastSentAt: -1 })
        .limit(LIST_SIZE)
        .select('name lastSentAt recipientsCount sendState')
        .lean(),
      dailySent(since),
    ]);
  const stateOf = (state: string) => states.find((row) => row._id === state)?.count ?? 0;
  return {
    campaigns: states.reduce((sum, row) => sum + row.count, 0),
    drafts: stateOf('DRAFT'),
    scheduled: stateOf('QUEUED'),
    sending: stateOf('SENDING'),
    sentLast30: last30.sent,
    failedLast30: last30.failed,
    clickedLast30: clicked,
    clickRateLast30: last30.sent ? Math.round((clicked / last30.sent) * 100) : 0,
    unsubscribesLast30: unsubscribes,
    suppressed,
    audiences,
    upcoming: upcoming.map((row) => ({ id: String(row._id), name: row.name, at: row.scheduledAt })),
    recent: recent.map((row) => ({
      id: String(row._id),
      name: row.name,
      at: row.lastSentAt,
      recipients: row.recipientsCount ?? 0,
      sendState: row.sendState,
    })),
    daily,
  };
}
