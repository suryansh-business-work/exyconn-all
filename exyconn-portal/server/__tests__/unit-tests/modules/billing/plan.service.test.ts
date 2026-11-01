import { runAsPlatform } from '../../../../src/lib/tenant';
import { PlanModel, GRANDFATHERED_PLAN_KEY } from '../../../../src/modules/billing/plan.model';
import {
  ALWAYS_OPEN_ROLES,
  ensureGrandfatheredPlan,
  planService,
} from '../../../../src/modules/billing/plan.service';
import type { Role } from '../../../../src/constants/roles';
import { newOrganizationId, planInput, seedPlan, seedSubscription } from './fixtures';

describe('planService.create', () => {
  it('stores the plan with upper-cased currencies and each module once', async () => {
    const plan = await planService.create(
      planInput({ modules: ['CRM', 'CRM', 'HR'], description: undefined }),
    );

    expect(plan.key).toBe('growth');
    expect(plan.description).toBe('');
    expect(plan.prices).toEqual([
      { currency: 'USD', amount: 49 },
      { currency: 'INR', amount: 3999 },
    ]);
    expect(plan.modules).toEqual(['CRM', 'HR']);
  });

  it('drops the module list of a plan that opens every module', async () => {
    const plan = await planService.create(planInput({ allModules: true, modules: ['CRM'] }));

    expect(plan.allModules).toBe(true);
    expect(plan.modules).toEqual([]);
  });

  it('refuses a key another plan already uses', async () => {
    await planService.create(planInput());

    await expect(planService.create(planInput({ name: 'Other' }))).rejects.toThrow(
      'The key "growth" is already used by another plan.',
    );
  });

  it.each([
    ['a key with capitals', { key: 'Growth' }, 'The key is lower-case letters'],
    ['a key with a trailing dash', { key: 'growth-' }, 'The key is lower-case letters'],
    ['a key over 40 characters', { key: 'a'.repeat(41) }, 'The key is lower-case letters'],
    ['a blank name', { name: '   ' }, 'A plan needs a name.'],
    [
      'an unknown currency',
      { prices: [{ currency: 'XYZ', amount: 1 }] },
      '"XYZ" is not an ISO 4217 currency.',
    ],
    [
      'a currency priced twice',
      {
        prices: [
          { currency: 'usd', amount: 1 },
          { currency: 'USD', amount: 2 },
        ],
      },
      'USD is priced twice.',
    ],
    [
      'a negative price',
      { prices: [{ currency: 'USD', amount: -1 }] },
      'A price cannot be negative.',
    ],
    [
      'a price that is not a number',
      { prices: [{ currency: 'USD', amount: Number.NaN }] },
      'A price cannot be negative.',
    ],
    ['a negative trial', { trialDays: -1 }, 'A trial is 0 to 365 days.'],
    ['a trial over a year', { trialDays: 366 }, 'A trial is 0 to 365 days.'],
    ['negative seats', { seatLimit: -1 }, 'Seats are a whole number'],
    ['fractional seats', { seatLimit: 2.5 }, 'Seats are a whole number'],
    ['a negative AI cap', { aiMonthlyUsdCap: -0.01 }, 'The AI cap cannot be negative'],
    [
      'the always-open roles as modules',
      { modules: ['ADMIN', 'EMPLOYEE'] as Role[] },
      'These cannot be sold as modules: ADMIN, EMPLOYEE.',
    ],
    [
      'the platform role as a module',
      { modules: ['SUPER_ADMIN'] as Role[] },
      'These cannot be sold as modules: SUPER_ADMIN.',
    ],
  ])('refuses %s', async (_label, fields, message) => {
    await expect(planService.create(planInput(fields))).rejects.toThrow(message);
    expect(await runAsPlatform(() => PlanModel.countDocuments())).toBe(0);
  });

  it('accepts the boundaries: a free plan, no trial, a year-long trial, unlimited seats', async () => {
    const plan = await planService.create(
      planInput({ prices: [{ currency: 'EUR', amount: 0 }], trialDays: 365, seatLimit: 0 }),
    );
    const noTrial = await planService.create(planInput({ key: 'free', trialDays: 0 }));

    expect(plan.trialDays).toBe(365);
    expect(plan.seatLimit).toBe(0);
    expect(noTrial.trialDays).toBe(0);
  });
});

