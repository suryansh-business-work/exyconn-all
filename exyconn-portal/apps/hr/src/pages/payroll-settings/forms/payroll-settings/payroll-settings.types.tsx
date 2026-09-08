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
}
