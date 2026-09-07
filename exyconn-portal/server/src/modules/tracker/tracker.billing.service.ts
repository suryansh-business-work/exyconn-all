import { isValidObjectId } from 'mongoose';
import { DEFAULT_CURRENCY } from '../../constants/pay';
import { ProjectModel } from '../projects/projects.model';
import { TrackerIntervalModel, TrackerManualEntryModel, TrackerSessionModel } from './models';
import { employeeRates, priceTime, round } from './tracker.billing.pricing';
import { trackerManualService } from './tracker.manual.service';

/** One employee's priced time on one project. */
export interface ProjectBillingEmployee {
  employeeId: string;
  employeeName: string;
  hours: number;
  /** Per hour, from HR. Zero means nobody priced the work, not that it was free. */
  rate: number;
  amount: number;
}

/** A project's priced time over a range, and what was agreed for it. */
export interface ProjectBillingRow {
  projectId: string;
  projectName: string;
  clientId: string | null;
  clientName: string;
  currency: string;
  employees: ProjectBillingEmployee[];
  hours: number;
  amount: number;
  budgetHours: number | null;
  budgetAmount: number | null;
}

/** Billable milliseconds per employee, gathered under the project they were booked to. */
interface ProjectGroup {
  projectId: string;
  projectName: string;
  byUser: Map<string, number>;
}

/** Label for time booked before every session carried a project. */
const NO_PROJECT = 'No project';

/**
 * Billing for tracked time.
 *
 * The rate is NOT the tracker's to hold: it comes from the employee's salary structure in
 * HR, the same record payroll reads. That is the whole point — one employee database, one
 * place a rate is agreed, and a billing report that cannot quietly disagree with payroll
 * about what somebody costs.
 *
 * Active milliseconds only, matching the desktop app's own progress bar: idle time is time
 * at a desk, and billing a customer for it would be indefensible.
 *
 * APPROVED off-computer time is billed alongside it. A client meeting is work the customer
 * owes for, and leaving it out was the reason people kept a spreadsheet next to the tracker.
 * Only approved entries count — a pending claim is nobody's invoice yet.
 */
class TrackerBillingService {
  /**
   * Per-employee hours and amounts over a date range.
   *
   * Intervals rather than sessions, because a session's roll-up is derived from exactly the
   * same rows and an interval is what the range actually clips against. Employees with no
   * tracked time in the range are left out — a report full of zero rows hides the work.
   */
  async billing(from: Date, to: Date) {
    const [tracked, manualByUser] = await Promise.all([
      TrackerIntervalModel.aggregate<{ _id: string; activeMs: number }>([
        { $match: { startedAt: { $gte: from, $lt: to } } },
        { $group: { _id: '$userId', activeMs: { $sum: '$activeMs' } } },
      ]),
      trackerManualService.approvedByUser(from, to),
    ]);

    // An employee who spent the whole range in meetings has approved time and no intervals,
    // so the billable set is the union of both — not the tracked rows with manual added on.
    const billableMs = new Map(tracked.map((row) => [row._id, row.activeMs]));
    for (const [userId, manualMs] of manualByUser) {
      billableMs.set(userId, (billableMs.get(userId) ?? 0) + manualMs);
    }
    const worked = [...billableMs.entries()]
      .map(([id, activeMs]) => ({ _id: id, activeMs, manualMs: manualByUser.get(id) ?? 0 }))
      .sort((a, b) => b.activeMs - a.activeMs);

    if (worked.length === 0) {
      return { from, to, rows: [], totalHours: 0, totalAmount: 0, currency: DEFAULT_CURRENCY };
    }

    const rates = await employeeRates(worked.map((row) => row._id));

    const rows = worked.map((entry) => {
      const employee = rates.get(entry._id);
      const billingRate = employee?.billingRate ?? 0;
      return {
        id: entry._id,
        name: employee?.name ?? '',
        email: employee?.email ?? '',
        payType: employee?.payType ?? '',
        currency: employee?.currency ?? DEFAULT_CURRENCY,
        billingRate,
        // `activeMs` here is billable time: measured active time plus approved off-computer
        // time. `manualMs` says how much of it was claimed rather than measured.
        activeMs: entry.activeMs,
        manualMs: entry.manualMs,
        ...priceTime(entry.activeMs, billingRate),
      };
    });

    return {
      from,
      to,
      rows,
      totalHours: round(rows.reduce((sum, row) => sum + row.hours, 0)),
      totalAmount: round(rows.reduce((sum, row) => sum + row.amount, 0)),
      // The house currency, taken from the rows rather than assumed. Mixed currencies are a
      // workspace's own problem; the total is only meaningful when they agree.
      currency: rows[0]?.currency ?? DEFAULT_CURRENCY,
    };
  }

