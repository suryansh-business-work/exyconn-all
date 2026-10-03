import { Types } from 'mongoose';
import { SalaryStructureModel } from '../employee/salary.model';
import { SalarySlipModel } from '../employee/salarySlip.model';
import { UserModel } from '../admin/user.model';
import { notify } from '../notifications';
import { ensurePayslipDocument } from '../documents';
import { companyProfile } from '../../lib/company';
import { badRequest } from '../../utils/errors';
import { payableMonthsInFinancialYear } from './payroll.compute';
import { DEFAULT_RUN_FROM_DAY, readPayrollSettings } from './payroll-settings.model';
import {
  payslipTitle,
  slipFields,
  slipFor,
  startMonthOf,
  slabTaxFor,
  taxTablesFor,
  type SlipFigures,
} from './payroll.slip';
import { payrollWindow, windowClosedMessage, type PayrollWindow } from './payroll.window';

/**
 * A payroll run, planned and carried out.
 *
 * HR first sees the plan — every active employee and whether the month can be run for them —
 * then runs it for the ones they pick. A month run for an employee is never run again for
 * them: the slip it produced is what they were told they would be paid.
 */

export type CandidateStatus = 'READY' | 'ALREADY_RUN' | 'NO_STRUCTURE';

/** One active employee as the plan shows them. Amounts are only worked out for READY. */
export interface PayrollCandidate {
  employeeId: string;
  name: string;
  department: string | null;
  designation: string | null;
  status: CandidateStatus;
  slipStatus: string | null;
  gross: number | null;
  deductions: number | null;
  net: number | null;
  currency: string | null;
  /** The full slip a run would store; kept off the GraphQL type. */
  figures: SlipFigures | null;
}

/** A candidate the run can issue a slip to, with the figures it will store. */
type ReadyCandidate = PayrollCandidate & { figures: SlipFigures; currency: string };

const isReady = (candidate: PayrollCandidate): candidate is ReadyCandidate =>
  candidate.status === 'READY';

export interface PayrollRunPlan extends PayrollWindow {
  month: number;
  year: number;
  employees: PayrollCandidate[];
  readyCount: number;
  alreadyRunCount: number;
  noStructureCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
}

const sum = (rows: PayrollCandidate[], pick: (row: PayrollCandidate) => number | null) =>
  rows.reduce((total, row) => total + (pick(row) ?? 0), 0);

const countOf = (rows: PayrollCandidate[], status: CandidateStatus) =>
  rows.filter((row) => row.status === status).length;

/** Whether this month is open for running, by the company's clock and payroll settings. */
async function windowFor(month: number, year: number) {
  const [settings, profile] = await Promise.all([readPayrollSettings(), companyProfile()]);
  const runFromDay = settings.runFromDay ?? DEFAULT_RUN_FROM_DAY;
  return {
    settings,
    runFromDay,
    window: payrollWindow(month, year, runFromDay, profile.timezone, new Date()),
  };
}

/**
 * Every active employee (or only `employeeIds`, when given) with their standing for the
 * month, and the slip a run would store for each READY one. The plan and the run both read
 * this, so what HR is shown is exactly what gets stored.
 */
async function candidatesFor(
  month: number,
  year: number,
  settings: Awaited<ReturnType<typeof readPayrollSettings>>,
  employeeIds?: string[],
): Promise<PayrollCandidate[]> {
  const scope = employeeIds ? { _id: { $in: employeeIds } } : {};
  const users = await UserModel.find({ isActive: true, ...scope })
    .select('_id name department designation joinDate')
    .sort({ name: 1 })
    .lean();
  const ids = users.map((u) => String(u._id));
  const [structures, slips, taxTables] = await Promise.all([
    SalaryStructureModel.find({ employeeId: { $in: ids } }).lean(),
    SalarySlipModel.find({ employeeId: { $in: ids }, month, year })
      .select('employeeId status')
      .lean(),
    taxTablesFor(settings, month, year),
  ]);
  const structureOf = new Map(structures.map((s) => [s.employeeId, s]));
  const slipOf = new Map(slips.map((s) => [s.employeeId, s.status]));
  const startMonth = startMonthOf(settings);

  return Promise.all(
    users.map(async (user): Promise<PayrollCandidate> => {
      const employeeId = String(user._id);
      const base = {
        employeeId,
        name: user.name,
        department: user.department ?? null,
        designation: user.designation ?? null,
      };
      const empty = { gross: null, deductions: null, net: null, currency: null, figures: null };
      const slipStatus = slipOf.get(employeeId);
      if (slipStatus) {
        return { ...base, ...empty, status: 'ALREADY_RUN', slipStatus };
      }
      const structure = structureOf.get(employeeId);
      if (!structure) {
        return { ...base, ...empty, status: 'NO_STRUCTURE', slipStatus: null };
      }
      // Worked out per employee, not per run: a mid-year joiner is taxed on the months they
      // will actually be paid in this financial year, not on a full year they will not earn.
      const payableMonths = payableMonthsInFinancialYear(user.joinDate, year, month, startMonth);
      const figures = await slipFor(
        employeeId,
        structure,
        month,
        year,
        settings,
        slabTaxFor(taxTables, structure.taxRegimeKey, payableMonths),
      );
      return {
        ...base,
        status: 'READY',
        slipStatus: null,
        gross: figures.gross,
        deductions: figures.deductions,
        net: figures.net,
        currency: structure.currency,
        figures,
      };
    }),
  );
}

