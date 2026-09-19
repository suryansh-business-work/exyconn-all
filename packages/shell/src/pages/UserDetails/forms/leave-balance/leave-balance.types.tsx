import type { EmployeeLeaveBalancesQuery } from '@/graphql/generated';

export type LeaveBalanceRow = EmployeeLeaveBalancesQuery['employeeLeaveBalances'][number];

/** The days HR sets on one employee's balance for one leave type and year. */
export interface LeaveBalanceFormValues {
  /** The leave type's code, e.g. CL. Chosen when adding; fixed once the balance exists. */
  leaveTypeCode: string;
  /** Days the leave policy grants for the year. */
  allocated: number;
  /** Unused days brought over from the year before. */
  carriedForward: number;
  /** Days HR adds (positive) or takes away (negative) by hand. */
  adjustment: number;
  /** Days already taken; approvals keep it up to date. */
  used: number;
}