  /**
   * The same billable time, grouped by the project it was booked to and then by employee.
   *
   * Intervals carry the time and sessions carry the project, so the range clips intervals
   * (as the per-employee report does) and each session's total is filed under its project.
   * Approved off-computer time carries its own project. Pass `projectId` for one project.
   */
  async billingByProject(
    from: Date,
    to: Date,
    projectId?: string | null,
  ): Promise<ProjectBillingRow[]> {
    const tracked = await TrackerIntervalModel.aggregate<{ _id: string; activeMs: number }>([
      { $match: { startedAt: { $gte: from, $lt: to } } },
      { $group: { _id: '$sessionId', activeMs: { $sum: '$activeMs' } } },
    ]);
    const msOfSession = new Map(tracked.map((row) => [row._id, row.activeMs]));

    const sessionFilter: Record<string, unknown> = {
      _id: { $in: [...msOfSession.keys()].filter((id) => isValidObjectId(id)) },
    };
    const manualFilter: Record<string, unknown> = {
      status: 'APPROVED',
      startedAt: { $gte: from, $lt: to },
    };
    if (projectId) {
      sessionFilter.projectId = projectId;
      manualFilter.projectId = projectId;
    }
    const [sessions, manual] = await Promise.all([
      TrackerSessionModel.find(sessionFilter).select('userId projectId projectName').lean(),
      TrackerManualEntryModel.find(manualFilter)
        .select('userId projectId projectName durationMs')
        .lean(),
    ]);

    const groups = new Map<string, ProjectGroup>();
    const book = (project: string, projectName: string, userId: string, ms: number) => {
      if (ms <= 0) {
        return;
      }
      const group = groups.get(project) ?? { projectId: project, projectName, byUser: new Map() };
      group.byUser.set(userId, (group.byUser.get(userId) ?? 0) + ms);
      groups.set(project, group);
    };
    for (const session of sessions) {
      const ms = msOfSession.get(String(session._id)) ?? 0;
      book(session.projectId ?? '', session.projectName ?? '', session.userId, ms);
    }
    for (const entry of manual) {
      book(entry.projectId ?? '', entry.projectName ?? '', entry.userId, entry.durationMs);
    }
    if (groups.size === 0) {
      return [];
    }

    const userIds = [...new Set([...groups.values()].flatMap((g) => [...g.byUser.keys()]))];
    const projectIds = [...groups.keys()].filter((id) => isValidObjectId(id));
    const [rates, projects] = await Promise.all([
      employeeRates(userIds),
      ProjectModel.find({ _id: { $in: projectIds } })
        .select('name clientId clientName budgetAmount budgetHours')
        .lean(),
    ]);
    const projectOf = new Map(projects.map((project) => [String(project._id), project]));

    return [...groups.values()]
      .map((group) => {
        const project = projectOf.get(group.projectId);
        const employees = [...group.byUser.entries()]
          .map(([employeeId, ms]) => {
            const employee = rates.get(employeeId);
            const rate = employee?.billingRate ?? 0;
            const priced = priceTime(ms, rate);
            return {
              employeeId,
              employeeName: employee?.name ?? '',
              hours: priced.hours,
              rate,
              amount: priced.amount,
            };
          })
          .sort((a, b) => b.hours - a.hours);
        return {
          projectId: group.projectId,
          // The live name when the project still exists; the name the session recorded when
          // it does not — and a plain label for time booked before projects existed.
          projectName: project?.name ?? (group.projectName || NO_PROJECT),
          clientId: project?.clientId ?? null,
          clientName: project?.clientName ?? '',
          currency: rates.get(employees[0]?.employeeId ?? '')?.currency ?? DEFAULT_CURRENCY,
          employees,
          hours: round(employees.reduce((sum, row) => sum + row.hours, 0)),
          amount: round(employees.reduce((sum, row) => sum + row.amount, 0)),
          budgetHours: project?.budgetHours ?? null,
          budgetAmount: project?.budgetAmount ?? null,
        };
      })
      .sort((a, b) => b.amount - a.amount || b.hours - a.hours);
  }
}

export const trackerBillingService = new TrackerBillingService();
