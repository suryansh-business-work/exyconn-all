import { randomBytes } from 'node:crypto';
import { WebhookDeliveryModel, WebhookModel, type WebhookDeliveryDoc } from './webhook.model';
import {
  MAX_ATTEMPTS,
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  nextAttemptAfter,
  signPayload,
} from './webhook.signing';
import { logger } from '../../utils/logger';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';

/** How often the process asks whether a delivery is due. */
const TICK_MS = 60_000;
/** How many deliveries one tick attempts before leaving the rest to the next. */
const MAX_PER_TICK = 25;
/** A receiver that has not answered in this long has failed. */
const TIMEOUT_MS = 10_000;

/** A fresh signing secret for a new endpoint. */
export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString('base64url')}`;
}

/**
 * Queues an event for every endpoint that asked for it.
 *
 * Queued, never sent inline: the thing that emitted this — an invoice being paid — must not
 * get slower, or fail, because somebody's endpoint is down. It returns as soon as the rows
 * exist.
 */
export async function emitWebhook(event: string, payload: unknown): Promise<number> {
  const hooks = await WebhookModel.find({ active: true, events: event }).select('_id').lean();
  if (hooks.length === 0) {
    return 0;
  }
  const body = JSON.stringify({ event, sentAt: new Date().toISOString(), data: payload });
  await WebhookDeliveryModel.insertMany(
    hooks.map((hook) => ({
      webhookId: String(hook._id),
      event,
      payload: body,
      status: 'PENDING',
      nextAttemptAt: new Date(),
    })),
  );
  return hooks.length;
}

/**
 * Claims one due delivery by pushing its next attempt out.
 *
 * A compare-and-set on `nextAttemptAt`, the same shape the recurring-invoice claim uses: the
 * update matches the exact value the read saw, so two workers racing cannot both post the
 * same event to a customer's endpoint.
 */
async function claimDue(now: Date): Promise<WebhookDeliveryDoc | null> {
  const candidate = await WebhookDeliveryModel.findOne({
    status: { $in: ['PENDING', 'FAILED'] },
    nextAttemptAt: { $lte: now },
  }).sort({ nextAttemptAt: 1 });

  if (!candidate) {
    return null;
  }
  const claimed = await WebhookDeliveryModel.findOneAndUpdate(
    { _id: candidate._id, nextAttemptAt: candidate.nextAttemptAt },
    { nextAttemptAt: nextAttemptAfter(candidate.attempts, now), $inc: { attempts: 1 } },
    { new: true },
  );
  return claimed;
}

/** Posts one delivery, signed, and records what the receiver said. */
async function attempt(delivery: WebhookDeliveryDoc): Promise<void> {
  const hook = await WebhookModel.findById(delivery.webhookId);
  if (!hook || !hook.active) {
    // The endpoint is gone or switched off; there is nothing to retry into.
    await WebhookDeliveryModel.updateOne(
      { _id: delivery._id },
      { status: 'DEAD', error: 'The endpoint no longer exists or is inactive' },
    );
    return;
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(hook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [SIGNATURE_HEADER]: signPayload(hook.secret, timestamp, delivery.payload),
        [TIMESTAMP_HEADER]: timestamp,
      },
      body: delivery.payload,
      signal: controller.signal,
    });

    if (response.ok) {
      await WebhookDeliveryModel.updateOne(
        { _id: delivery._id },
        {
          status: 'DELIVERED',
          responseStatus: response.status,
          error: '',
          deliveredAt: new Date(),
        },
      );
      await WebhookModel.updateOne(
        { _id: hook._id },
        { lastDeliveredAt: new Date(), failureCount: 0 },
      );
      return;
    }
    await recordFailure(delivery, `HTTP ${response.status}`, response.status);
  } catch (error) {
    await recordFailure(delivery, error instanceof Error ? error.message : 'Delivery failed', null);
  } finally {
    globalThis.clearTimeout(timer);
  }

  await WebhookModel.updateOne({ _id: hook._id }, { $inc: { failureCount: 1 } });
}

/** Marks an attempt failed, or dead once the retries are exhausted. */
async function recordFailure(
  delivery: WebhookDeliveryDoc,
  error: string,
  responseStatus: number | null,
): Promise<void> {
  // `attempts` was already incremented by the claim, so this is the count including this one.
  const exhausted = delivery.attempts >= MAX_ATTEMPTS;
  await WebhookDeliveryModel.updateOne(
    { _id: delivery._id },
    { status: exhausted ? 'DEAD' : 'FAILED', error, responseStatus },
  );
}

/** Attempts every delivery whose moment has come, a bounded number per tick. */
export async function deliverDueWebhooks(now: Date = new Date()): Promise<number> {
  let delivered = 0;
  while (delivered < MAX_PER_TICK) {
    const delivery = await claimDue(now);
    if (!delivery) {
      break;
    }
    await attempt(delivery);
    delivered += 1;
  }
  recordJobRun(JOB_KEYS.webhookDelivery, `${delivered} delivery attempt(s)`);
  return delivered;
}

/** Starts the once-a-minute delivery loop. */
export function startWebhookDelivery(): void {
  const tick = () => {
    deliverDueWebhooks().catch((error: unknown) =>
      logger.error(error, 'Webhook delivery tick failed'),
    );
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Webhook delivery started');
}
