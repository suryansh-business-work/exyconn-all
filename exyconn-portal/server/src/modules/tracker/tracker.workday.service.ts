import { AttendanceModel } from '../hr/attendance.model';
import { PolicyModel } from '../legal/policy.model';
import { PolicyAcknowledgementModel } from '../legal/policy-acknowledgement.model';
import { ProjectModel } from '../projects/projects.model';
import { DEFAULT_WORK_HOURS_PER_DAY, workTargetMs } from '../../constants/work';
import { GLOBAL_PROJECT, TRACKER_WORKDAY } from './tracker.constants';
import { zonedDateKey, zonedDayStartUtc } from './tracker.timezone';
import { TrackerIntervalModel } from './models';

/** The employee fields the workday reads. A lean User document satisfies this. */
export interface WorkProfileSource {
  workingTime?: string | null;
  workingTimeNote?: string | null;
  workLocation?: string | null;
  workHoursPerDay?: number | null;
  workLocationNote?: string | null;
}

/**
 * The employee's contracted arrangement, with the house defaults filled in.
 *
 * Defaults are applied on READ rather than backfilled: `.lean()` skips Mongoose defaults, so
 * an account created before these fields existed comes back without them, and the tracker's
 * non-nullable work profile would fail to serialize.
 */
export function workProfile(user: WorkProfileSource) {
  const workHoursPerDay = user.workHoursPerDay ?? DEFAULT_WORK_HOURS_PER_DAY;
  return {
    workingTime: user.workingTime ?? 'FLEXIBLE',
    workingTimeNote: user.workingTimeNote ?? '',
    workLocation: user.workLocation ?? 'OFFICE',
    workLocationNote: user.workLocationNote ?? '',
    workHoursPerDay,
    targetMs: workTargetMs(workHoursPerDay),
  };
}

/**
 * The employee's day as the desktop app needs it: what they are contracted to work, how much
 * of it they have actually worked, and whether they have marked themselves in.
 *
 * Every read is scoped by the userId the device token authenticated as — nothing here takes
 * an employee id from a caller.
 */
class TrackerWorkdayService {
  /** The employee's contracted arrangement, with the house defaults filled in. */
  workProfileOf(user: WorkProfileSource) {
    return workProfile(user);
  }

  /**
   * Active milliseconds recorded for the employee's CURRENT local day.
   *
   * Bucketed by Mongo's `$dateToString` in the employee's own zone, exactly as the calendar
   * report is, so the progress bar and the report can never disagree about which day an
   * interval belongs to — including across a DST change, which no client-side arithmetic
   * here would get right. The match window is a fixed look-back rather than the day's UTC
   * bounds: it keeps the query on the `startedAt` index without computing zone offsets.
   */
  async activeMsOn(userId: string, timezone: string, dateKey: string): Promise<number> {
    const since = new Date(Date.now() - TRACKER_WORKDAY.lookbackMs);
    const buckets = await TrackerIntervalModel.aggregate<{ date: string; activeMs: number }>([
      { $match: { userId, startedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt', timezone } },
          activeMs: { $sum: '$activeMs' },
        },
      },
      { $project: { _id: 0, date: '$_id', activeMs: 1 } },
    ]);
    return buckets.find((bucket) => bucket.date === dateKey)?.activeMs ?? 0;
  }

  /** The employee's attendance record for their current local day, if they marked one. */
  attendanceOn(userId: string, date: Date) {
    return AttendanceModel.findOne({ employeeId: userId, date }).lean();
  }

