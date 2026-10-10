import { monthlyEarnings } from '../../../../src/modules/payroll/payroll.compute';

describe('monthlyEarnings for a structure with no basic', () => {
  it('earns only the parts it has, reading the missing basic as zero', () => {
    expect(monthlyEarnings({ hra: 2_000, allowances: 500 })).toEqual({
      basic: 0,
      hra: 2_000,
      allowances: 500,
      deductions: 0,
    });
  });
});
