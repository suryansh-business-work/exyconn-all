import { UserModel } from '../admin/user.model';
import { badRequest, notFound } from '../../utils/errors';
import { TrackerManualEntryModel, type TrackerManualEntryDocument } from './models';
import { TRACKER_MANUAL_LIMITS, type ManualEntryStatus } from './tracker.constants';

/** What an employee submits when claiming work done away from the computer. */
export interface ManualEntryInput {
  startedAt: Date;
  endedAt: Date;
  note: string;
}

/**
 * The project a claim books against, already resolved.
 *
 * Passed in rather than looked up here: the workday service owns project resolution and
 * itself reads approved manual time for the day, so resolving it in this service would put
 * the two in an import cycle. The caller resolves once and hands the answer over.
 */
export interface BookedProject {
  id: string;
  name: string;
}

/** A manual entry as `.lean()` returns it. */
type ManualEntryLean = TrackerManualEntryDocument & { _id: unknown };

/** Per-day approved off-computer time, keyed by the employee's own local date. */
export interface ManualDayBucket {
  date: string;
  manualMs: number;
}

/**
 * Rejects a window nobody could have worked.
 *
 * Validated here rather than in the schema because the useful message is about the window
 * as a whole ("ends before it starts", "is in the future"), and an employee filling in a
 * timesheet deserves to be told which of those they did.
 */
function assertUsableWindow(startedAt: Date, endedAt: Date): number {
  const durationMs = endedAt.getTime() - startedAt.getTime();
  if (durationMs <= 0) {
    badRequest('The entry must end after it starts.');
  }
  if (durationMs < TRACKER_MANUAL_LIMITS.minDurationMs) {
    badRequest('An entry must cover at least a minute.');
  }
  if (durationMs > TRACKER_MANUAL_LIMITS.maxDurationMs) {
    badRequest('One entry cannot cover more than 16 hours. Split it across days.');
  }

  const now = Date.now();
  if (endedAt.getTime() > now) {
    badRequest('Off-computer time cannot be claimed before it has been worked.');
  }
  if (now - startedAt.getTime() > TRACKER_MANUAL_LIMITS.maxBackdateMs) {
    badRequest('Entries can only be claimed within 90 days of the work.');
  }
  return durationMs;
}

/**
 * Off-computer time: claiming it, reviewing it, and reading back only what was approved.
 *
 * Every read here is scoped by a userId the caller already proved they are allowed to see —
 * this service never takes an employee id straight from a client.
 */
class TrackerManualService {
  /**
   * Files a claim, always PENDING.
   *
   * `project` comes from the same `bookableProject` the desktop app uses to open a session,
   * so off-computer time lands on the projects tracked time does and an archived project
   * cannot leave a claim unattributable.
   */
  async create(userId: string, input: ManualEntryInput, project: BookedProject | undefined) {
    const durationMs = assertUsableWindow(input.startedAt, input.endedAt);
    const note = input.note.trim();
    if (note === '') {
      badRequest('Say what the time was for.');
    }

    const entry = await TrackerManualEntryModel.create({
      userId,
      projectId: project?.id ?? '',
      projectName: project?.name ?? '',
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      durationMs,
      note,
      status: 'PENDING',
    });
    return entry.toObject();
  }

  /**
   * Approves or rejects a claim.
   *
   * A decision is final: an already-reviewed entry is refused rather than flipped, so an
   * approved hour cannot silently leave a timesheet somebody has already been paid against.
   * Re-deciding is a new entry, which leaves both records visible.
   */
  async review(id: string, status: ManualEntryStatus, reviewedBy: string, reviewNote?: string) {
    if (status === 'PENDING') {
      badRequest('A review must approve or reject the entry.');
    }
    const entry = await TrackerManualEntryModel.findById(id);
    if (!entry) {
      notFound('Time entry');
    }
    if (entry.status !== 'PENDING') {
      badRequest(`This entry was already ${entry.status.toLowerCase()}.`);
    }

    entry.status = status;
    entry.reviewedBy = reviewedBy;
    entry.reviewedAt = new Date();
    entry.reviewNote = reviewNote?.trim() ?? '';
    await entry.save();
    return entry.toObject();
  }