/** The month's run plan: who it would reach, who it would not and why, and what it costs. */
export async function planPayroll(month: number, year: number): Promise<PayrollRunPlan> {
  const { settings, window } = await windowFor(month, year);
  const employees = await candidatesFor(month, year, settings);
  return {
    month,
    year,
    ...window,
    employees,
    readyCount: countOf(employees, 'READY'),
    alreadyRunCount: countOf(employees, 'ALREADY_RUN'),
    noStructureCount: countOf(employees, 'NO_STRUCTURE'),
    totalGross: sum(employees, (row) => row.gross),
    totalDeductions: sum(employees, (row) => row.deductions),
    totalNet: sum(employees, (row) => row.net),
  };
}

/** Why a picked employee cannot be run, or null when they can. */
function refusalFor(candidate: PayrollCandidate | undefined): string | null {
  if (!candidate) {
    return 'is not an active employee';
  }
  if (candidate.status === 'ALREADY_RUN') {
    return 'already has a salary slip for this month';
  }
  if (candidate.status === 'NO_STRUCTURE') {
    return 'has no salary structure';
  }
  return null;
}

/** Refuses the whole run unless every picked employee can be run; nothing is half-done. */
function assertRunnable(employeeIds: string[], candidates: PayrollCandidate[]) {
  const byId = new Map(candidates.map((c) => [c.employeeId, c]));
  for (const employeeId of employeeIds) {
    const candidate = byId.get(employeeId);
    const refusal = refusalFor(candidate);
    if (refusal) {
      badRequest(`${candidate?.name ?? employeeId} ${refusal}`);
    }
  }
}

/** Stores one READY employee's slip, files it under their documents and tells them. */
async function issueSlip(candidate: ReadyCandidate, month: number, year: number) {
  const { figures } = candidate;
  const issuedDate = new Date();
  const created = await SalarySlipModel.create({
    employeeId: candidate.employeeId,
    month,
    year,
    ...slipFields(figures, candidate.currency),
    status: 'GENERATED',
    issuedDate,
  });
  await notify(candidate.employeeId, {
    kind: 'PAYROLL',
    title: `Salary slip for ${month}/${year} is ready`,
    link: '/me/salary-slips',
  });
  await ensurePayslipDocument(
    candidate.employeeId,
    String(created._id),
    payslipTitle(month, year),
    issuedDate,
  );
  return figures.net;
}

/**
 * Runs the month for exactly the employees picked. Refused outright — before any slip is
 * written — while the month is not open yet, when nobody is picked, or when any one of them
 * cannot be run (inactive, no salary structure, or already run for this month).
 */
export async function runPayrollFor(month: number, year: number, employeeIds: string[]) {
  const { settings, runFromDay, window } = await windowFor(month, year);
  if (!window.open) {
    badRequest(windowClosedMessage(month, year, runFromDay));
  }
  const picked = [...new Set(employeeIds)];
  if (picked.length === 0) {
    badRequest('Choose at least one employee to run payroll for');
  }
  const invalid = picked.find((id) => !Types.ObjectId.isValid(id));
  if (invalid) {
    badRequest(`${invalid} is not an active employee`);
  }
  const candidates = await candidatesFor(month, year, settings, picked);
  assertRunnable(picked, candidates);

  const ready = candidates.filter(isReady);
  let totalNet = 0;
  for (const candidate of ready) {
    totalNet += await issueSlip(candidate, month, year);
  }
  return { month, year, generated: ready.length, totalNet };
}
