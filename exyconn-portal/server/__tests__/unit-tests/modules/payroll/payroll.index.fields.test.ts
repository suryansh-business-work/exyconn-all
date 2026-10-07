import { payrollResolvers } from '../../../../src/modules/payroll';
import { useTestOrganization } from '../../../helpers';

useTestOrganization({ currency: 'EUR', locale: 'en-US', taxSystem: 'NONE' });

type Field = (row: object) => unknown;
const slip = payrollResolvers.SalarySlip as unknown as Record<string, Field>;
const settings = payrollResolvers.PayrollSettings as unknown as Record<string, Field>;
const structure = payrollResolvers.SalaryStructure as unknown as Record<string, Field>;

describe('SalarySlip statutory fields', () => {
  it('reads a slip generated before statutory deductions existed as withholding nothing', () => {
    for (const field of ['pf', 'esi', 'professionalTax', 'tds', 'otherDeductions']) {
      expect(slip[field]({})).toBe(0);
      expect(slip[field]({ [field]: null })).toBe(0);
    }
  });

  it('passes through what the slip actually withheld', () => {
    const row = { pf: 1_800, esi: 120, professionalTax: 200, tds: 900, otherDeductions: 50 };
    expect(slip.pf(row)).toBe(1_800);
    expect(slip.esi(row)).toBe(120);
    expect(slip.professionalTax(row)).toBe(200);
    expect(slip.tds(row)).toBe(900);
    expect(slip.otherDeductions(row)).toBe(50);
  });
});

describe('PayrollSettings tax-table fields', () => {
  it('defaults settings saved before the tax table existed', () => {
    expect(settings.tdsSlabs({})).toEqual([]);
    expect(settings.tdsAnnualExemption({})).toBe(0);
    expect(settings.tdsCessPercent({})).toBe(0);
    expect(settings.tdsRegimeKey({})).toBe('NEW');
    expect(settings.financialYearStartMonth({})).toBe(4);
  });

  it('keeps what HR saved', () => {
    const saved = {
      tdsSlabs: [{ upTo: null, percent: 10 }],
      tdsAnnualExemption: 50_000,
      tdsCessPercent: 4,
      tdsRegimeKey: 'OLD',
      financialYearStartMonth: 1,
    };
    expect(settings.tdsSlabs(saved)).toEqual(saved.tdsSlabs);
    expect(settings.tdsAnnualExemption(saved)).toBe(50_000);
    expect(settings.tdsCessPercent(saved)).toBe(4);
    expect(settings.tdsRegimeKey(saved)).toBe('OLD');
    expect(settings.financialYearStartMonth(saved)).toBe(1);
  });
});

describe('SalaryStructure derived fields', () => {
  it('reads an old structure as a FIXED salary to which every statutory head applies', () => {
    const legacy = { basic: 1_000, hra: 0, allowances: 0, deductions: 0 };
    expect(structure.payType(legacy)).toBe('FIXED');
    expect(structure.rate(legacy)).toBe(0);
    expect(structure.billingRate(legacy)).toBe(0);
    expect(structure.pfApplicable(legacy)).toBe(true);
    expect(structure.esiApplicable(legacy)).toBe(true);
    expect(structure.tdsPercent(legacy)).toBe(0);
    expect(structure.taxRegimeKey(legacy)).toBeNull();
    expect(structure.taxExempt(legacy)).toBe(false);
  });

  it('keeps every value that was saved', () => {
    const saved = {
      payType: 'HOURLY',
      rate: 40,
      billingRate: 90,
      pfApplicable: false,
      esiApplicable: false,
      tdsPercent: 12,
      taxRegimeKey: 'OLD',
      taxExempt: true,
    };
    expect(structure.payType(saved)).toBe('HOURLY');
    expect(structure.rate(saved)).toBe(40);
    expect(structure.billingRate(saved)).toBe(90);
    expect(structure.pfApplicable(saved)).toBe(false);
    expect(structure.esiApplicable(saved)).toBe(false);
    expect(structure.tdsPercent(saved)).toBe(12);
    expect(structure.taxRegimeKey(saved)).toBe('OLD');
    expect(structure.taxExempt(saved)).toBe(true);
  });

  it('shows gross and net as the monthly figures the employee view shows', () => {
    const fixed = { basic: 30_000, hra: 10_000, allowances: 5_000, deductions: 2_000 };
    expect(structure.gross(fixed)).toBe(45_000);
    expect(structure.net(fixed)).toBe(43_000);

    const stipend = { payType: 'STIPEND', rate: 12_000, deductions: 500 };
    expect(structure.gross(stipend)).toBe(12_000);
    expect(structure.net(stipend)).toBe(11_500);

    const hourly = { payType: 'HOURLY', rate: 40, basic: 9_999 };
    expect(structure.gross(hourly)).toBe(0);
    expect(structure.net(hourly)).toBe(0);
  });

  it('normalises a stored currency and falls back to the company’s for an unusable one', async () => {
    await expect(structure.currency({ currency: ' usd ' })).resolves.toBe('USD');
    await expect(structure.currency({ currency: '₹' })).resolves.toBe('EUR');
    await expect(structure.currency({})).resolves.toBe('EUR');
  });
});
