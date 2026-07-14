import { UserModel } from '../admin/user.model';
import { mailer } from '../../utils/mailer';
import { logger } from '../../utils/logger';
import { notFound } from '../../utils/errors';
import {
  TrackerAccessModel,
  TrackerDeviceModel,
  TrackerIntervalModel,
  TrackerScreenshotModel,
  TrackerSessionModel,
  TrackerWindowUsageModel,
  type TrackerAccessDocument,
  type TrackerScreenshotDocument,
} from './models';

/** Fire-and-forget email — mirrors the admin module's tryEmail helper. */
function tryEmail(action: string, send: () => Promise<void>): void {
  const onError = (error: unknown) => logger.error({ error }, `${action} email failed`);
  try {
    Promise.resolve(send()).catch(onError);
  } catch (error) {
    onError(error);
  }
}

/** A screenshot as it comes back from `.lean()`. */
type ScreenshotLean = TrackerScreenshotDocument & { _id: unknown };

/** An access grant as it comes back from `.lean()`. */
type AccessLean = TrackerAccessDocument & { _id: unknown };

/** Fields an access grant may predate. '' = the employee never picked a timezone. */
const ACCESS_DEFAULTS = Object.freeze({ timezone: '' });

/**
 * Fills in the fields a stored grant predates — today, `timezone`.
 *
 * Same trap as tracker.settings.service's `withDefaults`: Mongoose applies schema defaults
 * only when a document is CREATED and `.lean()` skips them, so a grant written before the
 * field existed comes back without it and the non-nullable `TrackerAccess.timezone` blows
 * up with "Cannot return null". Stored values always win — absent keys are the only thing
 * the spread fills. (A GraphQL field resolver would be the other way to fix this, but
 * `mergeResolvers` in src/graphql/index.ts merges Query/Mutation maps only.)
 */
function withAccessDefaults(access: AccessLean): AccessLean {
  return { ...ACCESS_DEFAULTS, ...access };
}

/** A screenshot belongs to exactly one interval, identified by this pair. */
function intervalKey(sessionId: string, startedAt: Date): string {
  return `${sessionId}|${startedAt.getTime()}`;
}

/**
 * Stamps each screenshot with the activity level of the interval it belongs to.
 *
 * The intervals are fetched in ONE query keyed on the (sessionId, intervalStartedAt) pairs
 * the screenshots actually reference — never one query per screenshot. Keying on the pairs
 * rather than reusing the day's own interval list also keeps the boundary honest: a shot
 * taken at 00:02 belongs to an interval that started before midnight, i.e. outside the day.
 * A screenshot whose interval has not been synced yet (the app uploads shots mid-interval)
 * simply reports 0.
 */
async function withActivityPercent(screenshots: ScreenshotLean[]) {
  if (screenshots.length === 0) {
    return [];
  }

  const sessionIds = [...new Set(screenshots.map((shot) => shot.sessionId))];
  const startedAts = [...new Set(screenshots.map((shot) => shot.intervalStartedAt.getTime()))];

  const intervals = await TrackerIntervalModel.find({
    sessionId: { $in: sessionIds },
    startedAt: { $in: startedAts.map((time) => new Date(time)) },
  })
    .select('sessionId startedAt activityPercent')
    .lean();

  const activity = new Map(
    intervals.map((interval) => [
      intervalKey(interval.sessionId, interval.startedAt),
      interval.activityPercent,
    ]),
  );

  return screenshots.map((shot) => ({
    ...shot,
    activityPercent: activity.get(intervalKey(shot.sessionId, shot.intervalStartedAt)) ?? 0,
  }));
}

/** Portal-side tracker administration & reporting (singleton, TRACKER role). */
class TrackerAdminService {
  /** Grants tracker access to an employee and emails them the "start tracking" note. */
  async grantAccess(userId: string, grantedBy: string) {
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      notFound('User');
    }

    const access = await TrackerAccessModel.findOneAndUpdate(
      { userId },
      {
        userId,
        grantedBy,
        grantedAt: new Date(),
        revokedAt: null,
        revokedBy: '',
        isActive: true,
      },
      { upsert: true, new: true },
    ).lean();

    tryEmail('Tracker access', () =>
      mailer.sendTrackerAccessEmail({ name: user.name, email: user.email }),
    );