describe('planService reads', () => {
  it('lists every plan by sort order, and offers only active public ones at sign-up', async () => {
    await seedPlan({ key: 'late', sortOrder: 5 });
    await seedPlan({ key: 'early', sortOrder: 1 });
    await seedPlan({ key: 'hidden', isPublic: false, sortOrder: 2 });
    await seedPlan({ key: 'retired', isActive: false, sortOrder: 3 });
    await ensureGrandfatheredPlan();

    const all = await planService.list();
    const offered = await planService.listPublic();

    expect(all.map((plan) => plan.key)).toEqual([
      'early',
      'hidden',
      'retired',
      'late',
      GRANDFATHERED_PLAN_KEY,
    ]);
    expect(offered.map((plan) => plan.key)).toEqual(['early', 'late']);
  });

  it('reads one plan, and reports a missing or malformed id as not found', async () => {
    const plan = await seedPlan();

    expect((await planService.get(String(plan._id))).key).toBe('growth');
    await expect(planService.get('not-an-id')).rejects.toThrow('Plan not found');
    await expect(planService.get(newOrganizationId())).rejects.toThrow('Plan not found');
  });
});

describe('planService.update', () => {
  it('keeps the key whatever the input says and returns the plan before and after', async () => {
    const created = await planService.create(planInput());

    const { before, plan } = await planService.update(
      String(created._id),
      planInput({ key: 'renamed', name: 'Growth Plus', seatLimit: 20 }),
    );

    expect(before.name).toBe('Growth');
    expect(plan.key).toBe('growth');
    expect(plan.name).toBe('Growth Plus');
    expect(plan.seatLimit).toBe(20);
  });

  it('validates the change like a new plan', async () => {
    const created = await planService.create(planInput());

    await expect(
      planService.update(String(created._id), planInput({ trialDays: 400 })),
    ).rejects.toThrow('A trial is 0 to 365 days.');
  });

  it('lets the grandfathered plan be renamed but never retired', async () => {
    const system = await ensureGrandfatheredPlan();
    const id = String(system._id);
    const input = planInput({ allModules: true, modules: [], prices: [], seatLimit: 0 });

    await expect(planService.update(id, { ...input, isActive: false })).rejects.toThrow(
      'The grandfathered plan cannot be retired.',
    );
    const { plan } = await planService.update(id, { ...input, name: 'Founders' });
    expect(plan.name).toBe('Founders');
    expect(plan.key).toBe(GRANDFATHERED_PLAN_KEY);
  });

  it('reports a plan deleted between the read and the write as not found', async () => {
    const created = await planService.create(planInput());
    const spy = jest.spyOn(PlanModel, 'findByIdAndUpdate').mockReturnValueOnce({
      lean: async () => null,
    } as never);

    await expect(planService.update(String(created._id), planInput())).rejects.toThrow(
      'Plan not found',
    );
    spy.mockRestore();
  });
});

describe('planService.remove', () => {
  it('deletes a plan nobody is on', async () => {
    const created = await planService.create(planInput());

    const removed = await planService.remove(String(created._id));

    expect(removed.key).toBe('growth');
    expect(await runAsPlatform(() => PlanModel.countDocuments())).toBe(0);
  });

  it('refuses a plan a company is on, in any company', async () => {
    const plan = await seedPlan();
    await seedSubscription(newOrganizationId(), plan);

    await expect(planService.remove(String(plan._id))).rejects.toThrow(
      'Companies are on this plan. Retire it instead',
    );
    expect(await runAsPlatform(() => PlanModel.countDocuments())).toBe(1);
  });

  it('never deletes the grandfathered plan', async () => {
    const system = await ensureGrandfatheredPlan();

    await expect(planService.remove(String(system._id))).rejects.toThrow(
      'The grandfathered plan cannot be deleted.',
    );
  });
});

describe('ensureGrandfatheredPlan', () => {
  it('creates the unlimited system plan once and keeps a later rename', async () => {
    const first = await ensureGrandfatheredPlan();
    await runAsPlatform(() => PlanModel.updateOne({ _id: first._id }, { name: 'Founders' }));

    const second = await ensureGrandfatheredPlan();

    expect(String(second._id)).toBe(String(first._id));
    expect(second).toMatchObject({
      name: 'Founders',
      allModules: true,
      seatLimit: 0,
      aiMonthlyUsdCap: 0,
      isPublic: false,
      isSystem: true,
    });
    expect(await runAsPlatform(() => PlanModel.countDocuments())).toBe(1);
  });
});

it('keeps ADMIN and EMPLOYEE open on every plan', () => {
  expect([...ALWAYS_OPEN_ROLES].sort((a, b) => a.localeCompare(b))).toEqual(['ADMIN', 'EMPLOYEE']);
});
