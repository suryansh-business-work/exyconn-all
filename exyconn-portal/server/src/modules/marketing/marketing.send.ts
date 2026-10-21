import { Types } from 'mongoose';
import { CampaignSendModel } from './campaign-send.model';
import { CampaignRevisionModel } from './campaign-revision.model';
import { CampaignModel } from './marketing.model';
import { MarketingPreferenceModel } from './preference.model';
import {
  loadAudienceShape,
  resolveAudience,
  type ResolvedRecipient,
  type RecipientSourceRef,
} from './audience.resolve';
import type { ExclusionReason } from './audience.eligibility';
import { contextsFor } from './campaign.context';
import { deliverCopy, type CopyOutcome, type RunSettings } from './campaign.delivery';
import { createSendingRevision, type RevisionActor } from './campaign.revision';
import {
  isDuplicateKeyOnly,
  issueUnsubscribeTokens,
  suppressionsAmong,
  suppressMany,
} from './marketing.suppression';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { inSequence } from '../../utils/inSequence';

/**
 * How many copies are in flight at once.
 *
 * A five-figure audience sent one at a time holds the scheduler tick open for hours; sent
 * all at once it trips the SMTP provider's rate limit. A small fixed width finishes and
 * stays inside the quota.
 */
const SEND_CONCURRENCY = 5;

const SYSTEM_ACTOR: RevisionActor = { id: 'system', name: 'Scheduler' };

export interface SendCounts {
  sent: number;
  failed: number;
  skipped: number;
}

/** Splits a list into fixed-width batches. Pure, so the concurrency rule is testable. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

/** How an excluded address reads in the delivery report. */
export const EXCLUSION_TEXT: Readonly<Record<ExclusionReason, string>> = {
  UNSUBSCRIBED: 'Unsubscribed',
  SPAM_COMPLAINT: 'Marked a campaign as spam',
  CATEGORY_OPT_OUT: 'Turned off this kind of email',
  BOUNCED: 'Hard bounced',
  BLOCKED: 'On the suppression list',
  INVALID_EMAIL: 'Failed email verification',
  LEFT_COMPANY: 'Contact left the company',
  MANUALLY_EXCLUDED: 'Excluded from this audience',
  EMAIL_STATUS_FILTER: 'Filtered out by email status',
};

/** The campaign document type the resolvers and the scheduler hand in. */
export type CampaignDoc = InstanceType<typeof CampaignModel>;

/** The run's recipients, as the send log holds them. */
type QueuedRecipient = Pick<ResolvedRecipient, 'email' | 'sources'>;

/**
 * Contacts who unsubscribed or bounced in the CRM go onto the suppression list, so every
 * later send and every audience sees the withdrawal even if the contact row changes again.
 */
async function syncCrmWithdrawals(excluded: readonly ResolvedRecipient[], campaignId: string) {
  const source = `campaign:${campaignId}`;
  // One reason after the other: an address keeps the first reason it is suppressed with, and
  // each call already runs its own bounded batches of upserts.
  await inSequence(['UNSUBSCRIBED', 'BOUNCED'] as const, async (reason) => {
    const emails = excluded.filter((row) => row.exclusion === reason).map((row) => row.email);
    await suppressMany(emails, reason, source, 'CRM');
  });
}

/**
 * Writes the run's whole recipient list before anything is sent: QUEUED for the deliverable,
 * SKIPPED with the reason for the rest. These rows are the run's immutable record of who it
 * resolved to and why — later CRM edits change the next run, never this one.
 */
async function queueRun(
  ids: { runId: string; campaignId: string; audienceListId: string; revisionId: string },
  recipients: readonly ResolvedRecipient[],
): Promise<void> {
  const rows = recipients.map((recipient) => ({
    ...ids,
    to: recipient.email,
    recipientName: recipient.name,
    sources: recipient.sources,
    status: recipient.exclusion ? 'SKIPPED' : 'QUEUED',
    error: recipient.exclusion ? EXCLUSION_TEXT[recipient.exclusion] : '',
  }));
  try {
    await CampaignSendModel.insertMany(rows, { ordered: false });
  } catch (err) {
    if (!isDuplicateKeyOnly(err)) {
      throw err;
    }
  }
}

/** Takes one queued row for sending. False when another sender already has it. */
async function claim(runId: string, email: string): Promise<boolean> {
  const result = await CampaignSendModel.updateOne(
    { runId, to: email, status: 'QUEUED', claimedAt: null },
    { claimedAt: new Date() },
  );
  return result.modifiedCount === 1;
}

