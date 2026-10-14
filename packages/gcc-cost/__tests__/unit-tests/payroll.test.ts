import { describe, expect, it } from 'vitest';
import { calculateScenario, employeeCost, fullyLoaded, planHeadcount, planRole } from '../../src';
import { assumptions, role, scenario } from './fixtures';

const sumSection = (
  charges: { section: string; month: number; amount: number }[],
  section: string,
  month: number,
) =>
  charges
    .filter((item) => item.section === section && item.month === month)
    .reduce((total, item) => total + item.amount, 0);

describe('headcount plan', () => {
  it('ramps a role evenly from its hiring month', () => {
    const plan = planRole(role({ headcount: 10, hireMonth: 3, rampMonths: 4 }), assumptions());
    expect(plan.active.slice(0, 7)).toEqual([0, 0, 2.5, 5, 7.5, 10, 10]);
    expect(plan.hires.slice(0, 7)).toEqual([0, 0, 2.5, 2.5, 2.5, 2.5, 0]);
  });

  it('backfills attrition monthly without changing headcount', () => {
    const plan = planHeadcount([role({ headcount: 12 })], assumptions({ attritionPct: 12 }));
    expect(plan.active[5]).toBe(12);
    expect(plan.newHires[5]).toBe(0);
    expect(plan.hires[5]).toBeCloseTo(0.12);
  });

  it('prefers a role attrition rate over the scenario default', () => {
    const plan = planRole(
      role({ headcount: 12, attritionPct: 24 }),
      assumptions({ attritionPct: 12 }),
    );
    expect(plan.backfills[0]).toBeCloseTo(0.24);
  });
});

describe('employee cost', () => {
  it('adds no statutory cost to an all-inclusive salary', () => {
    const cost = employeeCost(
      role({ benefitsAnnual: 12_000, shiftAllowanceMonthly: 500 }),
      1,
      assumptions(),
    );
    expect(cost).toEqual({
      gross: 100_000,
      statutory: 0,
      gratuity: 0,
      benefits: 1_000,
      shiftAllowance: 500,
    });
    expect(fullyLoaded(cost)).toBe(101_500);
  });

  it('adds capped provident fund, other statutory cost and gratuity to a gross salary', () => {
    const gross = role({
      costBasis: 'gross',
      pfWageCapped: true,
      gratuityPct: 4.81,
      otherStatutoryPct: 1,
    });
    const cost = employeeCost(gross, 1, assumptions());
    // basic 50,000; PF on the 15,000 ceiling = 1,800; other 1% of gross = 1,000
    expect(cost.statutory).toBe(2_800);
    expect(cost.gratuity).toBeCloseTo(2_405);
  });

  it('applies provident fund on the full basic when uncapped', () => {
    const cost = employeeCost(role({ costBasis: 'gross' }), 1, assumptions());
    expect(cost.statutory).toBe(6_000);
  });

  it('raises salaries on each anniversary, role increment first', () => {
    expect(employeeCost(role(), 13, assumptions({ salaryInflationPct: 10 })).gross).toBeCloseTo(
      110_000,
    );
    expect(
      employeeCost(role({ incrementPct: 5 }), 25, assumptions({ salaryInflationPct: 10 })).gross,
    ).toBeCloseTo(110_250);
    expect(employeeCost(role(), 12, assumptions({ salaryInflationPct: 10 })).gross).toBe(100_000);
  });
});

describe('payroll charges', () => {
  it('charges salaries for people on payroll and recruitment fees per hire', () => {
    const result = calculateScenario(
      scenario({ roles: [role({ headcount: 2, recruitmentFeePct: 10 })] }),
      [],
    );
    expect(sumSection(result.charges, 'payroll', 1)).toBe(20_000_000);
    // 10% of 12,00,000 annual salary for each of two hires, in the hiring month only
    expect(sumSection(result.charges, 'recruitment', 1)).toBe(24_000_000);
    expect(sumSection(result.charges, 'recruitment', 2)).toBe(0);
    expect(result.charges.find((item) => item.section === 'payroll')?.group).toBe(
      'Software Engineering',
    );
  });
});
