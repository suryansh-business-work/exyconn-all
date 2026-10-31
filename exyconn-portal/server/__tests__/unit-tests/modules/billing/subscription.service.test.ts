import { runForOrganization } from '../../../../src/lib/tenant';
import { AiJobModel } from '../../../../src/modules/ai/ai.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { invalidatePlanAccess, planAccessFor } from '../../../../src/modules/billing/access';
import {
  isFreePlan,
  subscriptionService,
} from '../../../../src/modules/billing/subscription.service';
import { newOrganizationId, seedPlan, seedSubscription, subscriptionOf } from './fixtures';

const DAY_MS = 24 * 60 * 60 * 1000;
const organizationId = newOrganizationId();
const at = (iso: string) => new Date(iso);

beforeEach(() => {
  invalidatePlanAccess();
});

describe('isFreePlan', () => {
  const priced = (...amounts: number[]) =>
    ({
      prices: amounts.map((amount, i) => ({ currency: ['USD', 'EUR'][i], amount })),
    }) as unknown as Parameters<typeof isFreePlan>[0];

  it('is free with no price or only zero prices, and paid with any price above zero', () => {
    expect(isFreePlan(priced())).toBe(true);
    expect(isFreePlan(priced(0))).toBe(true);
    expect(isFreePlan(priced(0, 1))).toBe(false);
  });
});

describe('startTrial', () => {
  it('starts a paid plan as a trial of the plan’s length with no gateway yet', async () => {
    const plan = await seedPlan({ trialDays: 7 });
    const before = Date.now();

    await subscriptionService.startTrial(organizationId, plan);

    const row = await subscriptionOf(organizationId);
    expect(row).toMatchObject({ planKey: 'growth', status: 'TRIALING', provider: 'NONE' });
    const ends = row?.trialEndsAt?.getTime() ?? 0;
    expect(ends).toBeGreaterThanOrEqual(before + 7 * DAY_MS);
    expect(ends).toBeLessThanOrEqual(Date.now() + 7 * DAY_MS);
  });

  it('puts a free plan straight on ACTIVE with no trial', async () => {
    const plan = await seedPlan({ key: 'free', prices: [] });

    await subscriptionService.startTrial(organizationId, plan);

    expect(await subscriptionOf(organizationId)).toMatchObject({
      status: 'ACTIVE',
      provider: 'MANUAL',
      trialEndsAt: null,
    });
  });

  it('never replaces a subscription the company already has', async () => {
    const paid = await seedPlan({ key: 'paid' });
    await seedSubscription(organizationId, paid, { status: 'ACTIVE', provider: 'STRIPE' });

    await subscriptionService.startTrial(organizationId, await seedPlan({ key: 'other' }));

    expect(await subscriptionOf(organizationId)).toMatchObject({
      planKey: 'paid',
      status: 'ACTIVE',
      provider: 'STRIPE',
    });
  });
});

describe('assign', () => {
  it('places a company with no subscription on a plan by hand', async () => {
    const plan = await seedPlan({ modules: ['HR'] });

    const { before, plan: placed } = await subscriptionService.assign(
      organizationId,
      String(plan._id),
      'ACTIVE',
    );

    expect(before).toBeNull();
    expect(placed.key).toBe('growth');
    expect(await subscriptionOf(organizationId)).toMatchObject({
      planKey: 'growth',
      status: 'ACTIVE',
      provider: 'MANUAL',
      cancelledAt: null,
    });
    expect((await planAccessFor(organizationId)).roles).toEqual(['HR']);
  });

  it('moves a gateway subscription to MANUAL and stamps a cancellation', async () => {
    const old = await seedPlan({ key: 'old' });
    await seedSubscription(organizationId, old, {
      status: 'ACTIVE',
      provider: 'STRIPE',
      cancelAtPeriodEnd: true,
    });
    const plan = await seedPlan({ key: 'new' });

    const { before } = await subscriptionService.assign(
      organizationId,
      String(plan._id),
      'CANCELLED',
    );

    expect(before?.planKey).toBe('old');
    const row = await subscriptionOf(organizationId);
    expect(row).toMatchObject({
      planKey: 'new',
      status: 'CANCELLED',
      provider: 'MANUAL',
      cancelAtPeriodEnd: false,
    });
    expect(row?.cancelledAt).toBeInstanceOf(Date);
  });

  it('refuses a plan that does not exist', async () => {
    await expect(
      subscriptionService.assign(organizationId, newOrganizationId(), 'ACTIVE'),
    ).rejects.toThrow('Plan not found');
    expect(await subscriptionOf(organizationId)).toBeNull();
  });
});

