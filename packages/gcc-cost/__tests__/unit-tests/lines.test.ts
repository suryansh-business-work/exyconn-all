import { describe, expect, it } from 'vitest';
import { calculateScenario, occurrences, operatingBase, type Charge } from '../../src';
import { line, role, scenario, usd } from './fixtures';

const months = (charges: Charge[], id: string) =>
  charges.filter((item) => item.sourceId === id).map((item) => item.month);

const amountAt = (charges: Charge[], id: string, month: number) =>
  charges
    .filter((item) => item.sourceId === id && item.month === month)
    .reduce((sum, item) => sum + item.amount, 0);

describe('cost lines', () => {
  it('charges a one-time cost once, as setup, never every month', () => {
    const result = calculateScenario(
      scenario({ lines: [line({ frequency: 'one-time', startMonth: 2 })] }),
      [],
    );
    expect(months(result.charges, 'line-a')).toEqual([2]);
    expect(result.charges[0].kind).toBe('setup');
  });

  it('repeats quarterly and annual costs from the start month until the end month', () => {
    expect(occurrences(line({ frequency: 'quarterly', startMonth: 2, endMonth: 12 }))).toEqual([
      2, 5, 8, 11,
    ]);
    expect(occurrences(line({ frequency: 'annual' }))).toEqual([1, 13, 25, 37, 49]);
  });

  it('escalates on each anniversary of the line start', () => {
    const result = calculateScenario(
      scenario({ lines: [line({ escalationPct: 10, startMonth: 6 })] }),
      [],
    );
    expect(amountAt(result.charges, 'line-a', 17)).toBe(100_000);
    expect(amountAt(result.charges, 'line-a', 18)).toBe(110_000);
  });

  it('multiplies per-employee lines by headcount and per-hire lines by hires', () => {
    const team = [role({ headcount: 4, rampMonths: 2 })];
    const result = calculateScenario(
      scenario({
        roles: team,
        lines: [
          line({ id: 'per-employee', pricing: 'per-employee', unitPrice: 100 }),
          line({ id: 'per-hire', pricing: 'per-hire', unitPrice: 500, frequency: 'annual' }),
        ],
      }),
      [],
    );
    expect(amountAt(result.charges, 'per-employee', 1)).toBe(20_000);
    expect(amountAt(result.charges, 'per-employee', 2)).toBe(40_000);
    expect(amountAt(result.charges, 'per-hire', 2)).toBe(100_000);
    expect(amountAt(result.charges, 'per-hire', 3)).toBe(0);
  });

  it('charges a setup fee once in the start month alongside the recurring amount', () => {
    const result = calculateScenario(
      scenario({ lines: [line({ setupFee: 5_000, startMonth: 3 })] }),
      [],
    );
    const fees = result.charges.filter((item) => item.label === 'Legal advisory (setup fee)');
    expect(fees).toEqual([expect.objectContaining({ month: 3, kind: 'setup', amount: 500_000 })]);
  });

  it('computes percentage fees on the chosen pre-tax base and never on other percentages', () => {
    const result = calculateScenario(
      scenario({
        roles: [role({ headcount: 1 })],
        lines: [
          line({ id: 'fee-payroll', pricing: 'percentage', ratePct: 10, percentBase: 'payroll' }),
          line({
            id: 'fee-all',
            pricing: 'percentage',
            ratePct: 10,
            percentBase: 'operating',
            taxRatePct: 18,
          }),
          line({ id: 'flat', unitPrice: 1_000 }),
        ],
      }),
      [],
    );
    expect(amountAt(result.charges, 'fee-payroll', 1)).toBe(1_000_000);
    expect(amountAt(result.charges, 'fee-all', 1)).toBe(1_010_000);
    expect(result.charges.find((item) => item.sourceId === 'fee-all')?.tax).toBe(181_800);
  });

  it('builds percentage bases from non-optional operating charges only', () => {
    const base: Charge = {
      sourceId: 'x',
      section: 'office',
      group: 'Occupancy',
      label: 'Rent',
      month: 1,
      kind: 'operating',
      amount: 100,
      tax: 0,
      optional: false,
      review: false,
      illustrative: false,
    };
    const charges = [
      base,
      { ...base, optional: true },
      { ...base, kind: 'setup' as const },
      { ...base, section: 'payroll' as const },
    ];
    expect(operatingBase(charges, 'office')[0]).toBe(100);
    expect(operatingBase(charges, 'operating')[0]).toBe(200);
  });

  it('skips disabled and not-applicable lines, and flags review, optional and illustrative ones', () => {
    const result = calculateScenario(
      scenario({
        lines: [
          line({ id: 'off', enabled: false }),
          line({ id: 'na', applicability: 'not-applicable' }),
          line({
            id: 'review',
            applicability: 'review',
            optional: true,
            source: { kind: 'illustrative', note: '', url: '', checkedOn: '' },
          }),
        ],
      }),
      [],
    );
    expect(result.charges.every((item) => item.sourceId === 'review')).toBe(true);
    expect(result.charges[0]).toMatchObject({
      review: true,
      optional: true,
      illustrative: true,
      group: 'Legal',
    });
  });

  it('falls back to the section name for an unknown category and converts currency', () => {
    const result = calculateScenario(
      scenario({ lines: [line({ categoryId: 'missing', currency: 'USD', unitPrice: 10 })] }),
      [usd],
    );
    expect(result.charges[0]).toMatchObject({ group: 'legal', amount: 80_000 });
  });

  it('reports a line priced in a currency without a rate', () => {
    const result = calculateScenario(scenario({ lines: [line({ currency: 'EUR' })] }), []);
    expect(result.issues).toEqual([{ code: 'missing-rate', sourceId: 'line-a', currency: 'EUR' }]);
  });
});
