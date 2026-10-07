import { TdsMode } from '@exyconn/shell/graphql/generated';
import type { PayrollSettingsRow } from '../../../../src/pages/payroll-settings/forms/payroll-settings';

/** A company withholding every head, with income tax on two bands of the NEW regime. */
export function payrollSettings(over: Partial<PayrollSettingsRow> = {}): PayrollSettingsRow {
  return {
    pfEnabled: true,
    pfEmployeePercent: 12,
    pfWageCeiling: 15000,
    esiEnabled: true,
    esiEmployeePercent: 0.75,
    esiWageLimit: 21000,
    professionalTaxMonthly: 200,
    tdsMode: TdsMode.Slab,
    tdsFlatPercent: 10,
    tdsAnnualExemption: 50000,
    tdsCessPercent: 4,
    tdsRegimeKey: 'NEW',
    financialYearStartMonth: 4,
    runFromDay: 25,
    tdsSlabs: [
      { upTo: 300000, percent: 0 },
      { upTo: null, percent: 5 },
    ],
    ...over,
  };
}

/** The regimes on file in HR › Tax Slabs. */
export const REGIMES = {
  taxRegimeChoices: [
    { regimeKey: 'NEW', name: 'New regime', active: true },
    { regimeKey: 'OLD', name: 'Old regime', active: false },
  ],
};