describe('applyProviderUpdate', () => {
  it('creates the row from the event that names the plan', async () => {
    const plan = await seedPlan();

    const changed = await subscriptionService.applyProviderUpdate(organizationId, {
      provider: 'STRIPE',
      eventAt: at('2026-10-01T00:00:00Z'),
      planId: String(plan._id),
      status: 'ACTIVE',
      externalSubscriptionId: 'sub_1',
      currency: 'USD',
    });

    expect(changed).toBe(true);
    expect(await subscriptionOf(organizationId)).toMatchObject({
      planKey: 'growth',
      status: 'ACTIVE',
      provider: 'STRIPE',
      externalSubscriptionId: 'sub_1',
      currency: 'USD',
    });
  });

  it('changes nothing for an event about a company with no row and no plan named', async () => {
    const changed = await subscriptionService.applyProviderUpdate(organizationId, {
      provider: 'STRIPE',
      eventAt: at('2026-10-01T00:00:00Z'),
      status: 'ACTIVE',
    });

    expect(changed).toBe(false);
    expect(await subscriptionOf(organizationId)).toBeNull();
  });

  it('ignores an event older than the newest applied, so a late delivery never rolls back', async () => {
    const plan = await seedPlan();
    await seedSubscription(organizationId, plan, {
      status: 'ACTIVE',
      lastEventAt: at('2026-10-02T00:00:00Z'),
    });

    const changed = await subscriptionService.applyProviderUpdate(organizationId, {
      provider: 'STRIPE',
      eventAt: at('2026-10-01T00:00:00Z'),
      status: 'PAST_DUE',
    });

    expect(changed).toBe(false);
    expect((await subscriptionOf(organizationId))?.status).toBe('ACTIVE');
  });

  it('applies an event at the same moment, keeps fields it does not name, and stamps a cancellation', async () => {
    const plan = await seedPlan();
    await seedSubscription(organizationId, plan, {
      status: 'ACTIVE',
      externalSubscriptionId: 'sub_1',
      currency: 'USD',
      lastEventAt: at('2026-10-02T00:00:00Z'),
    });

    const changed = await subscriptionService.applyProviderUpdate(organizationId, {
      provider: 'RAZORPAY',
      eventAt: at('2026-10-02T00:00:00Z'),
      status: 'CANCELLED',
      currentPeriodEnd: null,
    });

    expect(changed).toBe(true);
    const row = await subscriptionOf(organizationId);
    expect(row).toMatchObject({
      status: 'CANCELLED',
      provider: 'RAZORPAY',
      externalSubscriptionId: 'sub_1',
      currency: 'USD',
      currentPeriodEnd: null,
    });
    expect(row?.cancelledAt).toEqual(at('2026-10-02T00:00:00Z'));
  });

  it('switches the plan when a later event names another one that exists', async () => {
    const first = await seedPlan({ key: 'first' });
    const second = await seedPlan({ key: 'second' });
    await seedSubscription(organizationId, first, { status: 'ACTIVE' });

    await subscriptionService.applyProviderUpdate(organizationId, {
      provider: 'STRIPE',
      eventAt: at('2026-10-03T00:00:00Z'),
      planId: String(second._id),
      trialEndsAt: at('2026-10-10T00:00:00Z'),
      cancelAtPeriodEnd: true,
      externalCustomerId: 'cus_1',
    });

    expect(await subscriptionOf(organizationId)).toMatchObject({
      planKey: 'second',
      planId: String(second._id),
      cancelAtPeriodEnd: true,
      externalCustomerId: 'cus_1',
      trialEndsAt: at('2026-10-10T00:00:00Z'),
    });
  });

  it('keeps the plan when the event names one that no longer exists', async () => {
    const plan = await seedPlan();
    await seedSubscription(organizationId, plan, { status: 'TRIALING' });

    await subscriptionService.applyProviderUpdate(organizationId, {
      provider: 'STRIPE',
      eventAt: at('2026-10-03T00:00:00Z'),
      planId: newOrganizationId(),
      status: 'ACTIVE',
    });

    expect(await subscriptionOf(organizationId)).toMatchObject({
      planKey: 'growth',
      status: 'ACTIVE',
    });
  });
});

