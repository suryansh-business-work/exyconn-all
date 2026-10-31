import { describe, expect, it } from 'vitest';
import { PlanInterval, Role } from '@exyconn/shell/graphql/generated';
import { planSchema, toPlanValues } from '../../../../src/pages/plans/forms/plan/plan.schema';
import { plan } from '../billing/billing.fixtures';

const valid = {
  ...toPlanValues(null),
  key: 'growth',
  name: 'Growth',
  prices: [{ currency: 'usd', amount: 49 }],
  modules: [Role.Crm],
};

/** The messages a value fails with, keyed by field path. */
function problems(values: Record<string, unknown>): Record<string, string> {
  const result = planSchema.safeParse({ ...valid, ...values });
  if (result.success) return {};
  const found: Record<string, string> = {};
  for (const issue of result.error.issues) {
    found[issue.path.join('.')] ??= issue.message;
  }
  return found;
}

describe('planSchema', () => {
  it('accepts a sellable plan, upper-casing its currency and coercing numbers', () => {
    const parsed = planSchema.parse({
      ...valid,
      trialDays: '7',
      prices: [{ currency: 'eur', amount: '9.5' }],
    });

    expect(parsed.prices).toEqual([{ currency: 'EUR', amount: 9.5 }]);
    expect(parsed.trialDays).toBe(7);
  });

  it('accepts a free plan with no price that opens every module', () => {
    expect(problems({ prices: [], allModules: true, modules: [] })).toEqual({});
  });

  it.each([
    ['a missing key', { key: '' }, 'key', 'A key is required'],
    ['a key with spaces', { key: 'my plan' }, 'key', 'Lower-case letters, digits and dashes only'],
    [
      'a key over 40 characters',
      { key: 'a'.repeat(41) },
      'key',
      'Keep the key under 40 characters',
    ],
    ['a missing name', { name: '  ' }, 'name', 'A name is required'],
    ['a long name', { name: 'n'.repeat(81) }, 'name', 'Keep the name under 80 characters'],
    [
      'a long description',
      { description: 'd'.repeat(501) },
      'description',
      'Keep the description under 500 characters',
    ],
    [
      'a price that is not a number',
      { prices: [{ currency: 'USD', amount: 'abc' }] },
      'prices.0.amount',
      'The price must be a number',
    ],
    [
      'a negative price',
      { prices: [{ currency: 'USD', amount: -1 }] },
      'prices.0.amount',
      'A price cannot be negative',
    ],
    [
      'a price with no currency',
      { prices: [{ currency: '', amount: 1 }] },
      'prices.0.currency',
      'Currency is required',
    ],
    ['a fractional trial', { trialDays: 1.5 }, 'trialDays', 'Trial days is a whole number'],
    ['a negative trial', { trialDays: -1 }, 'trialDays', 'Trial days cannot be negative'],
    ['a trial over a year', { trialDays: 366 }, 'trialDays', 'Trial days is at most 365'],
    ['seats that are not a number', { seatLimit: 'many' }, 'seatLimit', 'Seats must be a number'],
    [
      'a negative AI cap',
      { aiMonthlyUsdCap: -1 },
      'aiMonthlyUsdCap',
      'The AI cap cannot be negative',
    ],
    [
      'an AI cap that is not a number',
      { aiMonthlyUsdCap: 'x' },
      'aiMonthlyUsdCap',
      'The AI cap must be a number',
    ],
    ['an order past 10000', { sortOrder: 10_001 }, 'sortOrder', 'Order is at most 10000'],
    [
      'a currency priced twice',
      {
        prices: [
          { currency: 'USD', amount: 1 },
          { currency: 'usd', amount: 2 },
        ],
      },
      'prices',
      'Each currency can be priced once',
    ],
    [
      'no modules and not every module',
      { modules: [] },
      'modules',
      'Pick the modules it includes, or include every module',
    ],
  ])('refuses %s', (_label, values, path, message) => {
    expect(problems(values)[path]).toBe(message);
  });
});

describe('toPlanValues', () => {
  it('starts a new plan monthly, public, active, with a 14-day trial', () => {
    expect(toPlanValues(null)).toMatchObject({
      key: '',
      prices: [],
      interval: PlanInterval.Month,
      trialDays: 14,
      seatLimit: 0,
      isPublic: true,
      isActive: true,
      sortOrder: 0,
    });
  });

  it('copies the plan being edited, without its typenames', () => {
    const values = toPlanValues(plan({ interval: PlanInterval.Year, isPublic: false }));

    expect(values).toMatchObject({
      key: 'growth',
      interval: PlanInterval.Year,
      isPublic: false,
      seatLimit: 10,
      modules: [Role.Crm, Role.Hr],
    });
    expect(values.prices).toEqual([
      { currency: 'USD', amount: 49 },
      { currency: 'INR', amount: 3999 },
    ]);
  });
});
