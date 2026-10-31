import { organizationOf, runAsPlatform, runForOrganization } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { recordAudit } from '../audit/audit.service';
import { BillingWebhookEventModel } from './webhook-event.model';
import { SubscriptionModel } from './subscription.model';
import { subscriptionService, type ProviderUpdate } from './subscription.service';
import type { SubscriptionStatus } from './subscription.model';

/**
 * Subscription webhooks for Exyconn's own plans. They arrive on the same signed endpoints as
 * client hub payments (/webhooks/stripe, /webhooks/razorpay); clienthub/payments/webhook.ts
 * hands over every event these predicates claim, after checking the signature.
 */

type Provider = ProviderUpdate['provider'];

const GATEWAY_ACTOR: Record<Provider, { id: string; name: string }> = {
  STRIPE: { id: 'gateway:stripe', name: 'Stripe (billing)' },
  RAZORPAY: { id: 'gateway:razorpay', name: 'Razorpay (billing)' },
};

const DUPLICATE_KEY = 11000;

/** The company and the update one event carries, or null for an event about nothing of ours. */
interface Resolved {
  organizationId: string;
  update: ProviderUpdate;
}

/** The company a provider subscription id belongs to, read across companies. */
async function organizationForSubscription(externalId: string): Promise<string | null> {
  if (!externalId) {
    return null;
  }
  const row = await runAsPlatform(() =>
    SubscriptionModel.findOne({ externalSubscriptionId: externalId }).lean(),
  );
  return row ? organizationOf(row) : null;
}

/**
 * Applies one event exactly once. The ledger row is written first: a provider's retry of the
 * same event id fails on the unique index and is acknowledged without being applied again. If
 * applying throws, the row is removed so the retry (the 500 makes the provider send one) is
 * processed.
 */
async function applyOnce(
  provider: Provider,
  eventId: string,
  type: string,
  eventAt: Date,
  resolve: () => Promise<Resolved | null>,
): Promise<void> {
  try {
    await runAsPlatform(() =>
      BillingWebhookEventModel.create({ provider, eventId, type, eventAt }),
    );
  } catch (error) {
    if ((error as { code?: number }).code === DUPLICATE_KEY) {
      return;
    }
    throw error;
  }
  try {
    const resolved = await resolve();
    const outcome = resolved ? await apply(resolved, type) : 'ignored';
    await runAsPlatform(() =>
      BillingWebhookEventModel.updateOne(
        { provider, eventId },
        { organizationId: resolved?.organizationId ?? '', outcome },
      ),
    );
  } catch (error) {
    await runAsPlatform(() => BillingWebhookEventModel.deleteOne({ provider, eventId }));
    throw error;
  }
}

/** Writes the update to the company's subscription and audits it there. */
async function apply({ organizationId, update }: Resolved, type: string): Promise<string> {
  const changed = await subscriptionService.applyProviderUpdate(organizationId, update);
  if (!changed) {
    return 'stale';
  }
  await runForOrganization(organizationId, () =>
    recordAudit(
      { user: null },
      {
        action: 'UPDATE',
        module: 'Billing',
        entityId: update.externalSubscriptionId,
        entityLabel: 'Subscription',
        summary: `${type}: subscription ${update.status ?? 'updated'}`,
        actor: GATEWAY_ACTOR[update.provider],
      },
    ),
  );
  logger.info(`Billing ${update.provider} ${type} applied to ${organizationId}`);
  return 'applied';
}

const fromSeconds = (value: number | null | undefined): Date | null | undefined => {
  if (value === undefined) return undefined;
  return value === null ? null : new Date(value * 1000);
};

// ---------------------------------------------------------------- Stripe

export interface StripeBillingEvent {
  id?: string;
  type?: string;
  created?: number;
  data?: { object?: Record<string, unknown> };
}

const STRIPE_STATUS: Record<string, SubscriptionStatus> = {
  trialing: 'TRIALING',
  active: 'ACTIVE',
  past_due: 'PAST_DUE',
  unpaid: 'PAST_DUE',
  incomplete: 'PAST_DUE',
  paused: 'PAST_DUE',
  canceled: 'CANCELLED',
  incomplete_expired: 'CANCELLED',
};

const metadataOf = (object: Record<string, unknown>) =>
  (object.metadata ?? {}) as Record<string, string | undefined>;

/** Ours when it is about a subscription, or a checkout that started one of our plans. */
export function isStripeBillingEvent(event: StripeBillingEvent): boolean {
  const type = event.type ?? '';
  if (type.startsWith('customer.subscription.')) {
    return true;
  }
  const object = event.data?.object ?? {};
  return type === 'checkout.session.completed' && object.mode === 'subscription';
}

