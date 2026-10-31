import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import {
  isRazorpayBillingEvent,
  isStripeBillingEvent,
  receiveRazorpayBillingEvent,
  receiveStripeBillingEvent,
} from '../../../../src/modules/billing/billing.webhook';
import { subscriptionService } from '../../../../src/modules/billing/subscription.service';
import { BillingWebhookEventModel } from '../../../../src/modules/billing/webhook-event.model';
import { newOrganizationId, seedPlan, seedSubscription, subscriptionOf } from './fixtures';

const organizationId = newOrganizationId();
/** Provider event times, in seconds as they send them. */
const T1 = 1_790_000_000;
const T2 = T1 + 60;

let planId: string;
beforeEach(async () => {
  planId = String((await seedPlan())._id);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const ledger = (eventId: string) =>
  runAsPlatform(() => BillingWebhookEventModel.findOne({ eventId }).lean());
const auditCount = () => runForOrganization(organizationId, () => AuditLogModel.countDocuments());

const checkoutCompleted = (id = 'evt_checkout', meta: Record<string, string> = {}) => ({
  id,
  type: 'checkout.session.completed',
  created: T1,
  data: {
    object: {
      mode: 'subscription',
      subscription: 'sub_1',
      customer: 'cus_1',
      currency: 'usd',
      metadata: { billing: 'saas', organizationId, planId, ...meta },
    },
  },
});

const subscriptionEvent = (
  id: string,
  created: number,
  object: Record<string, unknown>,
  type = 'customer.subscription.updated',
) => ({ id, type, created, data: { object: { id: 'sub_1', customer: 'cus_1', ...object } } });

describe('which events are billing’s', () => {
  it('claims Stripe subscription events and subscription checkouts only', () => {
    expect(isStripeBillingEvent({ type: 'customer.subscription.deleted' })).toBe(true);
    expect(
      isStripeBillingEvent({
        type: 'checkout.session.completed',
        data: { object: { mode: 'subscription' } },
      }),
    ).toBe(true);
    expect(
      isStripeBillingEvent({
        type: 'checkout.session.completed',
        data: { object: { mode: 'payment' } },
      }),
    ).toBe(false);
    expect(isStripeBillingEvent({ type: 'checkout.session.completed' })).toBe(false);
    expect(isStripeBillingEvent({})).toBe(false);
  });

  it('claims Razorpay subscription events only', () => {
    expect(isRazorpayBillingEvent({ event: 'subscription.charged' })).toBe(true);
    expect(isRazorpayBillingEvent({ event: 'payment_link.paid' })).toBe(false);
    expect(isRazorpayBillingEvent({})).toBe(false);
  });
});

describe('Stripe subscription events', () => {
  it('records the subscription from the completed checkout and audits it in the company', async () => {
    await receiveStripeBillingEvent(checkoutCompleted());

    expect(await subscriptionOf(organizationId)).toMatchObject({
      planId,
      provider: 'STRIPE',
      externalSubscriptionId: 'sub_1',
      externalCustomerId: 'cus_1',
      currency: 'USD',
      lastEventAt: new Date(T1 * 1000),
    });
    expect(await ledger('evt_checkout')).toMatchObject({ organizationId, outcome: 'applied' });
    const audit = await runForOrganization(organizationId, () => AuditLogModel.findOne().lean());
    expect(audit).toMatchObject({
      module: 'Billing',
      entityId: 'sub_1',
      summary: 'checkout.session.completed: subscription updated',
    });
  });

  it('applies the same event once however many times Stripe delivers it', async () => {
    await receiveStripeBillingEvent(checkoutCompleted());
    await receiveStripeBillingEvent(checkoutCompleted());

    expect(await runAsPlatform(() => BillingWebhookEventModel.countDocuments())).toBe(1);
    expect(await auditCount()).toBe(1);
  });

  it('keeps the newer status when an older event arrives late', async () => {
    await receiveStripeBillingEvent(checkoutCompleted());
    await receiveStripeBillingEvent(
      subscriptionEvent('evt_new', T2, {
        status: 'active',
        metadata: { billing: 'saas', organizationId },
      }),
    );
    await receiveStripeBillingEvent(
      subscriptionEvent('evt_old', T1 + 1, {
        status: 'past_due',
        metadata: { billing: 'saas', organizationId },
      }),
    );

    expect((await subscriptionOf(organizationId))?.status).toBe('ACTIVE');
    expect(await ledger('evt_old')).toMatchObject({ outcome: 'stale' });
    expect(await auditCount()).toBe(2);
  });

  it('maps period end, trial end and a pending cancellation from the subscription', async () => {
    await receiveStripeBillingEvent(checkoutCompleted());
    await receiveStripeBillingEvent(
      subscriptionEvent('evt_trial', T2, {
        status: 'trialing',
        current_period_end: T2 + 1000,
        trial_end: T2 + 500,
        cancel_at_period_end: true,
      }),
    );

    expect(await subscriptionOf(organizationId)).toMatchObject({
      status: 'TRIALING',
      currentPeriodEnd: new Date((T2 + 1000) * 1000),
      trialEndsAt: new Date((T2 + 500) * 1000),
      cancelAtPeriodEnd: true,
    });
  });

  it('reads the period end from the item in newer API versions and clears a trial end', async () => {
    await receiveStripeBillingEvent(checkoutCompleted());
    await receiveStripeBillingEvent(
      subscriptionEvent('evt_items', T2, {
        status: 'active',
        items: { data: [{ current_period_end: T2 + 2000 }] },
        trial_end: null,
      }),
    );

    expect(await subscriptionOf(organizationId)).toMatchObject({
      status: 'ACTIVE',
      currentPeriodEnd: new Date((T2 + 2000) * 1000),
      trialEndsAt: null,
    });
  });

  it('finds the company by its subscription id when the event carries no metadata', async () => {
    await receiveStripeBillingEvent(checkoutCompleted());
    await receiveStripeBillingEvent(
      subscriptionEvent('evt_deleted', T2, { status: 'active' }, 'customer.subscription.deleted'),
    );

    const row = await subscriptionOf(organizationId);
    expect(row?.status).toBe('CANCELLED');
    expect(row?.cancelledAt).toEqual(new Date(T2 * 1000));
  });

  it('acknowledges events about nothing of ours without touching any company', async () => {
    await receiveStripeBillingEvent(checkoutCompleted('evt_foreign', { billing: 'other' }));
    await receiveStripeBillingEvent(checkoutCompleted('evt_no_org', { organizationId: '' }));
    await receiveStripeBillingEvent(subscriptionEvent('evt_unknown', T2, { id: 'sub_unknown' }));
    await receiveStripeBillingEvent(subscriptionEvent('evt_blank', T2, { id: '' }));
    await receiveStripeBillingEvent({
      id: 'evt_idless',
      type: 'customer.subscription.updated',
      created: T2,
      data: { object: { status: 'active' } },
    });
    await receiveStripeBillingEvent({
      id: 'evt_bare',
      type: 'checkout.session.completed',
      created: T1,
    });

    expect(await subscriptionOf(organizationId)).toBeNull();
    for (const id of [
      'evt_foreign',
      'evt_no_org',
      'evt_unknown',
      'evt_blank',
      'evt_idless',
      'evt_bare',
    ]) {
      expect(await ledger(id)).toMatchObject({ organizationId: '', outcome: 'ignored' });
    }
  });

  it('records a bare subscription event with defaults for every missing field', async () => {
    await seedSubscription(
      organizationId,
      { _id: planId, key: 'growth' },
      {
        status: 'ACTIVE',
        externalSubscriptionId: 'sub_bare',
      },
    );

    await receiveStripeBillingEvent({
      id: 'evt_min',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_bare' } },
    });

    const row = await subscriptionOf(organizationId);
    expect(row?.externalCustomerId).toBe('');
    expect(row?.lastEventAt?.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('records a checkout that names our company but carries no subscription details', async () => {
    await receiveStripeBillingEvent({
      id: 'evt_sparse',
      type: 'checkout.session.completed',
      created: T1,
      data: {
        object: { mode: 'subscription', metadata: { billing: 'saas', organizationId, planId } },
      },
    });

    expect(await subscriptionOf(organizationId)).toMatchObject({
      planId,
      externalSubscriptionId: '',
      externalCustomerId: '',
      currency: '',
    });
    const audit = await runForOrganization(organizationId, () => AuditLogModel.findOne().lean());
    expect(audit?.entityId).toBe('');
  });

  it('ignores a delivery without an id or a type', async () => {
    await receiveStripeBillingEvent({ type: 'customer.subscription.updated' });
    await receiveStripeBillingEvent({ id: 'evt_typeless' });

    expect(await runAsPlatform(() => BillingWebhookEventModel.countDocuments())).toBe(0);
  });

  it('forgets an event whose handling failed, so the provider’s retry is applied', async () => {
    jest
      .spyOn(subscriptionService, 'applyProviderUpdate')
      .mockRejectedValueOnce(new Error('database down'));

    await expect(receiveStripeBillingEvent(checkoutCompleted())).rejects.toThrow('database down');
    expect(await ledger('evt_checkout')).toBeNull();

    await receiveStripeBillingEvent(checkoutCompleted());
    expect(await ledger('evt_checkout')).toMatchObject({ outcome: 'applied' });
  });

  it('passes on a ledger failure that is not a duplicate', async () => {
    jest
      .spyOn(BillingWebhookEventModel, 'create')
      .mockRejectedValueOnce(new Error('write failed') as never);

    await expect(receiveStripeBillingEvent(checkoutCompleted())).rejects.toThrow('write failed');
    expect(await subscriptionOf(organizationId)).toBeNull();
  });
});

describe('Razorpay subscription events', () => {
  const razorpayEvent = (
    event: string,
    createdAt: number | undefined,
    entity: Record<string, unknown>,
  ) => ({ event, created_at: createdAt, payload: { subscription: { entity } } });
  const activated = () =>
    razorpayEvent('subscription.activated', T1, {
      id: 'sub_rp_1',
      status: 'active',
      customer_id: 'cust_1',
      current_end: T1 + 3000,
      notes: { billing: 'saas', organizationId, planId },
    });

  it('records the subscription the notes name, once per event id', async () => {
    expect(await receiveRazorpayBillingEvent(activated(), 'evt_rp_1')).toBe(true);
    expect(await receiveRazorpayBillingEvent(activated(), 'evt_rp_1')).toBe(true);

    expect(await subscriptionOf(organizationId)).toMatchObject({
      planId,
      provider: 'RAZORPAY',
      status: 'ACTIVE',
      externalSubscriptionId: 'sub_rp_1',
      externalCustomerId: 'cust_1',
      currentPeriodEnd: new Date((T1 + 3000) * 1000),
    });
    expect(await auditCount()).toBe(1);
  });

  it('finds the company by subscription id, and keeps the newer status over a late event', async () => {
    await receiveRazorpayBillingEvent(activated(), 'evt_rp_1');
    await receiveRazorpayBillingEvent(
      razorpayEvent('subscription.cancelled', T2, { id: 'sub_rp_1', status: 'cancelled' }),
      'evt_rp_2',
    );
    await receiveRazorpayBillingEvent(
      razorpayEvent('subscription.halted', T1 + 1, { id: 'sub_rp_1', status: 'halted' }),
      'evt_rp_3',
    );

    expect((await subscriptionOf(organizationId))?.status).toBe('CANCELLED');
    expect(await ledger('evt_rp_3')).toMatchObject({ outcome: 'stale' });
  });

  it('acknowledges an event about a subscription we do not know', async () => {
    await receiveRazorpayBillingEvent(
      razorpayEvent('subscription.charged', undefined, {}),
      'evt_rp_unknown',
    );
    await receiveRazorpayBillingEvent({ event: 'subscription.charged' }, 'evt_rp_empty');

    expect(await ledger('evt_rp_unknown')).toMatchObject({ outcome: 'ignored' });
    expect(await ledger('evt_rp_empty')).toMatchObject({
      outcome: 'ignored',
      type: 'subscription.charged',
    });
  });

  it('fails an unnamed event and keeps no ledger row, so a corrected retry is processed', async () => {
    await expect(receiveRazorpayBillingEvent({}, 'evt_rp_unnamed')).rejects.toThrow();
    expect(await ledger('evt_rp_unnamed')).toBeNull();
  });

  it('refuses a delivery without an event id, which could not be deduplicated', async () => {
    expect(await receiveRazorpayBillingEvent(activated(), undefined)).toBe(false);
    expect(await subscriptionOf(organizationId)).toBeNull();
  });
});