async function record(
  runId: string,
  outcome: Partial<CopyOutcome> & { to: string; status: string; error: string },
) {
  await CampaignSendModel.updateOne(
    { runId, to: outcome.to },
    {
      status: outcome.status,
      error: outcome.error,
      trackingTokenHash: outcome.trackingTokenHash ?? '',
      $inc: { attempts: outcome.attempts ?? 0 },
      sentAt: new Date(),
    },
  );
}

/**
 * Who in a batch may no longer be written to, read at the moment of sending: unsubscribed or
 * blocked since the run was queued, or opted out of the campaign's category since then.
 */
async function blockedNow(
  emails: readonly string[],
  categoryId: string,
): Promise<Map<string, string>> {
  const blocked = new Map<string, string>();
  const [suppressed, optedOut] = await Promise.all([
    suppressionsAmong(emails),
    categoryId
      ? MarketingPreferenceModel.find({
          email: { $in: [...emails] },
          optedOutCategoryIds: categoryId,
        })
          .select('email')
          .lean()
      : Promise.resolve([]),
  ]);
  for (const email of suppressed.keys()) {
    blocked.set(email, 'Suppressed just before sending');
  }
  for (const row of optedOut) {
    blocked.set(row.email, 'Turned off this kind of email just before sending');
  }
  return blocked;
}

/** True once somebody pressed Cancel on the campaign. */
async function cancelRequested(campaignId: string): Promise<boolean> {
  const row = await CampaignModel.findById(campaignId).select('cancelRequestedAt').lean();
  return Boolean(row?.cancelRequestedAt);
}

/** Everything still queued in a cancelled run is recorded as not sent. */
async function cancelRemaining(runId: string): Promise<void> {
  await CampaignSendModel.updateMany(
    { runId, status: 'QUEUED', claimedAt: null },
    { status: 'SKIPPED', error: 'Cancelled before sending', sentAt: new Date() },
  );
}

/** One batch: blocked addresses skipped, the rest claimed and sent. */
async function sendBatch(run: RunState, batch: readonly QueuedRecipient[]): Promise<void> {
  const emails = batch.map((recipient) => recipient.email);
  const [blocked, contexts] = await Promise.all([
    blockedNow(emails, run.categoryId),
    contextsFor(batch),
  ]);
  await Promise.allSettled(
    batch.map(async (recipient) => {
      const reason = blocked.get(recipient.email);
      if (reason) {
        await record(run.runId, { to: recipient.email, status: 'SKIPPED', error: reason });
        return;
      }
      const context = contexts.get(recipient.email);
      if (!context || !(await claim(run.runId, recipient.email))) {
        return;
      }
      await record(run.runId, await deliverCopy(run.settings, context));
    }),
  );
}

interface RunState {
  campaignId: string;
  runId: string;
  categoryId: string;
  settings: RunSettings;
}

/**
 * Sends the batches from `index` on, one after another — at most SEND_CONCURRENCY copies in
 * flight — checking before each whether the campaign was cancelled.
 */
async function sendBatchesFrom(
  run: RunState,
  batches: readonly QueuedRecipient[][],
  index: number,
): Promise<boolean> {
  if (index >= batches.length) {
    return true;
  }
  if (await cancelRequested(run.campaignId)) {
    await cancelRemaining(run.runId);
    return false;
  }
  await sendBatch(run, batches[index]);
  return sendBatchesFrom(run, batches, index + 1);
}

/** Sends a run's queued recipients in batches, stopping when the campaign is cancelled. */
function sendQueued(run: RunState, recipients: readonly QueuedRecipient[]): Promise<boolean> {
  return sendBatchesFrom(run, chunk(recipients, SEND_CONCURRENCY), 0);
}

