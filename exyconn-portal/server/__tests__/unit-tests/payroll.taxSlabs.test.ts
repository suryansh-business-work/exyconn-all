import {
  annualTaxForSlabs,
  computeMonthlySlip,
  financialYearOf,
  monthlyTdsFromSlabs,
  payableMonthsInFinancialYear,
  taxDeductedAtSource,
  type StatutorySettings,
  type TaxRegimeFigures,
  type TaxSlabRow,
} from '../../src/modules/payroll/payroll.compute';
import { payslipLines } from '../../src/modules/payroll/payslip.lines';
import { PayrollSettingsModel, payrollResolvers } from '../../src/modules/payroll';
import { TaxRegimeModel, TaxSlabModel } from '../../src/modules/payroll/tax-slab.model';
import { ensureTaxSlabs } from '../../src/modules/payroll/tax-slab.seed';
import { SalaryStructureModel } from '../../src/modules/employee/salary.model';
import { SalarySlipModel } from '../../src/modules/employee/salarySlip.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

/**
 * Deliberately NOT the seeded Indian figures. A test written against the seed would fail
 * the day somebody corrects the seed against a finance act, which is the one thing the
 * table is there to allow.
 */
const REGIME: TaxRegimeFigures = {
  standardDeduction: 50_000,
  rebateIncomeLimit: 250_000,
  rebateMaxTax: 20_000,
  cessPercent: 0,
  active: true,
};

const band = (
  fromAmount: number,
  toAmount: number | null,
  ratePercent: number,
  order: number,
): TaxSlabRow => ({ fromAmount, toAmount, ratePercent, order, active: true });

/** 0 up to 200k, 10% to 500k, 20% above. */
const SLABS: TaxSlabRow[] = [
  band(0, 200_000, 0, 0),
  band(200_000, 500_000, 10, 1),
  band(500_000, null, 20, 2),
];

/** The same regime with the rebate switched off, so a band test measures only the bands. */
const BANDS: TaxRegimeFigures = { ...REGIME, rebateIncomeLimit: 0, rebateMaxTax: 0 };

const APRIL = 4;

describe('annualTaxForSlabs', () => {
  it('withholds nothing on income that lands inside the first band', () => {
    // 200_000 − 50_000 standard deduction = 150_000, all of it in the 0% band.
    expect(annualTaxForSlabs(200_000, BANDS, SLABS)).toBe(0);
  });

  it('does not start the next band until the boundary is passed', () => {
    // Exactly 200_000 taxable: the whole of it still belongs to the band below.
    expect(annualTaxForSlabs(250_000, BANDS, SLABS)).toBe(0);
    // Ten rupees over is taxed at 10% on those ten alone, not on the whole income.
    expect(annualTaxForSlabs(250_010, BANDS, SLABS)).toBe(1);
  });

  it('taxes each band only on the part of the income inside it, above the top band', () => {
    // 750_000 taxable = 0 on the first 200_000, 10% of 300_000, 20% of 250_000.
    expect(annualTaxForSlabs(800_000, BANDS, SLABS)).toBe(30_000 + 50_000);
  });

  it('is exact on the top band’s own boundary', () => {
    expect(annualTaxForSlabs(550_000, BANDS, SLABS)).toBe(30_000);
  });

  it('writes the bill off entirely below the rebate threshold', () => {
    // 250_000 taxable earns a 5_000 bill, which is inside the 20_000 rebate.
    expect(annualTaxForSlabs(300_000, REGIME, SLABS)).toBe(0);
    // Ten rupees past the threshold and the whole bill is payable again — the rebate is a
    // cliff, not a taper, so the step is the behaviour and not a rounding error.
    expect(annualTaxForSlabs(300_010, REGIME, SLABS)).toBe(5_001);
  });

  it('caps the rebate at what the regime allows', () => {
    const small = { ...REGIME, rebateMaxTax: 2_000 };
    expect(annualTaxForSlabs(300_000, small, SLABS)).toBe(3_000);
  });

  it('charges cess on the tax, never on the income', () => {
    const withCess = { ...BANDS, cessPercent: 4 };
    expect(annualTaxForSlabs(350_000, withCess, SLABS)).toBe(10_400);
  });

  it('withholds nothing under an inactive regime', () => {
    expect(annualTaxForSlabs(800_000, { ...BANDS, active: false }, SLABS)).toBe(0);
  });

  it('falls back to zero on an empty table rather than throwing', () => {
    expect(annualTaxForSlabs(800_000, BANDS, [])).toBe(0);
    expect(annualTaxForSlabs(800_000, null, SLABS)).toBe(0);
    expect(
      annualTaxForSlabs(
        800_000,
        BANDS,
        SLABS.map((s) => ({ ...s, active: false })),
      ),
    ).toBe(0);
  });

  it('walks the bands lowest first however they were entered, and skips retired ones', () => {
    const shuffled = [SLABS[2], SLABS[0], SLABS[1]];
    expect(annualTaxForSlabs(800_000, BANDS, shuffled)).toBe(80_000);

    const without20 = SLABS.map((s) => (s.ratePercent === 20 ? { ...s, active: false } : s));
    expect(annualTaxForSlabs(800_000, BANDS, without20)).toBe(30_000);
  });

  it('never taxes an income below the standard deduction', () => {
    expect(annualTaxForSlabs(40_000, BANDS, SLABS)).toBe(0);
    expect(annualTaxForSlabs(-1_000, BANDS, SLABS)).toBe(0);
  });
});

