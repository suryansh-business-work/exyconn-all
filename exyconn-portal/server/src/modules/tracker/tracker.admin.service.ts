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

    return access;
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
    return access;
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

  listAccess() {
    return TrackerAccessModel.find().sort({ createdAt: -1 }).lean();
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
      { $project: { _id: 0, date: '$_id', activeMs: 1, idleMs: 1, keyCount: 1, mouseCount: 1, sessions: 1 } },
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

    return { intervals, screenshots, sessions, appUsage: windowUsage };
  }
}

export const trackerAdminService = new TrackerAdminService();