/** The period end: on the subscription in older API versions, on its item in newer ones. */
function stripePeriodEnd(object: Record<string, unknown>): number | undefined {
  if (typeof object.current_period_end === 'number') return object.current_period_end;
  const items = object.items as { data?: Array<{ current_period_end?: number }> } | undefined;
  return items?.data?.[0]?.current_period_end;
}

async function resolveStripe(event: StripeBillingEvent, eventAt: Date): Promise<Resolved | null> {
  const object = event.data?.object ?? {};
  const meta = metadataOf(object);
  if (event.type === 'checkout.session.completed') {
    if (meta.billing !== 'saas' || !meta.organizationId) return null;
    return {
      organizationId: meta.organizationId,
      update: {
        provider: 'STRIPE',
        eventAt,
        planId: meta.planId,
        externalSubscriptionId: String(object.subscription ?? ''),
        externalCustomerId: String(object.customer ?? ''),
        currency: String(object.currency ?? '').toUpperCase(),
      },
    };
  }
  const subscriptionId = String(object.id ?? '');
  const organizationId =
    meta.billing === 'saas' && meta.organizationId
      ? meta.organizationId
      : await organizationForSubscription(subscriptionId);
  if (!organizationId) return null;
  const deleted = event.type === 'customer.subscription.deleted';
  return {
    organizationId,
    update: {
      provider: 'STRIPE',
      eventAt,
      planId: meta.planId,
      status: deleted ? 'CANCELLED' : STRIPE_STATUS[String(object.status)],
      externalSubscriptionId: subscriptionId,
      externalCustomerId: String(object.customer ?? ''),
      currentPeriodEnd: fromSeconds(stripePeriodEnd(object)),
      trialEndsAt: fromSeconds(object.trial_end as number | null | undefined),
      cancelAtPeriodEnd: Boolean(object.cancel_at_period_end),
    },
  };
}

/** A verified Stripe subscription event (signature already checked by the caller). */
export async function receiveStripeBillingEvent(event: StripeBillingEvent): Promise<void> {
  if (!event.id || !event.type) {
    return;
  }
  const eventAt = new Date((event.created ?? Math.floor(Date.now() / 1000)) * 1000);
  await applyOnce('STRIPE', event.id, event.type, eventAt, () => resolveStripe(event, eventAt));
}

// ---------------------------------------------------------------- Razorpay

export interface RazorpayBillingEvent {
  event?: string;
  created_at?: number;
  payload?: { subscription?: { entity?: Record<string, unknown> } };
}

const RAZORPAY_STATUS: Record<string, SubscriptionStatus> = {
  authenticated: 'TRIALING',
  active: 'ACTIVE',
  pending: 'PAST_DUE',
  halted: 'PAST_DUE',
  paused: 'PAST_DUE',
  cancelled: 'CANCELLED',
  completed: 'CANCELLED',
  expired: 'CANCELLED',
};

export function isRazorpayBillingEvent(event: RazorpayBillingEvent): boolean {
  return (event.event ?? '').startsWith('subscription.');
}

async function resolveRazorpay(
  event: RazorpayBillingEvent,
  eventAt: Date,
): Promise<Resolved | null> {
  const entity = event.payload?.subscription?.entity ?? {};
  const notes = (entity.notes ?? {}) as Record<string, string | undefined>;
  const subscriptionId = String(entity.id ?? '');
  const organizationId =
    notes.billing === 'saas' && notes.organizationId
      ? notes.organizationId
      : await organizationForSubscription(subscriptionId);
  if (!organizationId) return null;
  return {
    organizationId,
    update: {
      provider: 'RAZORPAY',
      eventAt,
      planId: notes.planId,
      status: RAZORPAY_STATUS[String(entity.status)],
      externalSubscriptionId: subscriptionId,
      externalCustomerId: String(entity.customer_id ?? ''),
      currentPeriodEnd: fromSeconds(entity.current_end as number | null | undefined),
    },
  };
}

/**
 * A verified Razorpay subscription event. Razorpay names each delivery in the
 * `x-razorpay-event-id` header; without one the event cannot be deduplicated and is refused.
 */
export async function receiveRazorpayBillingEvent(
  event: RazorpayBillingEvent,
  eventId: string | undefined,
): Promise<boolean> {
  if (!eventId) {
    logger.warn('Razorpay subscription event without an event id');
    return false;
  }
  const eventAt = new Date((event.created_at ?? Math.floor(Date.now() / 1000)) * 1000);
  await applyOnce('RAZORPAY', eventId, event.event ?? '', eventAt, () =>
    resolveRazorpay(event, eventAt),
  );
  return true;
}