describe('overview', () => {
  it('reports the plan, seats and this month’s AI spend of the company alone', async () => {
    const plan = await seedPlan();
    await seedSubscription(organizationId, plan, { status: 'ACTIVE' });
    const job = (costUsd: number, ranAt: Date) => ({
      name: 'Draft',
      model: 'gpt',
      prompt: 'Hi',
      costUsd,
      ranAt,
    });
    await runForOrganization(organizationId, async () => {
      await AiJobModel.create([job(1.5, new Date()), job(2, new Date()), job(9, at('2020-01-01'))]);
      await UserModel.create({
        name: 'Ada',
        email: 'ada@acme.test',
        passwordHash: 'hash',
        roles: ['ADMIN'],
      });
    });
    await runForOrganization(newOrganizationId(), () => AiJobModel.create(job(100, new Date())));

    const overview = await subscriptionService.overview(organizationId);

    expect(overview.subscription?.planKey).toBe('growth');
    expect(overview.plan?.key).toBe('growth');
    expect(overview.lapsed).toBe(false);
    expect(overview.seatsUsed).toBe(1);
    expect(overview.aiSpentThisMonthUsd).toBeCloseTo(3.5);
  });

  it('reports a company with no subscription as on no plan and not lapsed', async () => {
    const overview = await subscriptionService.overview(organizationId);

    expect(overview).toEqual({
      subscription: null,
      plan: null,
      lapsed: false,
      seatsUsed: 0,
      aiSpentThisMonthUsd: 0,
    });
  });

  it('reports a trial that has run out as lapsed', async () => {
    await seedSubscription(organizationId, await seedPlan(), {
      status: 'TRIALING',
      trialEndsAt: new Date(Date.now() - DAY_MS),
    });

    expect((await subscriptionService.overview(organizationId)).lapsed).toBe(true);
  });
});

describe('cancellation', () => {
  it('ends a subscription with no gateway at once and closes the plan’s modules', async () => {
    await seedSubscription(organizationId, await seedPlan(), {
      status: 'ACTIVE',
      cancelAtPeriodEnd: true,
    });
    await planAccessFor(organizationId);

    await subscriptionService.cancelNow(organizationId);

    const row = await subscriptionOf(organizationId);
    expect(row).toMatchObject({ status: 'CANCELLED', cancelAtPeriodEnd: false });
    expect(row?.cancelledAt).toBeInstanceOf(Date);
    expect(await planAccessFor(organizationId)).toMatchObject({ lapsed: true, roles: [] });
  });

  it('marks a gateway subscription to end with its period, leaving it ACTIVE', async () => {
    await seedSubscription(organizationId, await seedPlan(), { status: 'ACTIVE' });

    await subscriptionService.markCancelAtPeriodEnd(organizationId);

    expect(await subscriptionOf(organizationId)).toMatchObject({
      status: 'ACTIVE',
      cancelAtPeriodEnd: true,
    });
  });
});