    return withAccessDefaults(access);
  }

  async revokeAccess(userId: string, revokedBy: string) {
    const access = await TrackerAccessModel.findOneAndUpdate(
      { userId },
      { isActive: false, revokedAt: new Date(), revokedBy },
      { new: true },
    ).lean();
    if (!access) {
      notFound('Tracker access');
    }
    // Revoking access also cuts off every device the employee signed in on.
    await TrackerDeviceModel.updateMany(
      { userId, isActive: true },
      { isActive: false, revokedAt: new Date() },
    );
    return withAccessDefaults(access);
  }

  /** Revokes a single device — its non-expiring token stops working on the next call. */
  async revokeDevice(deviceId: string) {
    const device = await TrackerDeviceModel.findOneAndUpdate(
      { deviceId },
      { isActive: false, revokedAt: new Date() },
      { new: true },
    ).lean();
    if (!device) {
      notFound('Device');
    }
    return device;
  }

  async listAccess() {
    const grants = await TrackerAccessModel.find().sort({ createdAt: -1 }).lean();
    return grants.map(withAccessDefaults);
  }

  listDevices(userId?: string) {
    const filter = userId ? { userId } : {};
    return TrackerDeviceModel.find(filter).sort({ lastSeenAt: -1 }).lean();
  }

  /**
   * Per-day worked/idle/activity totals for one employee across a date range (calendar).
   * `timezone` (an IANA name) is applied inside `$dateToString` so a session started at
   * 00:30 local isn't bucketed onto the previous UTC day.
   */
  async calendar(userId: string, from: Date, to: Date, timezone: string) {
    return TrackerSessionModel.aggregate([
      { $match: { userId, startedAt: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startedAt', timezone },
          },
          activeMs: { $sum: '$activeMs' },
          idleMs: { $sum: '$idleMs' },
          keyCount: { $sum: '$keyCount' },
          mouseCount: { $sum: '$mouseCount' },
          sessions: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          activeMs: 1,
          idleMs: 1,
          keyCount: 1,
          mouseCount: 1,
          sessions: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
  }

  /**
   * Everything recorded for one employee on one day: intervals, apps, screenshots.
   * The UI computes the day's UTC bounds from the viewer's timezone and passes them in,
   * so this stays a plain range query.
   */
  async day(userId: string, start: Date, end: Date) {
    const match = { userId, startedAt: { $gte: start, $lt: end } };

    const [intervals, screenshots, sessions] = await Promise.all([
      TrackerIntervalModel.find(match).sort({ startedAt: 1 }).lean(),
      TrackerScreenshotModel.find({ userId, capturedAt: { $gte: start, $lt: end } })
        .sort({ capturedAt: 1 })
        .lean(),
      TrackerSessionModel.find(match).sort({ startedAt: 1 }).lean(),
    ]);

    const windowUsage = await TrackerWindowUsageModel.aggregate([
      { $match: { userId, intervalStartedAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: '$appName',
          durationMs: { $sum: '$durationMs' },
        },
      },
      { $project: { _id: 0, appName: '$_id', durationMs: 1 } },
      { $sort: { durationMs: -1 } },
    ]);

    return {
      intervals,
      screenshots: await withActivityPercent(screenshots),
      sessions,
      appUsage: windowUsage,
    };
  }

  /**
   * All-time totals for one employee. `activeMs`/`idleMs` are summed from the intervals
   * (the sessions' own roll-ups are derived from exactly the same rows) and are Floats in
   * the schema on purpose: a year of tracked time in milliseconds overflows a 32-bit Int.
   */
  async totals(userId: string) {
    const [summed, screenshots, sessions] = await Promise.all([
      TrackerIntervalModel.aggregate<{ activeMs: number; idleMs: number }>([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            activeMs: { $sum: '$activeMs' },
            idleMs: { $sum: '$idleMs' },
          },
        },
      ]),
      TrackerScreenshotModel.countDocuments({ userId }),
      TrackerSessionModel.countDocuments({ userId }),
    ]);

    // An employee with no intervals yet aggregates to no rows at all, not to zeroes.
    return {
      activeMs: summed[0]?.activeMs ?? 0,
      idleMs: summed[0]?.idleMs ?? 0,
      screenshots,
      sessions,
    };
  }
}

export const trackerAdminService = new TrackerAdminService();
