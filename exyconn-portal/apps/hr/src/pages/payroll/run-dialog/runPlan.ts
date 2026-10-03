import { PayrollCandidateStatus, type PayrollRunPlanQuery } from '@exyconn/shell/graphql/generated';
import type { Interpolations } from '@exyconn/i18n';

/** The month's run plan, exactly as the server returns it. */
export type RunPlan = PayrollRunPlanQuery['payrollRunPlan'];

/** One active employee in the plan. */
export type Candidate = RunPlan['employees'][number];

/** Whether the run can issue this employee a slip. */
export const isReady = (candidate: Candidate) => candidate.status === PayrollCandidateStatus.Ready;

/** What the picked employees add up to. */
export interface SelectionTotals {
  count: number;
  gross: number;
  deductions: number;
  net: number;
}

/** Adds up the gross, deductions and net of the picked employees. */
export function totalsOf(picked: readonly Candidate[]): SelectionTotals {
  return picked.reduce<SelectionTotals>(
    (sum, c) => ({
      count: sum.count + 1,
      gross: sum.gross + (c.gross ?? 0),
      deductions: sum.deductions + (c.deductions ?? 0),
      net: sum.net + (c.net ?? 0),
    }),
    { count: 0, gross: 0, deductions: 0, net: 0 },
  );
}

/** A sentence to translate, with the values its `{placeholders}` take. */
export interface Caption {
  message: string;
  values?: Interpolations;
}

/**
 * Why the month cannot be run right now, or null when it can. The period and the opening
 * date come formatted from the caller, which holds the language and the date settings.
 */
export function runBlocker(plan: RunPlan, period: string, opensOn: string): Caption | null {
  if (!plan.open) {
    return { message: 'Payroll for {period} opens on {date}', values: { period, date: opensOn } };
  }
  if (plan.readyCount > 0) {
    return null;
  }
  if (plan.alreadyRunCount > 0) {
    return { message: 'Payroll has already been run for every employee this month' };
  }
  return { message: 'No employee has a salary structure yet — add one under Salaries' };
}