describe('monthlyTdsFromSlabs', () => {
  it('annualises a full year’s month, taxes it, and divides it back', () => {
    // 80_000 × 12 = 960_000; 910_000 taxable = 30_000 + 82_000 = 112_000 over the year.
    expect(monthlyTdsFromSlabs(80_000, 12, REGIME, SLABS)).toBe(Math.round(112_000 / 12));
  });

  it('does not over-deduct a mid-year joiner in their first month', () => {
    const fullYear = monthlyTdsFromSlabs(80_000, 12, REGIME, SLABS);
    // Four months left: 320_000 for the year, 270_000 taxable, a 7_000 bill over 4 months.
    const joiner = monthlyTdsFromSlabs(80_000, 4, REGIME, SLABS);

    expect(joiner).toBe(Math.round(7_000 / 4));
    expect(joiner).toBeLessThan(fullYear);
  });

  it('withholds nothing on a month with nothing taxable, or with no months to spread over', () => {
    expect(monthlyTdsFromSlabs(0, 12, REGIME, SLABS)).toBe(0);
    expect(monthlyTdsFromSlabs(-100, 12, REGIME, SLABS)).toBe(0);
    expect(monthlyTdsFromSlabs(80_000, 0, REGIME, SLABS)).toBe(0);
  });

  it('is whole money, never a fraction of a rupee', () => {
    expect(Number.isInteger(monthlyTdsFromSlabs(79_999, 12, REGIME, SLABS))).toBe(true);
  });
});

describe('the financial year a period falls in', () => {
  it('names the year the financial year opened in', () => {
    expect(financialYearOf(2026, 9, APRIL)).toBe('2026-27');
    expect(financialYearOf(2026, 4, APRIL)).toBe('2026-27');
    expect(financialYearOf(2026, 3, APRIL)).toBe('2025-26');
  });

  it('follows a workspace whose year opens in January', () => {
    expect(financialYearOf(2026, 3, 1)).toBe('2026-27');
    expect(financialYearOf(2026, 12, 1)).toBe('2026-27');
  });

  it('pads the far side of a century boundary', () => {
    expect(financialYearOf(2099, 9, APRIL)).toBe('2099-00');
  });
});

describe('payableMonthsInFinancialYear', () => {
  const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

  it('is a whole year for anybody who was already here when it opened', () => {
    expect(payableMonthsInFinancialYear(null, 2026, 9, APRIL)).toBe(12);
    expect(payableMonthsInFinancialYear(day('2019-06-01'), 2026, 9, APRIL)).toBe(12);
    expect(payableMonthsInFinancialYear(day('2026-04-01'), 2026, 9, APRIL)).toBe(12);
  });

  it('counts a joiner’s months from their joining month to the year’s end', () => {
    expect(payableMonthsInFinancialYear(day('2026-10-15'), 2026, 10, APRIL)).toBe(6);
    expect(payableMonthsInFinancialYear(day('2027-03-01'), 2027, 3, APRIL)).toBe(1);
  });

  it('never returns zero, so there is always something to divide the year’s tax by', () => {
    expect(payableMonthsInFinancialYear(day('2028-06-01'), 2026, 9, APRIL)).toBe(1);
  });
});

