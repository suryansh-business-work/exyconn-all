import { describe, expect, it } from 'vitest';
import { PayType } from '@/graphql/generated';
import {
  COMPANY_TAX_REGIME,
  NO_TAX_BRACKET,
  compensationSchema,
  rateLabel,
  toCompensationValues,
  toSalaryInput,
  usesSingleAmount,
  type CompensationValues,
  type EmployeeSalary,
} from '@/components/pay';

const valid: CompensationValues = {
  payType: PayType.Fixed,
  payTypeNote: '',
  currency: 'INR',
  basic: '50000',
  hra: '20000',
  allowances: '5000',
  deductions: '1000',
  rate: '0',
  billingRate: '0',
  taxRegime: COMPANY_TAX_REGIME,
  effectiveFrom: '2026-04-01',
};

const issues = (values: CompensationValues) => {
  const result = compensationSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('pay type helpers', () => {
  it('pays hourly, stipend and other as a single amount, fixed as components', () => {
    expect(usesSingleAmount(PayType.Hourly)).toBe(true);
    expect(usesSingleAmount(PayType.Stipend)).toBe(true);
    expect(usesSingleAmount(PayType.Other)).toBe(true);
    expect(usesSingleAmount(PayType.Fixed)).toBe(false);
  });

  it('labels the rate per hour only for hourly pay', () => {
    expect(rateLabel(PayType.Hourly)).toBe('Rate per hour');
    expect(rateLabel(PayType.Stipend)).toBe('Amount per month');
  });
});

describe('compensationSchema', () => {
  it('accepts a complete fixed salary, and an empty optional money field', () => {
    expect(issues(valid)).toEqual([]);
    expect(issues({ ...valid, hra: '' })).toEqual([]);
  });

  it('rejects a negative or non-numeric amount', () => {
    expect(issues({ ...valid, hra: '-1' })).toEqual(['hra: HRA must be 0 or more']);
    expect(issues({ ...valid, deductions: 'abc' })).toEqual([
      'deductions: Deductions must be 0 or more',
    ]);
  });

  it('requires a currency and an effective date', () => {
    expect(issues({ ...valid, currency: '  ', effectiveFrom: '' })).toEqual([
      'currency: Currency is required',
      'effectiveFrom: Effective from is required',
    ]);
  });

  it('requires a basic salary above zero for fixed pay', () => {
    expect(issues({ ...valid, basic: '0' })).toEqual(['basic: Enter the basic salary']);
  });

  it('requires the single amount for a stipend, but not a basic', () => {
    const stipend = { ...valid, payType: PayType.Stipend, basic: '0' };
    expect(issues({ ...stipend, rate: '0' })).toEqual([
      'rate: Enter the amount this employee is paid',
    ]);
    expect(issues({ ...stipend, rate: '12000' })).toEqual([]);
  });

  it('requires a description of an "other" arrangement', () => {
    const other = { ...valid, payType: PayType.Other, rate: '100' };
    expect(issues({ ...other, payTypeNote: '   ' })).toEqual([
      'payTypeNote: Describe the pay arrangement',
    ]);
    expect(issues({ ...other, payTypeNote: 'Per milestone' })).toEqual([]);
  });
});

const stored = (patch: Partial<EmployeeSalary> = {}): EmployeeSalary => ({
  id: 'sal-1',
  employeeId: 'emp-1',
  currency: 'USD',
  payType: PayType.Hourly,
  payTypeNote: null,
  basic: 0,
  hra: 0,
  allowances: 0,
  deductions: 25,
  rate: 40,
  billingRate: 90,
  gross: 0,
  net: 0,
  pfApplicable: false,
  esiApplicable: false,
  tdsPercent: 0,
  taxRegimeKey: null,
  taxExempt: false,
  effectiveFrom: '2026-01-01',
  ...patch,
});

describe('toCompensationValues', () => {
  it('starts a new structure as fixed pay in the company currency from the join date', () => {
    expect(toCompensationValues(null, 'INR', '2026-05-04')).toEqual({
      payType: PayType.Fixed,
      payTypeNote: '',
      currency: 'INR',
      basic: '0',
      hra: '0',
      allowances: '0',
      deductions: '0',
      rate: '0',
      billingRate: '0',
      taxRegime: COMPANY_TAX_REGIME,
      effectiveFrom: '2026-05-04',
    });
  });

  it('leaves the effective date empty with no join date', () => {
    expect(toCompensationValues(null, 'INR').effectiveFrom).toBe('');
    expect(toCompensationValues(null, 'INR', null).effectiveFrom).toBe('');
  });

  it('reads a stored structure back, its own currency and date winning', () => {
    const values = toCompensationValues(stored({ payTypeNote: 'n' }), 'INR', '2026-05-04');
    expect(values).toMatchObject({
      payType: PayType.Hourly,
      payTypeNote: 'n',
      currency: 'USD',
      deductions: '25',
      rate: '40',
      billingRate: '90',
      effectiveFrom: '2026-01-01',
      taxRegime: COMPANY_TAX_REGIME,
    });
  });

  it('picks no tax bracket for an exempt employee, else their own regime', () => {
    expect(
      toCompensationValues(stored({ taxExempt: true, taxRegimeKey: 'NEW' }), 'INR').taxRegime,
    ).toBe(NO_TAX_BRACKET);
    expect(toCompensationValues(stored({ taxRegimeKey: 'OLD' }), 'INR').taxRegime).toBe('OLD');
  });
});

describe('toSalaryInput', () => {
  it('sends the components of a fixed salary and zeroes the single rate', () => {
    expect(toSalaryInput({ ...valid, rate: '99', payTypeNote: 'ignored' })).toEqual({
      currency: 'INR',
      payType: PayType.Fixed,
      payTypeNote: '',
      basic: 50000,
      hra: 20000,
      allowances: 5000,
      deductions: 1000,
      rate: 0,
      billingRate: 0,
      taxExempt: false,
      taxRegimeKey: null,
      effectiveFrom: '2026-04-01',
    });
  });

  it('zeroes the components a single-amount pay type does not use, keeping its note', () => {
    const input = toSalaryInput({
      ...valid,
      payType: PayType.Other,
      payTypeNote: 'Per milestone',
      rate: '700',
      taxRegime: 'NEW',
    });
    expect(input).toMatchObject({
      basic: 0,
      hra: 0,
      allowances: 0,
      rate: 700,
      payTypeNote: 'Per milestone',
      taxExempt: false,
      taxRegimeKey: 'NEW',
    });
  });

  it('marks no tax bracket as exempt with no regime key', () => {
    expect(toSalaryInput({ ...valid, taxRegime: NO_TAX_BRACKET })).toMatchObject({
      taxExempt: true,
      taxRegimeKey: null,
    });
  });
});
