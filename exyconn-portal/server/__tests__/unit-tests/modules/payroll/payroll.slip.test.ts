import {
  payslipTitle,
  slabTaxFor,
  slipFields,
  slipFor,
  startMonthOf,
  taxTablesFor,
  type TaxTables,
} from '../../../../src/modules/payroll/payroll.slip';
import { TaxRegimeModel, TaxSlabModel } from '../../../../src/modules/payroll/tax-slab.model';
import { LeaveRequestModel } from '../../../../src/modules/hr/hr.model';
import { useTestOrganization } from '../../../helpers';
import type { StatutorySettings } from '../../../../src/modules/payroll/payroll.compute';

useTestOrganization({ currency: 'INR', locale: 'en-IN', taxSystem: 'INDIA_GST' });

const NO_POLICY: StatutorySettings = {
  pfEnabled: false,
  pfEmployeePercent: 0,
  pfWageCeiling: 0,
  esiEnabled: false,
  esiEmployeePercent: 0,
  esiWageLimit: 0,
  professionalTaxMonthly: 0,
  tdsMode: 'FLAT_PERCENT',
  tdsFlatPercent: 10,
};

const NO_SLABS = { regime: null, slabs: [], payableMonths: 12 };

describe('startMonthOf', () => {
  it('reads the stored month, or April for settings saved before the field existed', () => {
    expect(startMonthOf({ tdsMode: 'SLAB', financialYearStartMonth: 1 })).toBe(1);
    expect(startMonthOf({ tdsMode: 'SLAB', financialYearStartMonth: null })).toBe(4);
    expect(startMonthOf({ tdsMode: 'SLAB' })).toBe(4);
  });
});

describe('slipFields and payslipTitle', () => {
  it('stores every amount column beside the currency', () => {
    const figures = {
      gross: 100,
      lossOfPay: 5,
      pf: 1,
      esi: 2,
      professionalTax: 3,
      tds: 4,
      otherDeductions: 6,
      deductions: 21,
      net: 79,
    };
    expect(slipFields(figures, 'INR')).toEqual({
      currency: 'INR',
      gross: 100,
      deductions: 21,
      pf: 1,
      esi: 2,
      professionalTax: 3,
      tds: 4,
      otherDeductions: 6,
      net: 79,
    });
  });

  it('titles the document after the month it covers', () => {
    expect(payslipTitle(1, 2027)).toBe('Payslip January 2027');
  });
});

describe('taxTablesFor', () => {
  it('reads nothing in NONE mode and still names the default regime', async () => {
    const tables = await taxTablesFor({ tdsMode: 'NONE', tdsRegimeKey: null }, 9, 2026);
    expect(tables.defaultKey).toBe('NEW');
    expect(tables.byKey.size).toBe(0);
  });

  it('groups each regime of the period’s financial year with its own bands only', async () => {
    await TaxRegimeModel.create({ regimeKey: 'A', financialYear: '2026-27', name: 'A' });
    await TaxRegimeModel.create({ regimeKey: 'B', financialYear: '2026-27', name: 'B' });
    await TaxRegimeModel.create({ regimeKey: 'A', financialYear: '2025-26', name: 'A old' });
    await TaxSlabModel.insertMany([
      { regimeKey: 'A', financialYear: '2026-27', fromAmount: 0, ratePercent: 5, order: 0 },
      { regimeKey: 'B', financialYear: '2026-27', fromAmount: 0, ratePercent: 7, order: 0 },
      { regimeKey: 'A', financialYear: '2025-26', fromAmount: 0, ratePercent: 9, order: 0 },
    ]);

    const tables = await taxTablesFor({ tdsMode: 'SLAB', tdsRegimeKey: 'B' }, 9, 2026);

    expect(tables.defaultKey).toBe('B');
    expect([...tables.byKey.keys()].sort((a, b) => a.localeCompare(b))).toEqual(['A', 'B']);
    expect(tables.byKey.get('A')?.regime).toMatchObject({ name: 'A' });
    expect(tables.byKey.get('A')?.slabs.map((s) => s.ratePercent)).toEqual([5]);
    expect(tables.byKey.get('B')?.slabs.map((s) => s.ratePercent)).toEqual([7]);
  });
});

describe('slabTaxFor', () => {
  const company = { regime: null, slabs: [] };
  const own = { regime: null, slabs: [{ fromAmount: 0, ratePercent: 1, order: 0, active: true }] };
  const tables: TaxTables = {
    defaultKey: 'NEW',
    byKey: new Map([
      ['NEW', company],
      ['OLD', own],
    ]),
  };

  it('uses the company regime for an employee with none of their own', () => {
    expect(slabTaxFor(tables, null, 12)).toEqual({
      ...company,
      payableMonths: 12,
      ownRegime: false,
    });
    expect(slabTaxFor(tables, undefined, 6).ownRegime).toBe(false);
    expect(slabTaxFor(tables, '', 6).ownRegime).toBe(false);
  });

  it('uses the employee’s own regime when HR chose one', () => {
    expect(slabTaxFor(tables, 'OLD', 3)).toEqual({ ...own, payableMonths: 3, ownRegime: true });
  });

  it('withholds from no table when the chosen regime has none this year', () => {
    expect(slabTaxFor(tables, 'GONE', 12)).toEqual({
      regime: null,
      slabs: [],
      payableMonths: 12,
      ownRegime: true,
    });
  });
});

describe('slipFor', () => {
  const employeeId = 'emp-slip';

  it('charges the month’s approved unpaid leave against a stipend', async () => {
    await LeaveRequestModel.create({
      employeeId,
      type: 'UNPAID',
      fromDate: new Date('2026-04-01'),
      toDate: new Date('2026-04-03'),
      reason: 'x',
      status: 'APPROVED',
    });
    await LeaveRequestModel.create({
      employeeId,
      type: 'UNPAID',
      fromDate: new Date('2026-04-10'),
      toDate: new Date('2026-04-10'),
      reason: 'x',
      status: 'PENDING',
    });

    const slip = await slipFor(
      employeeId,
      { payType: 'STIPEND', rate: 30_000, basic: 0, hra: 0, allowances: 0, deductions: 0 },
      4,
      2026,
      { ...NO_POLICY, tdsFlatPercent: 0 },
      NO_SLABS,
    );

    // April has 30 days: 1,000 a day for three approved days; the pending one is not charged.
    expect(slip).toMatchObject({ gross: 30_000, lossOfPay: 3_000, net: 27_000 });
  });

  it('carries the structure’s own statutory position into the slip', async () => {
    const structure = { basic: 20_000, hra: 0, allowances: 0, deductions: 0 };
    const taxed = await slipFor(employeeId, structure, 4, 2026, NO_POLICY, NO_SLABS);
    const exempt = await slipFor(
      employeeId,
      { ...structure, taxExempt: true },
      4,
      2026,
      NO_POLICY,
      NO_SLABS,
    );

    expect(taxed.tds).toBe(2_000);
    expect(exempt.tds).toBe(0);
    expect(exempt.net).toBe(20_000);
  });
});