describe('taxDeductedAtSource precedence', () => {
  const settings = (over: Partial<StatutorySettings> = {}): StatutorySettings => ({
    pfEnabled: false,
    pfEmployeePercent: 0,
    pfWageCeiling: 0,
    esiEnabled: false,
    esiEmployeePercent: 0,
    esiWageLimit: 0,
    professionalTaxMonthly: 0,
    tdsMode: 'SLAB',
    tdsFlatPercent: 30,
    ...over,
  });
  const slabTax = { regime: REGIME, slabs: SLABS, payableMonths: 12 };

  it('lets the employee’s own recorded rate beat the slab table', () => {
    expect(taxDeductedAtSource(80_000, settings(), 5, slabTax)).toBe(4_000);
  });

  it('uses the table when the employee has no rate of their own', () => {
    expect(taxDeductedAtSource(80_000, settings(), 0, slabTax)).toBe(
      monthlyTdsFromSlabs(80_000, 12, REGIME, SLABS),
    );
  });

  it('withholds nothing in SLAB mode with no table resolved', () => {
    expect(taxDeductedAtSource(80_000, settings(), 0)).toBe(0);
  });

  it('still withholds nothing at all under NONE, whatever else is set', () => {
    expect(taxDeductedAtSource(80_000, settings({ tdsMode: 'NONE' }), 5, slabTax)).toBe(0);
  });

  it('leaves FLAT_PERCENT taking the company rate, untouched by the table', () => {
    expect(taxDeductedAtSource(80_000, settings({ tdsMode: 'FLAT_PERCENT' }), 0, slabTax)).toBe(
      24_000,
    );
  });
});

describe('the payslip’s TDS line', () => {
  it('prints what the slab table withheld, under its statutory name', () => {
    const parts = { basic: 50_000, hra: 20_000, allowances: 10_000, deductions: 0 };
    const settings: StatutorySettings = {
      pfEnabled: false,
      pfEmployeePercent: 0,
      pfWageCeiling: 0,
      esiEnabled: false,
      esiEmployeePercent: 0,
      esiWageLimit: 0,
      professionalTaxMonthly: 0,
      tdsMode: 'SLAB',
      tdsFlatPercent: 0,
    };

    const slip = computeMonthlySlip(
      parts,
      2026,
      9,
      0,
      settings,
      {},
      { regime: REGIME, slabs: SLABS, payableMonths: 12 },
    );
    const lines = payslipLines(slip, parts);

    expect(slip.tds).toBe(monthlyTdsFromSlabs(80_000, 12, REGIME, SLABS));
    expect(lines.deductions).toContainEqual({ label: 'Income tax (TDS)', amount: slip.tds });
    expect(slip.net).toBe(slip.gross - slip.tds);
  });
});

describe('ensureTaxSlabs', () => {
  it('seeds one regime and its bands on an empty database', async () => {
    const inserted = await ensureTaxSlabs();

    expect(inserted).toBeGreaterThan(0);
    const regime = await TaxRegimeModel.findOne({ regimeKey: 'NEW' }).lean();
    expect(regime?.standardDeduction).toBeGreaterThan(0);
    expect(await TaxSlabModel.countDocuments()).toBe(inserted);
    const top = await TaxSlabModel.findOne({ toAmount: null }).lean();
    expect(top?.ratePercent).toBeGreaterThan(0);
  });

  it('never overwrites a table HR has corrected', async () => {
    await ensureTaxSlabs();
    await TaxRegimeModel.updateOne({ regimeKey: 'NEW' }, { standardDeduction: 1 });
    await TaxSlabModel.deleteMany({ ratePercent: 0 });
    const before = await TaxSlabModel.countDocuments();

    expect(await ensureTaxSlabs()).toBe(0);
    expect((await TaxRegimeModel.findOne({ regimeKey: 'NEW' }).lean())?.standardDeduction).toBe(1);
    expect(await TaxSlabModel.countDocuments()).toBe(before);
  });
});

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const M = payrollResolvers.Mutation as unknown as Record<string, Resolver>;
const hr = {
  user: { id: 'hr', email: 'hr@exyconn.com', roles: [ROLES.HR] },
} as unknown as GraphQLContext;

