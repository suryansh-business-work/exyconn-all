import type { PayrollSettingsQuery, TdsMode } from '@exyconn/shell/graphql/generated';

/** The stored statutory policy, exactly as the query returns it. */
export type PayrollSettingsRow = PayrollSettingsQuery['payrollSettings'];

/** Form values for the company-wide statutory deduction policy. */
export interface PayrollSettingsFormValues {
  pfEnabled: boolean;
  pfEmployeePercent: number;
  pfWageCeiling: number;
  esiEnabled: boolean;
  esiEmployeePercent: number;
  esiWageLimit: number;
  professionalTaxMonthly: number;
  tdsMode: TdsMode;
  tdsFlatPercent: number;
  /** Which regime in the tax-slab table SLAB mode applies. */
  tdsRegimeKey: string;
  /** The month a financial year opens in, 1-12. */
  financialYearStartMonth: number;
  /** The day of a month (1-28) from which that month's payroll may be run. */
  runFromDay: number;
}