/** A run's outcome, counted from its own rows. */
export async function runCounts(runId: string): Promise<SendCounts> {
  const rows = await CampaignSendModel.aggregate<{ _id: string; count: number }>([
    { $match: { runId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const countOf = (status: string) => rows.find((row) => row._id === status)?.count ?? 0;
  return { sent: countOf('SENT'), failed: countOf('FAILED'), skipped: countOf('SKIPPED') };
}

/** The revision this send uses: the one frozen when it was queued, or one frozen now. */
async function revisionFor(campaign: CampaignDoc) {
  if (campaign.sendingRevisionId) {
    const revision = await CampaignRevisionModel.findById(campaign.sendingRevisionId);
    if (revision) {
      return revision;
    }
  }
  // Campaigns scheduled before revisions existed are frozen at the moment they go out.
  const revision = await createSendingRevision(campaign, SYSTEM_ACTOR);
  campaign.sendingRevisionId = revision._id.toHexString();
  return revision;
}

async function finishRun(
  campaign: CampaignDoc,
  runId: string,
  completed: boolean,
): Promise<SendCounts> {
  const counts = await runCounts(runId);
  campaign.lastSentAt = new Date();
  campaign.recipientsCount = counts.sent;
  campaign.sendState = completed ? 'SENT' : 'CANCELLED';
  await campaign.save();
  return counts;
}

async function runSettings(
  revision: Awaited<ReturnType<typeof revisionFor>>,
  emails: string[],
  campaignId: string,
  origin: string,
) {
  return {
    revision,
    origin,
    unsubscribeTokens: await issueUnsubscribeTokens(emails, campaignId),
  };
}

export interface SendResult extends SendCounts {
  runId: string;
}

/**
 * The real send. The audience is resolved now — a fixed snapshot re-checked, a dynamic one
 * re-run, the campaign's preference category applied — every address is written to the run
 * before any email goes, and each is claimed before it is sent, so a run never mails an
 * address twice.
 */
export async function runCampaignSend(campaign: CampaignDoc, origin: string): Promise<SendResult> {
  const campaignId = campaign._id.toHexString();
  const audienceListId = campaign.scheduledAudienceListId;
  const revision = await revisionFor(campaign);
  const audience = await loadAudienceShape(audienceListId);
  const resolution = await resolveAudience(audience, audienceListId, revision.preferenceCategoryId);
  if (resolution.recipients.length === 0) {
    campaign.sendState = 'FAILED';
    await campaign.save();
    badRequest(`"${audience.name}" has nobody in it.`);
  }
  campaign.sendState = 'SENDING';
  await campaign.save();

  const runId = new Types.ObjectId().toHexString();
  const deliverable = resolution.recipients.filter((row) => row.exclusion === null);
  await syncCrmWithdrawals(
    resolution.recipients.filter((row) => row.exclusion !== null),
    campaignId,
  );
  await queueRun(
    { runId, campaignId, audienceListId, revisionId: revision._id.toHexString() },
    resolution.recipients,
  );
  const settings = await runSettings(
    revision,
    deliverable.map((row) => row.email),
    campaignId,
    origin,
  );
  const completed = await sendQueued(
    { campaignId, runId, categoryId: revision.preferenceCategoryId, settings },
    deliverable,
  );
  const counts = await finishRun(campaign, runId, completed);
  logger.info(
    `Campaign "${campaign.name}" run ${runId}: ${counts.sent} sent, ${counts.failed} failed`,
  );
  return { ...counts, runId };
}

/** The latest run of a campaign, or null when it was never sent. */
export async function latestRunId(campaignId: string): Promise<string | null> {
  const row = await CampaignSendModel.findOne({ campaignId, runId: { $gt: '' } })
    .sort({ createdAt: -1 })
    .select('runId')
    .lean();
  return row?.runId ?? null;
}

/**
 * Sends a run's failed copies again, with the same revision and the same run — so the
 * per-address claim still guarantees nobody gets a second copy of what already arrived.
 */
export async function retryFailedCopies(
  campaign: CampaignDoc,
  origin: string,
): Promise<SendResult> {
  const campaignId = campaign._id.toHexString();
  const runId = await latestRunId(campaignId);
  if (!runId) {
    badRequest('This campaign has not been sent yet.');
  }
  const failed = await CampaignSendModel.find({ runId, status: 'FAILED' })
    .select('to sources revisionId')
    .lean();
  if (failed.length === 0) {
    badRequest('Nothing failed in the last send.');
  }
  await CampaignSendModel.updateMany(
    { runId, status: 'FAILED' },
    { status: 'QUEUED', claimedAt: null, error: '' },
  );
  const revision = await CampaignRevisionModel.findById(
    failed[0].revisionId || campaign.sendingRevisionId,
  );
  if (!revision) {
    badRequest('The content this send used is missing.');
  }
  campaign.sendState = 'SENDING';
  campaign.cancelRequestedAt = null;
  await campaign.save();
  const recipients = failed.map((row) => ({
    email: row.to,
    sources: row.sources as RecipientSourceRef[],
  }));
  const settings = await runSettings(
    revision,
    recipients.map((row) => row.email),
    campaignId,
    origin,
  );
  const completed = await sendQueued(
    { campaignId, runId, categoryId: revision.preferenceCategoryId, settings },
    recipients,
  );
  return { ...(await finishRun(campaign, runId, completed)), runId };
}