  /**
   * Marks the employee present (or WFH, etc.) for their current local day.
   *
   * Upserts on the same `{ employeeId, date }` key HR's own self-service mutation uses, so
   * marking in from the desktop app and marking in from the employee portal are the same
   * record — one day cannot be attended twice.
   */
  markAttendance(userId: string, date: Date, status: string, note?: string | null) {
    return AttendanceModel.findOneAndUpdate(
      { employeeId: userId, date },
      { employeeId: userId, date, status, note: note ?? null },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
  }

  /** Target, progress and attendance for the employee's current local day, in one object. */
  async workday(userId: string, user: WorkProfileSource, timezone: string) {
    const now = new Date();
    const dateKey = zonedDateKey(now, timezone);
    const [activeMs, attendance] = await Promise.all([
      this.activeMsOn(userId, timezone, dateKey),
      this.attendanceOn(userId, zonedDayStartUtc(now, timezone)),
    ]);

    return {
      date: dateKey,
      targetMs: workProfile(user).targetMs,
      activeMs,
      attendanceStatus: attendance?.status ?? null,
      attendanceNote: attendance?.note ?? null,
      attendanceMarked: attendance !== null,
    };
  }

  /**
   * The projects the employee may book time against, the house-wide one first.
   *
   * "Global Project" is created on demand rather than seeded: an install that never opened
   * the Projects module still has to give the tracker somewhere to put time, and time booked
   * against a project that does not exist is time nobody can report on.
   */
  async projects() {
    const global = await this.globalProject();

    const others = await ProjectModel.find({
      key: { $ne: GLOBAL_PROJECT.key },
      status: { $in: TRACKER_WORKDAY.bookableProjectStatuses },
    })
      .sort({ name: 1 })
      .lean();

    return [global, ...others].map((project) => ({
      id: String(project._id),
      name: project.name,
      key: project.key,
    }));
  }

  /**
   * The house-wide project, created on first use.
   *
   * A read first, and a write only when the read misses. Every desktop heartbeat asks for
   * the project list — once a minute, per employee — and an unconditional upsert would make
   * that a write per employee per minute for a row that changes about once in the life of
   * the workspace.
   */
  private async globalProject() {
    const existing = await ProjectModel.findOne({ key: GLOBAL_PROJECT.key }).lean();
    if (existing) {
      return existing;
    }
    return ProjectModel.findOneAndUpdate(
      { key: GLOBAL_PROJECT.key },
      {
        $setOnInsert: {
          name: GLOBAL_PROJECT.name,
          key: GLOBAL_PROJECT.key,
          description: GLOBAL_PROJECT.description,
          status: 'ACTIVE',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
  }

  /**
   * The project a session may book its time against.
   *
   * An unknown, finished or missing id resolves to the house-wide project rather than
   * failing the start: refusing to track because a project was archived would cost the
   * employee the time, and unattributed time is a smaller problem than lost time.
   */
  async bookableProject(projectId?: string | null) {
    const bookable = await this.projects();
    return bookable.find((project) => project.id === projectId) ?? bookable[0];
  }

  /**
   * The Legal policy the workspace uses as its tracking disclosure, with THIS employee's
   * signature state on the version now published.
   *
   * Reading the disclosure out of Legal rather than out of a text box on the tracker's own
   * settings is what makes one acceptance count everywhere: the signature lands in the same
   * versioned ledger HR and Legal read, and re-publishing changed wording asks everybody
   * again instead of silently carrying an old agreement forward.
   */
  async consentPolicy(userId: string, slug: string) {
    if (slug.trim() === '') {
      return null;
    }
    const policy = await PolicyModel.findOne({ slug, status: 'PUBLISHED' }).lean();
    if (!policy) {
      return null;
    }
    const signature = await PolicyAcknowledgementModel.findOne({
      policyId: String(policy._id),
      userId,
      version: policy.version,
    }).lean();

    return {
      id: String(policy._id),
      title: policy.title,
      slug: policy.slug,
      summary: policy.summary,
      body: policy.body,
      version: policy.version,
      requiresAcknowledgement: policy.requiresAcknowledgement,
      acknowledged: signature !== null,
      acknowledgedAt: signature?.signedAt ?? null,
    };
  }
}

export const trackerWorkdayService = new TrackerWorkdayService();
