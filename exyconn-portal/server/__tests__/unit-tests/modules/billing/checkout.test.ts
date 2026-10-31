import { runAsPlatform } from '../../../../src/lib/tenant';
import {
  availableProviders,
  cancelSubscription,
  startCheckout,
} from '../../../../src/modules/billing/checkout';
import { PlanModel } from '../../../../src/modules/billing/plan.model';
import { configureGateways } from '../clienthub/payments/fixtures';
import { newOrganizationId, seedPlan, seedSubscription, subscriptionOf } from './fixtures';

const DAY_MS = 24 * 60 * 60 * 1000;
const PORTAL = 'https://admin.exyconn.test';
const organizationId = newOrganizationId();

let fetchMock: jest.SpyInstance;

/** Answers each provider endpoint with its own body; records every request. */
function routeFetch(routes: Record<string, unknown>) {
  fetchMock.mockImplementation(async (url: string) => {
    const path = Object.keys(routes).find((suffix) => url.endsWith(suffix));
    return new Response(JSON.stringify(path ? routes[path] : {}), { status: 200 });
  });
}
const callsTo = (suffix: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url).endsWith(suffix)) as [string, RequestInit][];

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
  routeFetch({
    '/checkout/sessions': { id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' },
    '/plans': { id: 'plan_rp_1' },
    '/subscriptions': { id: 'sub_rp_1', short_url: 'https://rzp.io/i/sub' },
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const checkout = (planId: string, provider: 'STRIPE' | 'RAZORPAY', currency = 'usd') =>
  startCheckout(organizationId, { planId, currency, provider }, 'ada@acme.test', PORTAL);

describe('startCheckout with Stripe', () => {
  beforeEach(async () => {
    await configureGateways(['STRIPE']);
  });

  it('opens a checkout at the plan’s price with no trial when none is owed', async () => {
    const plan = await seedPlan({ prices: [{ currency: 'USD', amount: 49 }], interval: 'YEAR' });

    const url = await checkout(String(plan._id), 'STRIPE');

    expect(url).toBe('https://checkout.stripe.com/c/cs_1');
    const body = callsTo('/checkout/sessions')[0][1].body as URLSearchParams;
    expect(body.get('line_items[0][price_data][unit_amount]')).toBe('4900');
    expect(body.get('line_items[0][price_data][recurring][interval]')).toBe('year');
    expect(body.get('subscription_data[trial_period_days]')).toBeNull();
    expect(body.get('success_url')).toBe(`${PORTAL}/admin/billing?checkout=done`);
    expect(body.get('cancel_url')).toBe(`${PORTAL}/admin/billing?checkout=cancelled`);
    expect(body.get('metadata[organizationId]')).toBe(organizationId);
    expect(await subscriptionOf(organizationId)).toBeNull();
  });

  it('carries the whole days left of a running trial so paying early loses none', async () => {
    const plan = await seedPlan();
    await seedSubscription(organizationId, plan, {
      status: 'TRIALING',
      trialEndsAt: new Date(Date.now() + 5 * DAY_MS + 60_000),
    });

    await checkout(String(plan._id), 'STRIPE');

    const body = callsTo('/checkout/sessions')[0][1].body as URLSearchParams;
    expect(body.get('subscription_data[trial_period_days]')).toBe('5');
    expect(body.get('line_items[0][price_data][recurring][interval]')).toBe('month');
  });

  it('owes no trial days from a trial that has already ended or a trial with no end', async () => {
    const plan = await seedPlan();
    await seedSubscription(organizationId, plan, {
      status: 'TRIALING',
      trialEndsAt: new Date(Date.now() - DAY_MS),
    });
    await checkout(String(plan._id), 'STRIPE');

    const other = newOrganizationId();
    await seedSubscription(other, plan, { status: 'TRIALING', trialEndsAt: null });
    await startCheckout(
      other,
      { planId: String(plan._id), currency: 'USD', provider: 'STRIPE' },
      'b@acme.test',
      PORTAL,
    );

    for (const [, init] of callsTo('/checkout/sessions')) {
      expect((init.body as URLSearchParams).get('subscription_data[trial_period_days]')).toBeNull();
    }
  });

  it.each([
    ['a retired plan', { isActive: false }, 'usd', 'This plan has been retired. Choose another.'],
    ['a free plan', { prices: [] }, 'usd', 'This plan is free; it needs no checkout.'],
    ['a currency the plan is not sold in', {}, 'eur', 'This plan is not sold in EUR.'],
  ])('refuses %s without calling Stripe', async (_label, fields, currency, message) => {
    const plan = await seedPlan(fields);

    await expect(checkout(String(plan._id), 'STRIPE', currency)).rejects.toThrow(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

it('refuses a gateway that is not configured', async () => {
  const plan = await seedPlan({ prices: [{ currency: 'USD', amount: 49 }] });

  await expect(checkout(String(plan._id), 'STRIPE')).rejects.toThrow('Stripe is not configured.');
  await expect(checkout(String(plan._id), 'RAZORPAY')).rejects.toThrow(
    'Razorpay is not configured.',
  );
});

describe('startCheckout with Razorpay', () => {
  beforeEach(async () => {
    await configureGateways(['RAZORPAY']);
  });

  it('creates the Razorpay plan once and reuses it for the same price', async () => {
    const plan = await seedPlan({ prices: [{ currency: 'INR', amount: 3999 }] });

    const url = await checkout(String(plan._id), 'RAZORPAY', 'inr');
    await checkout(String(plan._id), 'RAZORPAY', 'INR');

    expect(url).toBe('https://rzp.io/i/sub');
    expect(callsTo('/plans')).toHaveLength(1);
    expect(JSON.parse(String(callsTo('/plans')[0][1].body)).period).toBe('monthly');
    const stored = await runAsPlatform(() => PlanModel.findById(plan._id).lean());
    expect(stored?.razorpayPlans).toEqual([
      { currency: 'INR', amount: 3999, interval: 'MONTH', planId: 'plan_rp_1' },
    ]);
    const body = JSON.parse(String(callsTo('/subscriptions')[0][1].body));
    expect(body).toMatchObject({
      plan_id: 'plan_rp_1',
      total_count: 120,
      notes: { billing: 'saas', organizationId, planId: String(plan._id) },
    });
    expect(body).not.toHaveProperty('start_at');
  });

  it('makes a new Razorpay plan when the price or interval changed', async () => {
    const plan = await seedPlan({
      interval: 'YEAR',
      prices: [{ currency: 'INR', amount: 39990 }],
      razorpayPlans: [
        { currency: 'INR', amount: 3999, interval: 'YEAR', planId: 'old_price' },
        { currency: 'INR', amount: 39990, interval: 'MONTH', planId: 'old_interval' },
      ],
    });

    await checkout(String(plan._id), 'RAZORPAY', 'INR');

    expect(JSON.parse(String(callsTo('/plans')[0][1].body)).period).toBe('yearly');
    expect(JSON.parse(String(callsTo('/subscriptions')[0][1].body)).total_count).toBe(10);
  });

  it('starts the Razorpay subscription when the trial owed runs out', async () => {
    const plan = await seedPlan({
      prices: [{ currency: 'INR', amount: 3999 }],
      razorpayPlans: [{ currency: 'INR', amount: 3999, interval: 'MONTH', planId: 'cached' }],
    });
    const trialEndsAt = new Date(Date.now() + 3 * DAY_MS + 60_000);
    await seedSubscription(organizationId, plan, { status: 'TRIALING', trialEndsAt });

    await checkout(String(plan._id), 'RAZORPAY', 'INR');

    expect(callsTo('/plans')).toHaveLength(0);
    const body = JSON.parse(String(callsTo('/subscriptions')[0][1].body));
    expect(body.plan_id).toBe('cached');
    expect(body.start_at).toBeGreaterThanOrEqual(Math.floor((Date.now() + 3 * DAY_MS) / 1000) - 5);
    expect(body.start_at).toBeLessThan(Math.floor(trialEndsAt.getTime() / 1000));
  });
});

describe('cancelSubscription', () => {
  it('refuses a company with no subscription, or one already cancelled', async () => {
    await expect(cancelSubscription(organizationId)).rejects.toThrow(
      'There is no subscription to cancel.',
    );
    await seedSubscription(organizationId, await seedPlan(), { status: 'CANCELLED' });
    await expect(cancelSubscription(organizationId)).rejects.toThrow(
      'There is no subscription to cancel.',
    );
  });

  it('ends a trial or manual plan now', async () => {
    await seedSubscription(organizationId, await seedPlan(), { status: 'TRIALING' });

    await cancelSubscription(organizationId);

    expect((await subscriptionOf(organizationId))?.status).toBe('CANCELLED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ends a Stripe subscription with its period, leaving it ACTIVE until the webhook', async () => {
    await configureGateways(['STRIPE']);
    await seedSubscription(organizationId, await seedPlan(), {
      status: 'ACTIVE',
      provider: 'STRIPE',
      externalSubscriptionId: 'sub_1',
    });

    await cancelSubscription(organizationId);

    expect(callsTo('/subscriptions/sub_1')).toHaveLength(1);
    expect(await subscriptionOf(organizationId)).toMatchObject({
      status: 'ACTIVE',
      cancelAtPeriodEnd: true,
    });
  });

  it('ends a Razorpay subscription with its cycle', async () => {
    await configureGateways(['RAZORPAY']);
    await seedSubscription(organizationId, await seedPlan(), {
      status: 'ACTIVE',
      provider: 'RAZORPAY',
      externalSubscriptionId: 'sub_rp_1',
    });

    await cancelSubscription(organizationId);

    expect(callsTo('/subscriptions/sub_rp_1/cancel')).toHaveLength(1);
    expect((await subscriptionOf(organizationId))?.cancelAtPeriodEnd).toBe(true);
  });

  it('refuses to cancel at a gateway that is no longer configured, changing nothing', async () => {
    const plan = await seedPlan();
    await seedSubscription(organizationId, plan, {
      status: 'ACTIVE',
      provider: 'STRIPE',
      externalSubscriptionId: 'sub_1',
    });
    const other = newOrganizationId();
    await seedSubscription(other, plan, {
      status: 'ACTIVE',
      provider: 'RAZORPAY',
      externalSubscriptionId: 'sub_rp_1',
    });

    await expect(cancelSubscription(organizationId)).rejects.toThrow('Stripe is not configured.');
    await expect(cancelSubscription(other)).rejects.toThrow('Razorpay is not configured.');
    expect((await subscriptionOf(organizationId))?.cancelAtPeriodEnd).toBe(false);
  });

  it('ends a gateway subscription with no external id now, as there is nothing to cancel there', async () => {
    await seedSubscription(organizationId, await seedPlan(), {
      status: 'ACTIVE',
      provider: 'STRIPE',
      externalSubscriptionId: '',
    });

    await cancelSubscription(organizationId);

    expect((await subscriptionOf(organizationId))?.status).toBe('CANCELLED');
  });
});

describe('availableProviders', () => {
  it('lists only the configured gateways', async () => {
    expect(await availableProviders()).toEqual([]);
    await configureGateways(['RAZORPAY']);
    expect(await availableProviders()).toEqual(['RAZORPAY']);
    await configureGateways(['STRIPE']);
    expect(await availableProviders()).toEqual(['STRIPE', 'RAZORPAY']);
  });
});
