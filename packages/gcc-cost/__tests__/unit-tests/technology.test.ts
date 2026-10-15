import { describe, expect, it } from 'vitest';
import { calculateScenario, tokenCostPerMonth, type Charge } from '../../src';
import { assumptions, role, scenario, usage, usd } from './fixtures';

const total = (charges: Charge[], label: string, month: number) =>
  charges
    .filter((item) => item.label === label && item.month === month)
    .reduce((sum, item) => sum + item.amount, 0);

describe('token pricing', () => {
  it('prices input and output separately per million tokens', () => {
    // 10M input × $4 + 2M output × $20
    expect(tokenCostPerMonth(usage())).toBe(80);
  });

  it('bills cached input at the cached price instead of the input price', () => {
    // 6M × $4 + 4M cached × $0.2 + 2M × $20
    expect(tokenCostPerMonth(usage({ cachedInputMTokMonthly: 4 }))).toBeCloseTo(64.8);
  });

  it('applies the batch discount to the batch share only', () => {
    expect(tokenCostPerMonth(usage({ batchSharePct: 50 }))).toBe(60);
  });
});

describe('technology charges', () => {
  it('converts usage priced in USD and grows it on each anniversary', () => {
    const result = calculateScenario(
      scenario({
        ai: { ...scenario().ai, usage: [usage()] },
        assumptions: assumptions({ techGrowthPct: 10, technologyTaxPct: 18 }),
      }),
      [usd],
    );
    const label = 'Anthropic · Claude';
    expect(total(result.charges, label, 1)).toBe(640_000);
    expect(total(result.charges, label, 13)).toBe(704_000);
    expect(result.charges.find((item) => item.label === label)?.tax).toBe(115_200);
  });

  it('reports a missing exchange rate instead of silently dropping or crashing', () => {
    const result = calculateScenario(scenario({ ai: { ...scenario().ai, usage: [usage()] } }), []);
    expect(result.issues).toEqual([{ code: 'missing-rate', sourceId: 'usage-a', currency: 'USD' }]);
    expect(result.charges).toEqual([]);
  });

  it('uses a fixed budget instead of token usage in budget mode', () => {
    const result = calculateScenario(
      scenario({
        ai: { ...scenario().ai, mode: 'budget', monthlyBudget: 50_000, usage: [usage()] },
      }),
      [],
    );
    expect(total(result.charges, 'AI and API budget', 1)).toBe(5_000_000);
    expect(result.charges.some((item) => item.label.startsWith('Anthropic'))).toBe(false);
    expect(result.issues).toEqual([]);
  });

  it('charges subscriptions per user from their start month', () => {
    const subscription = {
      id: 'sub-a',
      provider: 'Chat',
      plan: 'Team',
      pricePerUserMonthly: 25,
      currency: 'USD',
      users: 4,
      startMonth: 3,
    };
    const result = calculateScenario(
      scenario({ ai: { ...scenario().ai, subscriptions: [subscription] } }),
      [usd],
    );
    expect(total(result.charges, 'Chat · Team', 2)).toBe(0);
    expect(total(result.charges, 'Chat · Team', 3)).toBe(800_000);
  });

  it('buys a device per new position and replaces it every cycle', () => {
    const result = calculateScenario(
      scenario({
        roles: [role({ headcount: 2, attritionPct: 50 })],
        ai: { ...scenario().ai, hardwarePerEmployee: 100_000, hardwareCycleMonths: 12 },
      }),
      [],
    );
    const bought = result.charges.filter((item) => item.label === 'Employee hardware');
    expect(bought).toEqual([
      expect.objectContaining({ month: 1, kind: 'setup', amount: 20_000_000 }),
    ]);
    const replaced = result.charges.filter((item) => item.label === 'Hardware replacement');
    expect(replaced.map((item) => item.month)).toEqual([13, 25, 37, 49]);
    expect(replaced[0]).toMatchObject({ kind: 'operating', amount: 20_000_000 });
  });
});
