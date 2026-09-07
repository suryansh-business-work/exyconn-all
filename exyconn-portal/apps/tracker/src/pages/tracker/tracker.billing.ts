import type {
  TrackerBillingByProjectQuery,
  TrackerBillingQuery,
} from '@exyconn/shell/graphql/generated';
import type { CsvColumn } from '@exyconn/shell/utils/csv';

/** The date range the billing report opens on: the current calendar month. */
export function monthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * A picker's value as a usable Date, or null.
 *
 * MUIX hands back whatever is in the field, including a half-typed date that parses to
 * Invalid Date. Sending that as a range bound asks the portal to aggregate over NaN.
 */
export function toDateOrNull(value: Date | null): Date | null {
  if (value === null || Number.isNaN(value.getTime())) {
    return null;
  }
  return value;
}

/** A money formatter for the currency the report came back in. */
export function moneyFormat(currency: string | undefined): Intl.NumberFormat {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 2,
  });
}

/** The per-employee table as CSV columns — the same cells the table shows. */
export const EMPLOYEE_BILLING_CSV: CsvColumn<
  TrackerBillingQuery['trackerBilling']['rows'][number]
>[] = [
  { header: 'Employee', value: (row) => row.name },
  { header: 'Email', value: (row) => row.email },
  { header: 'Pay type', value: (row) => row.payType },
  { header: 'Hours', value: (row) => row.hours },
  { header: 'Rate / hour', value: (row) => (row.rated ? row.billingRate : '') },
  { header: 'Amount', value: (row) => row.amount },
  { header: 'Currency', value: (row) => row.currency },
];

export type ProjectBillingRow = TrackerBillingByProjectQuery['trackerBillingByProject'][number];

/** One CSV line per employee per project, so the file carries the whole breakdown. */
export interface ProjectBillingLine {
  id: string;
  projectName: string;
  clientName: string;
  employeeName: string;
  hours: number;
  rate: number;
  amount: number;
  currency: string;
  budgetHours: number | null;
  budgetAmount: number | null;
}

export function projectBillingLines(rows: readonly ProjectBillingRow[]): ProjectBillingLine[] {
  return rows.flatMap((row) =>
    row.employees.map((employee) => ({
      id: `${row.projectId}:${employee.employeeId}`,
      projectName: row.projectName,
      clientName: row.clientName,
      employeeName: employee.employeeName,
      hours: employee.hours,
      rate: employee.rate,
      amount: employee.amount,
      currency: row.currency,
      budgetHours: row.budgetHours ?? null,
      budgetAmount: row.budgetAmount ?? null,
    })),
  );
}

export const PROJECT_BILLING_CSV: CsvColumn<ProjectBillingLine>[] = [
  { header: 'Project', value: (line) => line.projectName },
  { header: 'Client', value: (line) => line.clientName },
  { header: 'Employee', value: (line) => line.employeeName },
  { header: 'Hours', value: (line) => line.hours },
  { header: 'Rate / hour', value: (line) => (line.rate > 0 ? line.rate : '') },
  { header: 'Amount', value: (line) => line.amount },
  { header: 'Currency', value: (line) => line.currency },
  { header: 'Budget hours', value: (line) => line.budgetHours },
  { header: 'Budget amount', value: (line) => line.budgetAmount },
];
