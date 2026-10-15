import { describe, expect, it } from 'vitest';
import {
  calculateEstimate,
  calculateScenario,
  compareScenarios,
  departmentTotals,
  monthTotals,
  planHeadcount,
  summarise,
  type Charge,
} from '../../src';
import { assumptions, estimate, line, office, role, scenario } from './fixtures';

/** 10 engineers at ₹1,00,000 a month, ₹10,000 of legal a month, a ₹50,000 fit-out-free coworking deposit. */
const standard = (overrides = {}) =>
  scenario({
    roles: [role({ headcount: 10 })],
    office: office({ model: 'coworking', seats: 10, seatPriceMonthly: 5_000, depositMonths: 1 }),
    lines: [
      line({ unitPrice: 10_000 }),
      line({ id: 'setup', frequency: 'one-time', unitPrice: 200_000, taxRatePct: 18 }),
      line({ id: 'optional', optional: true, unitPrice: 1_000 }),
    ],
    ...overrides,
  });

describe('summary', () => {
  it('separates setup, operating, deposits, tax and optional add-ons', () => {
    const summary = summarise(calculateScenario(standard(), []));
    expect(summary.setupCost).toBe(20_000_000);
    expect(summary.deposits).toBe(5_000_000);
    expect(summary.monthlyOperating).toBe(106_000_000);
    expect(summary.tax).toBe(3_600_000);
    expect(summary.optionalTotal).toBe(12 * 100_000);
    expect(summary.forecastTotal).toBe(20_000_000 + 3_600_000 + 12 * 106_000_000);
    expect(summary.annualOperating).toEqual([12 * 106_000_000]);
    expect(summary.costPerEmployeeMonthly).toBe(10_600_000);
  });

  it('never counts deposits as a cost and only puts them in the initial cash', () => {
    const summary = summarise(
      calculateScenario(
        standard({
          assumptions: assumptions({ workingCapitalMonths: 2, paymentTiming: 'advance' }),
        }),
        [],
      ),
    );
    const groups = summary.byGroup.map((group) => group.group);
    expect(groups).not.toContain('Deposits');
    // setup 2,00,000 + tax 36,000 + deposit 50,000 + 2 months working capital + month-1 operating in advance
    expect(summary.workingCapital).toBe(2 * 106_000_000);
    expect(summary.initialCash).toBe(
      20_000_000 + 3_600_000 + 5_000_000 + 2 * 106_000_000 + 106_000_000,
    );
  });

  it('applies contingency to pre-tax setup and operating cost', () => {
    const summary = summarise(
      calculateScenario(standard({ assumptions: assumptions({ contingencyPct: 10 }) }), []),
    );
    expect(summary.contingency).toBe(2_000_000 + 12 * 10_600_000);
  });

  it('totals 12, 24, 36 and 60 months regardless of the window', () => {
    const summary = summarise(calculateScenario(standard(), []));
    expect(summary.horizonTotals.map((horizon) => horizon.months)).toEqual([12, 24, 36, 60]);
    expect(summary.horizonTotals[1].total - summary.horizonTotals[0].total).toBe(12 * 106_000_000);
  });

  it('caps the phase month to the window and handles an empty team', () => {
    const summary = summarise(
      calculateScenario(scenario({ assumptions: assumptions({ operatingPhaseMonth: 60 }) }), []),
    );
    expect(summary.phaseMonth).toBe(12);
    expect(summary.costPerEmployeeMonthly).toBeNull();
    expect(summary.presentValue).toBeNull();
    expect(summary.breakEvenMonth).toBeNull();
  });

  it('discounts monthly totals to a present value', () => {
    const summary = summarise(
      calculateScenario(
        scenario({ lines: [line()], assumptions: assumptions({ discountRatePct: 12 }) }),
        [],
      ),
    );
    expect(summary.presentValue).toBeLessThan(summary.forecastTotal);
    expect(summary.presentValue).toBeGreaterThan(summary.forecastTotal * 0.9);
  });

  it('finds break-even only from a user-supplied benefit', () => {
    const withBenefit = (monthlyBenefit: number) =>
      summarise(calculateScenario(standard({ assumptions: assumptions({ monthlyBenefit }) }), []))
        .breakEvenMonth;
    // month 1 costs 12,96,000 (operating + setup + tax); later months 10,60,000 each
    expect(withBenefit(1_300_000)).toBe(1);
    expect(withBenefit(1_100_000)).toBe(6);
    expect(withBenefit(1_000_000)).toBeNull();
  });

  it('lists review and illustrative items and groups payroll by department', () => {
    const summary = summarise(
      calculateScenario(
        standard({
          roles: [
            role({ headcount: 1 }),
            role({ id: 'role-hr', department: 'HR', headcount: 1, annualGross: 600_000 }),
          ],
          lines: [
            line({ id: 'b', label: 'Transfer pricing', applicability: 'review' }),
            line({
              id: 'a',
              label: 'Audit',
              applicability: 'review',
              source: { kind: 'illustrative', note: '', url: '', checkedOn: '' },
            }),
          ],
        }),
        [],
      ),
    );
    expect(summary.reviewItems).toEqual(['Audit', 'Transfer pricing']);
    expect(summary.illustrativeItems).toEqual(['Audit']);
    expect(departmentTotals(summary).map((group) => group.group)).toEqual([
      'Software Engineering',
      'HR',
    ]);
    expect(summary.byItem.find((item) => item.label === 'Audit')?.total).toBe(12 * 100_000);
  });

  it('merges recruitment into its department total', () => {
    const summary = summarise(
      calculateScenario(scenario({ roles: [role({ headcount: 1, recruitmentFeePct: 10 })] }), []),
    );
    const [engineering] = departmentTotals(summary);
    expect(engineering.total).toBe(12 * 10_000_000 + 12_000_000);
  });

  it('routes optional deposits to the optional total', () => {
    const optionalDeposit: Charge = {
      sourceId: 'x',
      section: 'office',
      group: 'Deposits',
      label: 'Deposit',
      month: 1,
      kind: 'deposit',
      amount: 500,
      tax: 0,
      optional: true,
      review: false,
      illustrative: false,
    };
    const [month] = monthTotals([optionalDeposit], planHeadcount([], assumptions()), 0);
    expect(month).toMatchObject({ deposits: 0, optional: 500 });
  });
});

describe('scenario comparison', () => {
  it('reports each scenario against the first', () => {
    const lean = scenario({ id: 'lean', name: 'Lean', lines: [line({ unitPrice: 1_000 })] });
    const big = scenario({ id: 'big', name: 'Big', lines: [line({ unitPrice: 1_500 })] });
    const outcomes = calculateEstimate(
      estimate({ scenarios: [lean, big], activeScenarioId: 'lean' }),
    );
    const [base, other] = compareScenarios(outcomes);
    expect(base.variances.find((v) => v.metric === 'monthlyOperating')).toMatchObject({
      delta: 0,
      deltaPct: 0,
    });
    expect(other.variances.find((v) => v.metric === 'monthlyOperating')).toMatchObject({
      delta: 50_000,
      deltaPct: 50,
    });
    expect(other.variances.find((v) => v.metric === 'setupCost')).toMatchObject({
      delta: 0,
      deltaPct: null,
    });
    expect(other.variances.find((v) => v.metric === 'costPerEmployeeMonthly')).toMatchObject({
      value: null,
      delta: null,
    });
  });
});
