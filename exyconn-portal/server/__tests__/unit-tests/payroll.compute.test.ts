import {
  daysInMonth,
  grossOf,
  unpaidLeaveDays,
  computeSlip,
} from '../../src/modules/payroll/payroll.compute';

const S = { basic: 30000, hra: 12000, allowances: 8000, deductions: 2500 };
const approvedUnpaid = (from: string, to: string) => ({
  fromDate: new Date(from),
  toDate: new Date(to),
  type: 'UNPAID',
  status: 'APPROVED',
});

describe('daysInMonth', () => {
  it('handles February in a leap year and 30/31-day months', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
});

describe('grossOf', () => {
  it('is basic + hra + allowances, ignoring deductions', () => {
    expect(grossOf(S)).toBe(50000);
  });
});

describe('unpaidLeaveDays', () => {
  it('counts approved UNPAID days inclusively', () => {
    expect(unpaidLeaveDays([approvedUnpaid('2026-03-10', '2026-03-12')], 2026, 3)).toBe(3);
  });

  it('ignores paid leave types and non-approved requests', () => {
    const rows = [
      { ...approvedUnpaid('2026-03-10', '2026-03-12'), type: 'SICK' },
      { ...approvedUnpaid('2026-03-20', '2026-03-21'), status: 'PENDING' },
    ];
    expect(unpaidLeaveDays(rows, 2026, 3)).toBe(0);
  });

  it('clips a span that crosses the month boundary to the days inside the month', () => {
    // 29 Mar – 3 Apr: only 29, 30, 31 March count for March
    expect(unpaidLeaveDays([approvedUnpaid('2026-03-29', '2026-04-03')], 2026, 3)).toBe(3);
    expect(unpaidLeaveDays([approvedUnpaid('2026-03-29', '2026-04-03')], 2026, 4)).toBe(3);
  });

  it('is zero when the leave is in another month entirely', () => {
    expect(unpaidLeaveDays([approvedUnpaid('2026-02-01', '2026-02-02')], 2026, 3)).toBe(0);
  });
});

describe('computeSlip', () => {
  it('with no unpaid leave: gross, fixed deductions, net', () => {
    expect(computeSlip(S, 2026, 3, 0)).toEqual({
      gross: 50000,
      lossOfPay: 0,
      deductions: 2500,
      net: 47500,
    });
  });

  it('charges a per-day share of basic for each unpaid day', () => {
    // March has 31 days: 30000/31 ≈ 967.74 per day × 3 = 2903
    const slip = computeSlip(S, 2026, 3, 3);
    expect(slip.lossOfPay).toBe(2903);
    expect(slip.deductions).toBe(2500 + 2903);
    expect(slip.net).toBe(50000 - 2500 - 2903);
  });

  it('never lets net go below zero', () => {
    const tiny = { basic: 100, hra: 0, allowances: 0, deductions: 500 };
    expect(computeSlip(tiny, 2026, 3, 31).net).toBe(0);
  });
});
