import { CampaignModel } from './marketing.model';
import { runCampaignSend, type CampaignDoc } from './marketing.send';
import { portalOrigin } from '../../utils/portalOrigin';
import { logger } from '../../utils/logger';

/** How often the process asks whether a scheduled campaign is due. */
const TICK_MS = 60_000;

/** How many due campaigns one tick will send before leaving the rest to the next. */
const MAX_PER_TICK = 5;

/** The fields the due check reads — the stored campaign, or anything shaped like it. */
export interface ScheduledCampaignShape {
  scheduledAt?: Date | null;
  scheduledAudienceListId?: string | null;
  scheduleDispatchedAt?: Date | null;
}

/**
 * Whether a campaign is ready to be sent unattended.
 *
 * Due means "the moment has passed, there is somewhere to send it, and it has not already
 * gone" rather than an exact minute match — a restart or a busy tick during the scheduled
 * minute must still send, and the dispatch stamp is what stops a second copy.
 */
export function isDue(campaign: ScheduledCampaignShape, now: Date): boolean {
  if (!campaign.scheduledAt || !campaign.scheduledAudienceListId) {
    return false;
  }
  if (campaign.scheduleDispatchedAt) {
    return false;
  }
  return campaign.scheduledAt.getTime() <= now.getTime();
}

/**
 * Takes the next due campaign, stamping it as dispatched in the same operation.
 *
 * The stamp is written before a single email goes out, and the query only matches a
 * campaign that has not been stamped — so two ticks racing, or two processes, cannot both
 * claim it. A campaign is sent once or not at all; never twice.
 */
async function claimDue(now: Date): Promise<CampaignDoc | null> {
  return CampaignModel.findOneAndUpdate(
    {
      scheduledAt: { $ne: null, $lte: now },
      scheduledAudienceListId: { $nin: [null, ''] },
      scheduleDispatchedAt: null,
    },
    { scheduleDispatchedAt: new Date() },
    { new: true, sort: { scheduledAt: 1 } },
  );
}

/** Sends one claimed campaign, keeping a failure out of the tick that follows it. */
async function dispatch(campaign: CampaignDoc): Promise<void> {
  try {
    const result = await runCampaignSend(
      campaign,
      campaign.scheduledAudienceListId ?? '',
      portalOrigin(),
    );
    logger.info(
      `Scheduled campaign "${campaign.name}" sent to ${result.sent} recipient(s), ` +
        `${result.failed} failed, ${result.skipped} skipped`,
    );
  } catch (error) {
    // The claim stands: a campaign whose send blew up must not be retried in a loop, and
    // the delivery log already holds whatever did go out.
    logger.error(error, `Scheduled campaign "${campaign.name}" failed`);
  }
}

/** Sends every campaign whose scheduled moment has arrived, a bounded number per tick. */
export async function dispatchScheduledCampaigns(): Promise<number> {
  let dispatched = 0;
  while (dispatched < MAX_PER_TICK) {
    const campaign = await claimDue(new Date());
    if (!campaign) {
      return dispatched;
    }
    await dispatch(campaign);
    dispatched += 1;
  }
  return dispatched;
}

/** Starts the once-a-minute check that sends campaigns on the schedule marketing set. */
export function startCampaignSchedule(): void {
  const tick = () => {
    dispatchScheduledCampaigns().catch((error: unknown) =>
      logger.error(error, 'Scheduled campaign check failed'),
    );
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Campaign schedule started');
}
