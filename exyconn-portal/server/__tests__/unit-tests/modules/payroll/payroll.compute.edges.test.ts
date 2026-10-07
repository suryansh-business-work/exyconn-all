import {
  annualTaxForSlabs,
  lossOfPayFor,
  monthlyEarnings,
  payableMonthsInFinancialYear,
  progressiveTax,
  statutoryDeductions,
  taxDeductedAtSource,
  type StatutorySettings,
  type TaxRegimeFigures,
  type TaxSlabRow,
} from '../../../../src/modules/payroll/payroll.compute';

const SETTINGS: StatutorySettings = {
  pfEnabled: false,
  pfEmployeePercent: 12,
  pfWageCeiling: 15_000,
  esiEnabled: false,
  esiEmployeePercent: 0.75,
  esiWageLimit: 21_000,
  professionalTaxMonthly: 0,
  tdsMode: 'FLAT_PERCENT',
  tdsFlatPercent: 10,
};

const REGIME: TaxRegimeFigures = {
  standardDeduction: 0,
  rebateIncomeLimit: 0,
  rebateMaxTax: 0,
  cessPercent: 0,
  active: true,
};

/** Untaxed to 120k a year, 10% above it. */
const SLABS: TaxSlabRow[] = [
  { fromAmount: 0, toAmount: 120_000, ratePercent: 0, order: 0, active: true },
  { fromAmount: 120_000, toAmount: null, ratePercent: 10, order: 1, active: true },
];

describe('monthlyEarnings', () => {
  it('reads a structure saved before pay types existed as FIXED, missing parts as zero', () => {
    expect(monthlyEarnings({ basic: 10_000 })).toEqual({
      basic: 10_000,
      hra: 0,
      allowances: 0,
      deductions: 0,
    });
  });

  it('turns OTHER pay into basic, and a stipend with no rate into nothing', () => {
    expect(monthlyEarnings({ payType: 'OTHER', rate: 7_000, hra: 3_000 })).toEqual({
      basic: 7_000,
      hra: 0,
      allowances: 0,
      deductions: 0,
    });
    expect(monthlyEarnings({ payType: 'STIPEND', deductions: 100 }).basic).toBe(0);
  });

  it('keeps the deductions of an hourly employee, whose monthly earnings are zero', () => {
    expect(monthlyEarnings({ payType: 'HOURLY', deductions: 250 })).toEqual({
      basic: 0,
      hra: 0,
      allowances: 0,
      deductions: 250,
    });
  });
});

describe('lossOfPayFor', () => {
  it('charges a rounded per-day share of basic for each unpaid day', () => {
    // February 2026 has 28 days: 28,000 / 28 = 1,000 a day.
    expect(lossOfPayFor({ basic: 28_000 }, 2026, 2, 3)).toBe(3_000);
    expect(lossOfPayFor({ basic: 10_000 }, 2026, 3, 1)).toBe(323);
    expect(lossOfPayFor({ basic: 10_000 }, 2026, 3, 0)).toBe(0);
  });
});

describe('progressiveTax', () => {
  const bands = [
    { from: 0, to: 100, rate: 0 },
    { from: 100, to: 200, rate: 10 },
    { from: 200, to: null, rate: 50 },
  ];

  it('is nothing on a zero or negative income', () => {
    expect(progressiveTax(0, bands)).toBe(0);
    expect(progressiveTax(-50, bands)).toBe(0);
  });

  it('charges each band only on the slice of income inside it', () => {
    expect(progressiveTax(150, bands)).toBe(5);
    expect(progressiveTax(300, bands)).toBe(10 + 50);
  });

  it('is nothing with no bands at all', () => {
    expect(progressiveTax(1_000, [])).toBe(0);
  });
});

describe('annualTaxForSlabs — bands entered under one order', () => {
  it('orders tied bands by where they start, and reads a missing upper bound as open', () => {
    const tied: TaxSlabRow[] = [
      { fromAmount: 120_000, ratePercent: 10, order: 0, active: true },
      { fromAmount: 0, toAmount: 120_000, ratePercent: 0, order: 0, active: true },
    ];
    // 300,000 − 120,000 free = 180,000 at 10%.
    expect(annualTaxForSlabs(300_000, REGIME, tied)).toBe(18_000);
  });
});

describe('taxDeductedAtSource — a regime chosen for the employee', () => {
  const ownTable = { regime: REGIME, slabs: SLABS, payableMonths: 12, ownRegime: true };

  it('walks their own regime even while the company withholds a flat percentage', () => {
    // 20,000 × 12 = 240,000; 10% of the 120,000 above the free band = 12,000 a year.
    expect(taxDeductedAtSource(20_000, SETTINGS, 0, ownTable)).toBe(1_000);
  });

  it('takes the flat company rate when the regime is the inherited one', () => {
    expect(taxDeductedAtSource(20_000, SETTINGS, 0, { ...ownTable, ownRegime: false })).toBe(2_000);
  });

  it('withholds nothing in FLAT_PERCENT mode with no company rate set', () => {
    expect(taxDeductedAtSource(20_000, { ...SETTINGS, tdsFlatPercent: 0 }, 0)).toBe(0);
  });
});

describe('statutoryDeductions — no tax bracket', () => {
  const parts = { basic: 30_000, hra: 10_000, allowances: 0, deductions: 0 };

  it('withholds no TDS from an exempt employee, whatever rate is on file', () => {
    const lines = statutoryDeductions(
      parts,
      0,
      { ...SETTINGS, pfEnabled: true, professionalTaxMonthly: 200 },
      { taxExempt: true, tdsPercent: 30 },
    );
    expect(lines).toEqual({ pf: 1_800, esi: 0, professionalTax: 200, tds: 0 });
  });

  it('taxes the same employee as usual once the exemption is lifted', () => {
    const lines = statutoryDeductions(parts, 0, SETTINGS, { taxExempt: false });
    expect(lines.tds).toBe(4_000);
  });
});

describe('payableMonthsInFinancialYear — joiners', () => {
  it('counts every month left for somebody who joined in the year’s second month', () => {
    expect(payableMonthsInFinancialYear(new Date('2026-05-10T00:00:00.000Z'), 2026, 6, 4)).toBe(11);
  });

  it('follows a calendar financial year', () => {
    expect(payableMonthsInFinancialYear(new Date('2026-07-01T00:00:00.000Z'), 2026, 9, 1)).toBe(6);
  });

  it('treats an undefined join date like an unknown one: the whole year', () => {
    expect(payableMonthsInFinancialYear(undefined, 2026, 9, 4)).toBe(12);
  });
});
