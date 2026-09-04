import { UserModel } from '../admin/user.model';
import { SalaryStructureModel } from '../employee/salary.model';
import { DEFAULT_CURRENCY, DEFAULT_PAY_TYPE } from '../../constants/pay';
import { TrackerIntervalModel } from './models';
import { trackerManualService } from './tracker.manual.service';

const MS_PER_HOUR = 3_600_000;

/** Money is rounded to two places once, at the end — never accumulated pre-rounded. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Hours, to two places, from the milliseconds every tracker total is kept in. */
function hoursOf(activeMs: number): number {
  return round(activeMs / MS_PER_HOUR);
}

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

    const userIds = worked.map((row) => row._id);
    const [users, structures] = await Promise.all([
      UserModel.find({ _id: { $in: userIds } })
        .select('name email')
        .lean(),
      SalaryStructureModel.find({ employeeId: { $in: userIds } }).lean(),
    ]);

    const byUser = new Map(users.map((user) => [String(user._id), user]));
    const byEmployee = new Map(structures.map((structure) => [structure.employeeId, structure]));

    const rows = worked.map((entry) => {
      const user = byUser.get(entry._id);
      const structure = byEmployee.get(entry._id);
      const billingRate = structure?.billingRate ?? 0;
      const hours = hoursOf(entry.activeMs);
      return {
        id: entry._id,
        // An account deleted since the time was tracked still has hours on the books, and a
        // report that silently dropped them would understate the total.
        name: user?.name ?? 'Deleted employee',
        email: user?.email ?? '',
        payType: structure?.payType ?? DEFAULT_PAY_TYPE,
        currency: structure?.currency ?? DEFAULT_CURRENCY,
        billingRate,
        // `activeMs` here is billable time: measured active time plus approved off-computer
        // time. `manualMs` says how much of it was claimed rather than measured.
        activeMs: entry.activeMs,
        manualMs: entry.manualMs,
        hours,
        amount: round(hours * billingRate),
        // Says out loud why an amount is zero, so nobody reads a missing rate as free work.
        rated: billingRate > 0,
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
}

export const trackerBillingService = new TrackerBillingService();
