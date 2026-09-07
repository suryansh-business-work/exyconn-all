import {
  computeMonthlySlip,
  computeSlip,
  daysInMonth,
  employeeStateInsurance,
  grossOf,
  providentFund,
  statutoryDeductions,
  taxDeductedAtSource,
  unpaidLeaveDays,
  type StatutorySettings,
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
  it('with no unpaid leave and no statutory policy: gross, fixed deductions, net', () => {
    expect(computeSlip(S, 2026, 3, 0)).toEqual({
      gross: 50000,
      lossOfPay: 0,
      pf: 0,
      esi: 0,
      professionalTax: 0,
      tds: 0,
      otherDeductions: 2500,
      deductions: 2500,
      net: 47500,
    });
  });

  it('adds every statutory line into the one deductions total', () => {
    const slip = computeSlip(S, 2026, 3, 0, {
      pf: 1800,
      esi: 0,
      professionalTax: 200,
      tds: 4000,
    });
    expect(slip.deductions).toBe(2500 + 1800 + 200 + 4000);
    expect(slip.net).toBe(50000 - slip.deductions);
    expect(slip.otherDeductions).toBe(2500);
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

const SETTINGS: StatutorySettings = {
  pfEnabled: true,
  pfEmployeePercent: 12,
  pfWageCeiling: 15_000,
  esiEnabled: true,
  esiEmployeePercent: 0.75,
  esiWageLimit: 21_000,
  professionalTaxMonthly: 200,
  tdsMode: 'NONE',
  tdsFlatPercent: 0,
};

describe('providentFund', () => {
  it('is a percentage of basic while basic is under the ceiling', () => {
    expect(providentFund(10_000, SETTINGS, true)).toBe(1_200);
  });

  it('caps at the wage ceiling once basic goes above it', () => {
    // 12% of 15,000, not of 40,000 — the whole point of the ceiling.
    expect(providentFund(40_000, SETTINGS, true)).toBe(1_800);
    expect(providentFund(15_000, SETTINGS, true)).toBe(1_800);
  });

  it('is nothing when the company has PF off, or the employee is outside the scheme', () => {
    expect(providentFund(10_000, { ...SETTINGS, pfEnabled: false }, true)).toBe(0);
    expect(providentFund(10_000, SETTINGS, false)).toBe(0);
  });
});

describe('employeeStateInsurance', () => {
  it('covers an employee earning exactly the wage limit', () => {
    expect(employeeStateInsurance(21_000, SETTINGS, true)).toBe(158);
  });

  it('stops the rupee above the wage limit', () => {
    expect(employeeStateInsurance(21_001, SETTINGS, true)).toBe(0);
  });

  it('is nothing when the company has ESI off, or the employee is outside the scheme', () => {
    expect(employeeStateInsurance(15_000, { ...SETTINGS, esiEnabled: false }, true)).toBe(0);
    expect(employeeStateInsurance(15_000, SETTINGS, false)).toBe(0);
  });
});

describe('taxDeductedAtSource', () => {
  const flat = { ...SETTINGS, tdsMode: 'FLAT_PERCENT', tdsFlatPercent: 10 };

  it('withholds nothing at all in NONE mode, whatever rate is on file', () => {
    expect(taxDeductedAtSource(100_000, SETTINGS, 30)).toBe(0);
  });

  it('takes the company rate when the employee has none', () => {
    expect(taxDeductedAtSource(50_000, flat, 0)).toBe(5_000);
  });

  it("lets the employee's own rate beat the company one", () => {
    expect(taxDeductedAtSource(50_000, flat, 20)).toBe(10_000);
  });

  it('in SLAB mode uses only a rate recorded against the employee', () => {
    const slab = { ...flat, tdsMode: 'SLAB' };
    expect(taxDeductedAtSource(50_000, slab, 0)).toBe(0);
    expect(taxDeductedAtSource(50_000, slab, 5)).toBe(2_500);
  });

  it('never withholds tax on negative taxable pay', () => {
    expect(taxDeductedAtSource(-5_000, flat, 0)).toBe(0);
  });
});

describe('statutoryDeductions', () => {
  const LOW = { basic: 10_000, hra: 4_000, allowances: 2_000, deductions: 0 };

  it('charges PF on basic, ESI on gross and professional tax flat', () => {
    expect(statutoryDeductions(LOW, 0, SETTINGS)).toEqual({
      pf: 1_200,
      esi: 120,
      professionalTax: 200,
      tds: 0,
    });
  });

  it('drops ESI for a gross above the wage limit while PF stays capped', () => {
    const high = { basic: 40_000, hra: 20_000, allowances: 10_000, deductions: 0 };
    expect(statutoryDeductions(high, 0, SETTINGS)).toEqual({
      pf: 1_800,
      esi: 0,
      professionalTax: 200,
      tds: 0,
    });
  });

  it('taxes what is left after loss of pay and the other statutory heads', () => {
    const flat = { ...SETTINGS, tdsMode: 'FLAT_PERCENT', tdsFlatPercent: 10 };
    // 16,000 gross − 1,000 LOP − 1,200 PF − 120 ESI − 200 PT = 13,480 taxable
    expect(statutoryDeductions(LOW, 1_000, flat).tds).toBe(1_348);
  });

  it("lets the employee's structure override the company settings", () => {
    const overridden = statutoryDeductions(LOW, 0, { ...SETTINGS, tdsMode: 'FLAT_PERCENT' }, {
      pfApplicable: false,
      esiApplicable: false,
      tdsPercent: 10,
    });
    expect(overridden).toEqual({ pf: 0, esi: 0, professionalTax: 200, tds: 1_580 });
  });
});

describe('computeMonthlySlip', () => {
  it('wires loss of pay, the statutory lines and the totals together', () => {
    const structure = { basic: 31_000, hra: 0, allowances: 0, deductions: 500 };
    // 2 unpaid days in a 31-day month = 2,000 off; PF capped at 1,800; no ESI above the limit.
    const slip = computeMonthlySlip(structure, 2026, 3, 2, SETTINGS);
    expect(slip).toMatchObject({
      gross: 31_000,
      lossOfPay: 2_000,
      pf: 1_800,
      esi: 0,
      professionalTax: 200,
      tds: 0,
      otherDeductions: 500,
    });
    expect(slip.deductions).toBe(500 + 2_000 + 1_800 + 200);
    expect(slip.net).toBe(31_000 - slip.deductions);
  });
});