/** The company policy a run is worked out against, stated by the test rather than defaulted. */
async function setSlabPolicy() {
  await PayrollSettingsModel.updateOne(
    { key: 'global' },
    {
      $set: {
        key: 'global',
        pfEnabled: false,
        esiEnabled: false,
        professionalTaxMonthly: 0,
        tdsMode: 'SLAB',
        tdsFlatPercent: 0,
        tdsRegimeKey: 'TEST',
        financialYearStartMonth: APRIL,
      },
    },
    { upsert: true },
  );
}

/** The test regime and its bands, on file for the financial year the run falls in. */
async function seedTestTable(financialYear: string) {
  await TaxRegimeModel.create({ ...REGIME, regimeKey: 'TEST', financialYear, name: 'Test regime' });
  await TaxSlabModel.insertMany(
    SLABS.map((slab) => ({ ...slab, regimeKey: 'TEST', financialYear })),
  );
}

async function employeeOn(email: string, joinDate: Date): Promise<string> {
  const user = await seedUser(email, 'whatever123', [ROLES.EMPLOYEE]);
  await UserModel.updateOne({ _id: user._id }, { joinDate });
  await SalaryStructureModel.create({
    employeeId: String(user._id),
    basic: 50_000,
    hra: 20_000,
    allowances: 10_000,
    deductions: 0,
    effectiveFrom: joinDate,
  });
  return String(user._id);
}

describe('a payroll run in SLAB mode', () => {
  beforeEach(setSlabPolicy);

  it('withholds the table’s figure, and less from a mid-year joiner', async () => {
    await seedTestTable('2026-27');
    const veteran = await employeeOn('veteran@exyconn.com', new Date('2020-01-01T00:00:00.000Z'));
    const joiner = await employeeOn('joiner@exyconn.com', new Date('2026-12-01T00:00:00.000Z'));

    await M.runPayroll(null, { month: 12, year: 2026 }, hr);

    const veteranSlip = await SalarySlipModel.findOne({ employeeId: veteran }).lean();
    const joinerSlip = await SalarySlipModel.findOne({ employeeId: joiner }).lean();
    expect(veteranSlip?.tds).toBe(monthlyTdsFromSlabs(80_000, 12, REGIME, SLABS));
    expect(joinerSlip?.tds).toBe(monthlyTdsFromSlabs(80_000, 4, REGIME, SLABS));
    expect(joinerSlip?.tds).toBeLessThan(veteranSlip?.tds ?? 0);
  });

  it('withholds nothing when the year being run has no table on file', async () => {
    await seedTestTable('2019-20');
    const employee = await employeeOn('nobody@exyconn.com', new Date('2020-01-01T00:00:00.000Z'));

    await M.runPayroll(null, { month: 12, year: 2026 }, hr);

    const slip = await SalarySlipModel.findOne({ employeeId: employee }).lean();
    expect(slip?.tds).toBe(0);
    expect(slip?.net).toBe(80_000);
  });

  it('reads the table for the financial year the PERIOD falls in, not the calendar year', async () => {
    await seedTestTable('2025-26');
    const employee = await employeeOn('march@exyconn.com', new Date('2020-01-01T00:00:00.000Z'));

    // March 2026 still belongs to the financial year that opened in April 2025.
    await M.runPayroll(null, { month: 3, year: 2026 }, hr);

    const slip = await SalarySlipModel.findOne({ employeeId: employee }).lean();
    expect(slip?.tds).toBe(monthlyTdsFromSlabs(80_000, 12, REGIME, SLABS));
  });
});
