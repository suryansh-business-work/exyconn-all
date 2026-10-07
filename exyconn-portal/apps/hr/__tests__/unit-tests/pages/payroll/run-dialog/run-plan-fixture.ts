import { PayrollCandidateStatus, SlipStatus } from '@exyconn/shell/graphql/generated';
import type { Candidate, RunPlan } from '../../../../../src/pages/payroll/run-dialog/runPlan';

interface Figures {
  gross: number;
  deductions: number;
  net: number;
}

/** One active employee in a month's run plan; only a READY one has figures worked out. */
export function candidate(
  employeeId: string,
  name: string,
  status: PayrollCandidateStatus,
  figures: Figures | null = null,
): Candidate {
  return {
    employeeId,
    name,
    department: 'Engineering',
    designation: 'Engineer',
    status,
    slipStatus: status === PayrollCandidateStatus.AlreadyRun ? SlipStatus.Generated : null,
    gross: figures?.gross ?? null,
    deductions: figures?.deductions ?? null,
    net: figures?.net ?? null,
    currency: figures ? 'INR' : null,
  };
}

const { Ready, AlreadyRun, NoStructure } = PayrollCandidateStatus;

/** Two employees ready, one already run, one with no salary structure. */
export const EMPLOYEES: Candidate[] = [
  candidate('e1', 'Asha', Ready, { gross: 50000, deductions: 2500, net: 47500 }),
  candidate('e2', 'Bala', AlreadyRun),
  candidate('e3', 'Chitra', Ready, { gross: 30000, deductions: 1000, net: 29000 }),
  candidate('e4', 'Dev', NoStructure),
];

/** October 2026's plan for `employees`, its counts worked out from them. */
export function planOf(employees: Candidate[] = EMPLOYEES, over: Partial<RunPlan> = {}): RunPlan {
  const count = (status: PayrollCandidateStatus) =>
    employees.filter((c) => c.status === status).length;
  return {
    month: 10,
    year: 2026,
    opensOn: '2026-10-25T06:00:00.000Z',
    open: true,
    readyCount: count(Ready),
    alreadyRunCount: count(AlreadyRun),
    noStructureCount: count(NoStructure),
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    employees,
    ...over,
  };
}