  /**
   * Withdraws a claim the employee filed themselves.
   *
   * Only their own, and only while it is still pending — withdrawing an approved entry
   * would remove hours a manager has already signed off.
   */
  async withdraw(id: string, userId: string) {
    const entry = await TrackerManualEntryModel.findOne({ _id: id, userId }).lean();
    if (!entry) {
      notFound('Time entry');
    }
    if (entry.status !== 'PENDING') {
      badRequest('Only a pending entry can be withdrawn.');
    }
    await TrackerManualEntryModel.deleteOne({ _id: id });
    return true;
  }

  /** One employee's entries in a range, newest first, whatever their status. */
  list(userId: string, from: Date, to: Date): Promise<ManualEntryLean[]> {
    return TrackerManualEntryModel.find({ userId, startedAt: { $gte: from, $lt: to } })
      .sort({ startedAt: -1 })
      .lean();
  }

  /** Everything waiting on a reviewer, oldest first — the queue is worked front to back. */
  listPending(): Promise<ManualEntryLean[]> {
    return TrackerManualEntryModel.find({ status: 'PENDING' }).sort({ startedAt: 1 }).lean();
  }

  /**
   * Approved off-computer milliseconds per local day for one employee.
   *
   * Bucketed with `$dateToString` in the employee's own zone for exactly the reason the
   * interval calendar is: an entry starting at 00:30 local belongs to that local day, and
   * client-side arithmetic would put it on the previous one across a DST change.
   */
  approvedByDay(
    userId: string,
    from: Date,
    to: Date,
    timezone: string,
  ): Promise<ManualDayBucket[]> {
    return TrackerManualEntryModel.aggregate<ManualDayBucket>([
      { $match: { userId, status: 'APPROVED', startedAt: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt', timezone } },
          manualMs: { $sum: '$durationMs' },
        },
      },
      { $project: { _id: 0, date: '$_id', manualMs: 1 } },
      { $sort: { date: 1 } },
    ]);
  }

  /** Approved milliseconds for every employee in a range, keyed by user id (for billing). */
  async approvedByUser(from: Date, to: Date): Promise<Map<string, number>> {
    const rows = await TrackerManualEntryModel.aggregate<{ _id: string; manualMs: number }>([
      { $match: { status: 'APPROVED', startedAt: { $gte: from, $lt: to } } },
      { $group: { _id: '$userId', manualMs: { $sum: '$durationMs' } } },
    ]);
    return new Map(rows.map((row) => [row._id, row.manualMs]));
  }

  /**
   * Attaches each entry's employee name, in one query for the whole list.
   *
   * The review queue spans everybody, and a reviewer cannot act on a user id. An account
   * deleted since the claim was filed still shows its entry — dropping it would quietly
   * remove hours from a queue somebody is accountable for clearing.
   */
  async withNames(entries: ManualEntryLean[]) {
    if (entries.length === 0) {
      return [];
    }
    const userIds = [...new Set(entries.map((entry) => entry.userId))];
    const users = await UserModel.find({ _id: { $in: userIds } })
      .select('name')
      .lean();
    const nameOf = new Map(users.map((user) => [String(user._id), user.name]));
    return entries.map((entry) => ({
      ...entry,
      userName: nameOf.get(entry.userId) ?? 'Deleted employee',
    }));
  }

  /** All-time approved off-computer milliseconds for one employee. */
  async approvedTotal(userId: string): Promise<number> {
    const [summed] = await TrackerManualEntryModel.aggregate<{ manualMs: number }>([
      { $match: { userId, status: 'APPROVED' } },
      { $group: { _id: null, manualMs: { $sum: '$durationMs' } } },
    ]);
    return summed?.manualMs ?? 0;
  }
}

export const trackerManualService = new TrackerManualService();
