import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import {
  UNLIMITED,
  invalidatePlanAccess,
  isLapsed,
  planAccessFor,
} from '../../../../src/modules/billing/access';
import { grandfatherOrganization } from '../../../../src/modules/billing/billing.migrate';
import { PlanModel } from '../../../../src/modules/billing/plan.model';
import { SubscriptionModel } from '../../../../src/modules/billing/subscription.model';
import { newOrganizationId, seedPlan, seedSubscription, subscriptionOf } from './fixtures';

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  invalidatePlanAccess();
});

describe('isLapsed', () => {
  const now = new Date('2026-11-01T12:00:00.000Z');

  it('lapses a cancelled subscription whatever its trial says', () => {
    expect(isLapsed('CANCELLED', null, now)).toBe(true);
  });

  it('lapses a trial only once its end has passed', () => {
    expect(isLapsed('TRIALING', new Date(now.getTime() - 1), now)).toBe(true);
    expect(isLapsed('TRIALING', now, now)).toBe(false);
    expect(isLapsed('TRIALING', null, now)).toBe(false);
    expect(isLapsed('TRIALING', undefined, now)).toBe(false);
  });

  it('keeps paid and retrying subscriptions open even past an old trial end', () => {
    const past = new Date(now.getTime() - DAY_MS);
    expect(isLapsed('ACTIVE', past, now)).toBe(false);
    expect(isLapsed('PAST_DUE', past, now)).toBe(false);
  });

  it('reads the current time when none is given', () => {
    expect(isLapsed('TRIALING', new Date(Date.now() - DAY_MS))).toBe(true);
  });
});

describe('planAccessFor', () => {
  it('leaves the platform and a company with no subscription unlimited', async () => {
    expect(await planAccessFor(null)).toBe(UNLIMITED);
    expect(await planAccessFor(newOrganizationId())).toEqual(UNLIMITED);
  });

  it('leaves a company whose plan no longer exists unlimited', async () => {
    const organizationId = newOrganizationId();
    const plan = await seedPlan();
    await seedSubscription(organizationId, plan, { status: 'ACTIVE' });
    await runAsPlatform(() => PlanModel.deleteOne({ _id: plan._id }));

    expect(await planAccessFor(organizationId)).toEqual(UNLIMITED);
  });

  it('opens the plan’s modules and carries its limits', async () => {
    const organizationId = newOrganizationId();
    const plan = await seedPlan({ modules: ['CRM', 'HR'], seatLimit: 3, aiMonthlyUsdCap: 10 });
    await seedSubscription(organizationId, plan, { status: 'ACTIVE' });

    expect(await planAccessFor(organizationId)).toEqual({
      roles: ['CRM', 'HR'],
      seatLimit: 3,
      aiMonthlyUsdCap: 10,
      lapsed: false,
    });
  });

  it('opens every module on an all-modules plan', async () => {
    const organizationId = newOrganizationId();
    const plan = await seedPlan({ allModules: true, modules: [] });
    await seedSubscription(organizationId, plan, { status: 'TRIALING' });

    expect((await planAccessFor(organizationId)).roles).toBeNull();
  });

  it('closes every module once a trial has run out unpaid, even on an all-modules plan', async () => {
    const organizationId = newOrganizationId();
    const plan = await seedPlan({ allModules: true });
    await seedSubscription(organizationId, plan, {
      status: 'TRIALING',
      trialEndsAt: new Date(Date.now() - DAY_MS),
    });

    expect(await planAccessFor(organizationId)).toMatchObject({ roles: [], lapsed: true });
  });

  it('keeps each company’s access its own', async () => {
    const small = newOrganizationId();
    const big = newOrganizationId();
    await seedSubscription(small, await seedPlan({ key: 'small', modules: ['CRM'] }));
    await seedSubscription(big, await seedPlan({ key: 'big', allModules: true }));

    expect((await planAccessFor(small)).roles).toEqual(['CRM']);
    expect((await planAccessFor(big)).roles).toBeNull();
  });

  it('caches for a minute until invalidated for that company', async () => {
    const organizationId = newOrganizationId();
    const plan = await seedPlan({ modules: ['CRM'] });
    await seedSubscription(organizationId, plan, { status: 'ACTIVE' });
    expect((await planAccessFor(organizationId)).lapsed).toBe(false);

    await runForOrganization(organizationId, () =>
      SubscriptionModel.updateOne({}, { status: 'CANCELLED' }),
    );
    expect((await planAccessFor(organizationId)).lapsed).toBe(false);

    invalidatePlanAccess(organizationId);
    expect((await planAccessFor(organizationId)).lapsed).toBe(true);
  });

  it('reads again once the minute is up', async () => {
    const organizationId = newOrganizationId();
    await seedSubscription(organizationId, await seedPlan(), { status: 'ACTIVE' });
    const start = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(start);
    await planAccessFor(organizationId);
    await runForOrganization(organizationId, () =>
      SubscriptionModel.updateOne({}, { status: 'CANCELLED' }),
    );

    clock.mockReturnValue(start + 60_001);

    expect((await planAccessFor(organizationId)).lapsed).toBe(true);
    clock.mockRestore();
  });
});

describe('grandfatherOrganization (the boot migration)', () => {
  it('puts a company that predates billing on the unlimited plan, and running it twice changes nothing', async () => {
    const organizationId = newOrganizationId();

    await runForOrganization(organizationId, grandfatherOrganization);
    const first = await subscriptionOf(organizationId);
    await runForOrganization(organizationId, grandfatherOrganization);

    expect(first).toMatchObject({ planKey: 'grandfathered', status: 'ACTIVE', provider: 'MANUAL' });
    expect(await runForOrganization(organizationId, () => SubscriptionModel.countDocuments())).toBe(
      1,
    );
    expect(await runAsPlatform(() => PlanModel.countDocuments())).toBe(1);
    expect(await planAccessFor(organizationId)).toEqual({
      roles: null,
      seatLimit: 0,
      aiMonthlyUsdCap: 0,
      lapsed: false,
    });
  });

  it('keeps a company that already has a subscription on its own plan', async () => {
    const organizationId = newOrganizationId();
    const plan = await seedPlan({ modules: ['CRM'] });
    await seedSubscription(organizationId, plan, { status: 'TRIALING' });

    await runForOrganization(organizationId, grandfatherOrganization);

    expect(await subscriptionOf(organizationId)).toMatchObject({
      planKey: 'growth',
      status: 'TRIALING',
    });
  });

  it('run as the platform, forgets every company’s cached access', async () => {
    const organizationId = newOrganizationId();
    await seedSubscription(organizationId, await seedPlan(), { status: 'ACTIVE' });
    expect((await planAccessFor(organizationId)).lapsed).toBe(false);
    await runForOrganization(organizationId, () =>
      SubscriptionModel.updateOne({}, { status: 'CANCELLED' }),
    );

    await runAsPlatform(grandfatherOrganization);

    expect((await planAccessFor(organizationId)).lapsed).toBe(true);
  });
});
