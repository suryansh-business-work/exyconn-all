import {
  cancelStripeSubscriptionAtPeriodEnd,
  createStripeSubscriptionCheckout,
} from '../../../../src/modules/clienthub/payments/stripe.client';
import {
  cancelRazorpaySubscriptionAtCycleEnd,
  createRazorpayPlan,
  createRazorpaySubscription,
} from '../../../../src/modules/clienthub/payments/razorpay.client';

/** Never a literal credential: each only has to look like a long key. */
const STRIPE_KEY = `sk_test_${'k'.repeat(24)}`;
const keys = { keyId: 'rzp_test_id', keySecret: `ks_${'k'.repeat(24)}` };

let fetchMock: jest.SpyInstance;
const respond = (status: number, body: unknown) => {
  fetchMock.mockImplementation(async () => new Response(JSON.stringify(body), { status }));
};
const lastCall = () => fetchMock.mock.calls.at(-1) as [string, RequestInit];

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  jest.restoreAllMocks();
});

const checkout = {
  planName: 'Growth',
  amount: 49.5,
  currency: 'USD',
  interval: 'month' as const,
  trialDays: 0,
  customerEmail: 'ada@acme.test',
  organizationId: 'org-1',
  planId: 'plan-1',
  successUrl: 'https://admin.test/admin/billing?checkout=done',
  cancelUrl: 'https://admin.test/admin/billing?checkout=cancelled',
};

describe('createStripeSubscriptionCheckout', () => {
  it('opens a recurring checkout in minor units that carries the company in its metadata', async () => {
    respond(200, { id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' });

    const session = await createStripeSubscriptionCheckout(STRIPE_KEY, checkout);

    expect(session).toEqual({ externalId: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' });
    const [url, init] = lastCall();
    expect(url).toBe('https://api.stripe.com/v1/checkout/sessions');
    const body = init.body as URLSearchParams;
    expect(body.get('mode')).toBe('subscription');
    expect(body.get('line_items[0][price_data][currency]')).toBe('usd');
    expect(body.get('line_items[0][price_data][unit_amount]')).toBe('4950');
    expect(body.get('line_items[0][price_data][recurring][interval]')).toBe('month');
    expect(body.get('metadata[billing]')).toBe('saas');
    expect(body.get('metadata[organizationId]')).toBe('org-1');
    expect(body.get('subscription_data[metadata][planId]')).toBe('plan-1');
    expect(body.get('subscription_data[trial_period_days]')).toBeNull();
  });

  it('passes the trial days still owed', async () => {
    respond(200, { id: 'cs_2', url: 'https://checkout.stripe.com/c/cs_2' });

    await createStripeSubscriptionCheckout(STRIPE_KEY, { ...checkout, trialDays: 5 });

    const body = lastCall()[1].body as URLSearchParams;
    expect(body.get('subscription_data[trial_period_days]')).toBe('5');
  });

  it('reports Stripe’s refusal', async () => {
    respond(400, { error: { message: 'Invalid currency' } });

    await expect(createStripeSubscriptionCheckout(STRIPE_KEY, checkout)).rejects.toThrow(
      'Stripe: Invalid currency',
    );
  });
});

describe('cancelStripeSubscriptionAtPeriodEnd', () => {
  it('asks Stripe to end the subscription with its paid period', async () => {
    respond(200, { id: 'sub/1' });

    await cancelStripeSubscriptionAtPeriodEnd(STRIPE_KEY, 'sub/1');

    const [url, init] = lastCall();
    expect(url).toBe('https://api.stripe.com/v1/subscriptions/sub%2F1');
    expect((init.body as URLSearchParams).get('cancel_at_period_end')).toBe('true');
  });
});

describe('createRazorpayPlan', () => {
  it('creates a plan of one period in minor units and returns its id', async () => {
    respond(200, { id: 'plan_rp_1' });

    const id = await createRazorpayPlan(keys, {
      name: 'Growth',
      amount: 3999,
      currency: 'inr',
      period: 'yearly',
    });

    expect(id).toBe('plan_rp_1');
    const [url, init] = lastCall();
    expect(url).toBe('https://api.razorpay.com/v1/plans');
    expect(JSON.parse(String(init.body))).toEqual({
      period: 'yearly',
      interval: 1,
      item: { name: 'Growth', amount: 399900, currency: 'INR' },
    });
  });
});

describe('createRazorpaySubscription', () => {
  it('starts a subscription later when a trial is owed, carrying the company in notes', async () => {
    respond(200, { id: 'sub_rp_1', short_url: 'https://rzp.io/i/sub' });

    const subscription = await createRazorpaySubscription(keys, {
      planId: 'plan_rp_1',
      totalCount: 120,
      startAt: 1_800_000_000,
      notes: { billing: 'saas', organizationId: 'org-1' },
    });

    expect(subscription).toEqual({ externalId: 'sub_rp_1', url: 'https://rzp.io/i/sub' });
    expect(JSON.parse(String(lastCall()[1].body))).toEqual({
      plan_id: 'plan_rp_1',
      total_count: 120,
      customer_notify: 1,
      start_at: 1_800_000_000,
      notes: { billing: 'saas', organizationId: 'org-1' },
    });
  });

  it('starts at once with no trial', async () => {
    respond(200, { id: 'sub_rp_2', short_url: 'https://rzp.io/i/sub2' });

    await createRazorpaySubscription(keys, { planId: 'plan_rp_1', totalCount: 10, notes: {} });

    expect(JSON.parse(String(lastCall()[1].body))).not.toHaveProperty('start_at');
  });
});

describe('cancelRazorpaySubscriptionAtCycleEnd', () => {
  it('asks Razorpay to end the subscription with the paid cycle', async () => {
    respond(200, {});

    await cancelRazorpaySubscriptionAtCycleEnd(keys, 'sub_rp_1');

    const [url, init] = lastCall();
    expect(url).toBe('https://api.razorpay.com/v1/subscriptions/sub_rp_1/cancel');
    expect(JSON.parse(String(init.body))).toEqual({ cancel_at_cycle_end: 1 });
  });

  it('reports Razorpay’s refusal', async () => {
    respond(400, { error: { description: 'Subscription is not cancellable' } });

    await expect(cancelRazorpaySubscriptionAtCycleEnd(keys, 'sub_rp_1')).rejects.toThrow(
      'Razorpay: Subscription is not cancellable',
    );
  });
});
