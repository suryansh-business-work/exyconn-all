import type { LeaveBalanceRow } from '@/pages/UserDetails/forms/leave-balance';

/** One employee's balance for one leave type; override what a test needs. */
export function makeBalance(patch: Partial<LeaveBalanceRow> = {}): LeaveBalanceRow {
  return {
    id: 'bal-1',
    employeeId: 'emp-1',
    leaveTypeCode: 'CL',
    year: 2026,
    allocated: 12,
    carriedForward: 2,
    used: 3,
    adjustment: 0,
    available: 11,
    ...patch,
  };
}

/** A leave type HR offers, as the policies list returns it. */
export function makePolicy(code: string, name: string) {
  return {
    id: `pol-${code}`,
    code,
    name,
    annualQuota: 12,
    paid: true,
    halfDayAllowed: true,
    carryForwardCap: 5,
    active: true,
    overrides: [],
  };
}
