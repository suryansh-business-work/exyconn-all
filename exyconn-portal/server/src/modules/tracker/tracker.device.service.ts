import { UserModel } from '../admin/user.model';
import { verifyPassword } from '../../utils/password';
import { signDeviceToken } from '../../utils/jwt';
import { imageUploader } from '../../utils/imagekit';
import { unauthenticated, forbidden, notFound, badRequest } from '../../utils/errors';
import { hashToken } from './tracker.auth';
import { TRACKER_LIMITS } from './tracker.constants';
import { getTrackerSettings } from './tracker.settings.service';
import { isValidTimezone, resolveEffectiveTimezone } from './tracker.timezone';
import type { Role } from '../../constants/roles';
import {
  TrackerAccessModel,
  TrackerDeviceModel,
  TrackerIntervalModel,
  TrackerScreenshotModel,
  TrackerSessionModel,
  TrackerWindowUsageModel,
} from './models';

export interface DeviceInput {
  deviceId: string;
  platform: string;
  hostname?: string;
  appVersion?: string;
  /** Stable OS hardware id — survives a reinstall, unlike the generated deviceId. */
  machineId?: string;
  osName?: string;
  osVersion?: string;
  arch?: string;
  cpuModel?: string;
  cpuCores?: number;
  totalMemoryMb?: number;
  locale?: string;
  timezone?: string;
  screenCount?: number;
  screenResolution?: string;
}

export interface WindowUsageInput {
  appName: string;
  windowTitle?: string;
  durationMs: number;
}

export interface IntervalInput {
  startedAt: Date;
  endedAt: Date;
  keyCount: number;
  mouseCount: number;
  activeMs: number;
  idleMs: number;
  windows?: WindowUsageInput[];
}

export interface ScreenshotInput {
  sessionId: string;
  intervalStartedAt: Date;
  capturedAt: Date;
  /** Base64 data-URL of the (already downscaled/compressed) capture. */
  image: string;
  displayId?: string;
  blurred?: boolean;
}

/** Share of an interval spent with input activity, clamped to 0–100. */
function activityPercent(activeMs: number, idleMs: number): number {
  const total = activeMs + idleMs;
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((activeMs / total) * 100)));
}

/**
 * The descriptive half of a device row — what the machine is, not what it is allowed to do.
 *
 * Kept apart from the identity and grant fields (userId, tokenHash, isActive, revokedAt) on
 * purpose: a heartbeat may refresh this, and must never be able to re-enrol a device or
 * un-revoke itself by sending a fuller payload.
 */
function describeDevice(device: DeviceInput) {
  return {
    platform: device.platform,
    hostname: device.hostname ?? '',
    appVersion: device.appVersion ?? '',
    machineId: device.machineId ?? '',
    osName: device.osName ?? '',
    osVersion: device.osVersion ?? '',
    arch: device.arch ?? '',
    cpuModel: device.cpuModel ?? '',
    cpuCores: device.cpuCores ?? 0,
    totalMemoryMb: device.totalMemoryMb ?? 0,
    locale: device.locale ?? '',
    timezone: device.timezone ?? '',
    screenCount: device.screenCount ?? 0,
    screenResolution: device.screenResolution ?? '',
  };
}

/** Desktop-tracker logic (singleton). */
class TrackerDeviceService {
  /**
   * Signs a device in and issues a non-expiring token bound to a device record.
   *
   * Access is refused unless an admin has explicitly granted this employee tracker
   * access, so the app can never start tracking someone who was not told about it.
   */
  async login(email: string, password: string, device: DeviceInput) {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      unauthenticated('Invalid email or password');
    }
    if (user.isBlocked) {
      unauthenticated('Your account is temporarily blocked. Contact an administrator.');
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      unauthenticated('Invalid email or password');
    }

    const access = await TrackerAccessModel.findOne({ userId: user.id }).lean();
    if (!access?.isActive) {
      forbidden('You have not been given access to the tracker. Ask your administrator.');
    }

    const token = signDeviceToken({
      id: user.id,
      email: user.email,
      roles: user.roles as Role[],
      deviceId: device.deviceId,
    });

    await TrackerDeviceModel.findOneAndUpdate(
      { deviceId: device.deviceId },
      {
        ...describeDevice(device),
        userId: user.id,
        deviceId: device.deviceId,
        tokenHash: hashToken(token),
        issuedAt: new Date(),
        lastSeenAt: new Date(),
        revokedAt: null,
        isActive: true,
      },
      { upsert: true, new: true },
    );

    return {
      token,
      user: user.toObject(),
      consentRequired: !access.consentedAt,
      settings: await getTrackerSettings(),
    };
  }

  /**
   * Rebuilds a desktop session from a stored device token. This is what makes "Remember me"
   * work: on relaunch the app has a token but no user/settings in memory, and asking the
   * portal who it belongs to avoids prompting for the password again.
   */
  async me(userId: string, deviceId: string) {
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      unauthenticated('Account no longer exists');
    }
    const access = await TrackerAccessModel.findOne({ userId }).lean();
    if (!access?.isActive) {
      forbidden('Your tracker access has been revoked.');
    }

    const [settings, device] = await Promise.all([
      getTrackerSettings(),
      TrackerDeviceModel.findOne({ deviceId, userId }).lean(),
    ]);

    return {
      user,
      consentRequired: !access.consentedAt,
      settings,
      timezone: resolveEffectiveTimezone({
        employeeTimezone: access.timezone,
        defaultTimezone: settings.defaultTimezone,
        deviceTimezone: device?.timezone,
      }),
    };
  }

  /**
   * Records the zone the employee picked in the desktop app.
   *
   * Only ever writes the CALLER's own row — the resolver hands us the userId the device
   * token authenticated as, so one employee can never restate another's timezone.
   */
  async setTimezone(userId: string, timezone: string) {
    if (!isValidTimezone(timezone)) {
      badRequest(`Unknown timezone: ${timezone}`);
    }

    const access = await TrackerAccessModel.findOneAndUpdate(
      { userId, isActive: true },
      { timezone },
      { new: true },
    ).lean();
    if (!access) {
      forbidden('Your tracker access has been revoked.');
    }
    return access;
  }

  /** Records that the employee accepted the in-app disclosure. Tracking is gated on this. */
  async acceptConsent(userId: string) {
    const access = await TrackerAccessModel.findOneAndUpdate(
      { userId, isActive: true },
      { consentedAt: new Date() },
      { new: true },
    ).lean();
    if (!access) {
      forbidden('Your tracker access has been revoked.');
    }
    return true;
  }

  /**
   * Desktop keep-alive. Marks the device as seen just now — that is the only thing keeping
   * the portal's Devices console honest about who is actually running the app — and returns
   * the current state in the same round-trip, so a long-running app never sits on settings
   * an admin has since changed.
   *
   * The app also re-states what it is. Device details were previously written only at sign-in,
   * and a device token never expires, so the console kept showing the app version and hardware
   * an employee enrolled with however many updates ago. Only the descriptive fields are
   * refreshed, and the row is matched on (deviceId, userId): a heartbeat cannot re-enrol a
   * device, move it to another employee, or undo a revocation.
   */
  async heartbeat(userId: string, deviceId: string, device?: DeviceInput) {
    const seen = device
      ? { ...describeDevice(device), lastSeenAt: new Date() }
      : { lastSeenAt: new Date() };
    await TrackerDeviceModel.updateOne({ deviceId, userId }, seen);
    return this.me(userId, deviceId);
  }

  /** Opens a tracking session. The employee must have accepted the disclosure first. */
  async startSession(userId: string, deviceId: string, startedAt: Date) {
    const access = await TrackerAccessModel.findOne({ userId, isActive: true }).lean();
    if (!access?.consentedAt) {
      forbidden('You must accept the tracking disclosure before tracking can start.');
    }

    const session = await TrackerSessionModel.create({
      userId,
      deviceId,
      startedAt,
      status: 'active',
    });
    return session.toObject();
  }

  async stopSession(userId: string, sessionId: string, endedAt: Date) {
    const session = await TrackerSessionModel.findOneAndUpdate(
      { _id: sessionId, userId },
      { endedAt, status: 'stopped' },
      { new: true },
    ).lean();
    if (!session) {
      notFound('Session');
    }
    return session;
  }

  /**
   * Persists a batch of activity intervals.
   *
   * Upserts on (sessionId, startedAt) because the desktop app retries from an offline
   * queue — without that, a flaky network would double-count an employee's hours.
   */
  async syncIntervals(userId: string, sessionId: string, intervals: IntervalInput[]) {
    if (intervals.length > TRACKER_LIMITS.maxIntervalsPerSync) {
      badRequest(`Too many intervals in one sync (max ${TRACKER_LIMITS.maxIntervalsPerSync})`);
    }

    const session = await TrackerSessionModel.findOne({ _id: sessionId, userId }).lean();
    if (!session) {
      notFound('Session');
    }

    const settings = await getTrackerSettings();

    for (const interval of intervals) {
      await TrackerIntervalModel.updateOne(
        { sessionId, startedAt: interval.startedAt },
        {
          $set: {
            userId,
            sessionId,
            startedAt: interval.startedAt,
            endedAt: interval.endedAt,
            keyCount: interval.keyCount,
            mouseCount: interval.mouseCount,
            activeMs: interval.activeMs,
            idleMs: interval.idleMs,
            activityPercent: activityPercent(interval.activeMs, interval.idleMs),
          },
        },
        { upsert: true },
      );

      await this.syncWindowUsage(userId, sessionId, interval, settings.trackWindowTitles);
    }

    await this.rollUpSession(sessionId);
    return TrackerIntervalModel.countDocuments({ sessionId });
  }

  /** Writes the per-app foreground durations for one interval. */
  private async syncWindowUsage(
    userId: string,
    sessionId: string,
    interval: IntervalInput,
    trackTitles: boolean,
  ): Promise<void> {
    const windows = (interval.windows ?? []).slice(0, TRACKER_LIMITS.maxWindowUsagePerInterval);

    for (const usage of windows) {
      // Honour the portal's privacy switch server-side too: if titles are off, they are
      // never stored, even if an older client still sends them.
      const windowTitle = trackTitles ? (usage.windowTitle ?? '') : '';
      await TrackerWindowUsageModel.updateOne(
        {
          sessionId,
          intervalStartedAt: interval.startedAt,
          appName: usage.appName,
          windowTitle,
        },
        {
          $set: {
            userId,
            sessionId,
            intervalStartedAt: interval.startedAt,
            appName: usage.appName,
            windowTitle,
            durationMs: usage.durationMs,
          },
        },
        { upsert: true },
      );
    }
  }

  /** Recomputes a session's totals from its intervals, so day views need no aggregation. */
  private async rollUpSession(sessionId: string): Promise<void> {
    const [totals] = await TrackerIntervalModel.aggregate<{
      activeMs: number;
      idleMs: number;
      keyCount: number;
      mouseCount: number;
    }>([
      { $match: { sessionId } },
      {
        $group: {
          _id: null,
          activeMs: { $sum: '$activeMs' },
          idleMs: { $sum: '$idleMs' },
          keyCount: { $sum: '$keyCount' },
          mouseCount: { $sum: '$mouseCount' },
        },
      },
      // Drop the grouping _id so the $set below never touches the session's immutable _id.
      { $project: { _id: 0 } },
    ]);

    if (totals) {
      await TrackerSessionModel.updateOne({ _id: sessionId }, { $set: totals });
    }
  }

  /** Uploads a screenshot to ImageKit and records its URL against the interval. */
  async uploadScreenshot(userId: string, input: ScreenshotInput) {
    if (input.image.length > TRACKER_LIMITS.maxScreenshotBytes) {
      badRequest('Screenshot is too large');
    }

    const session = await TrackerSessionModel.findOne({ _id: input.sessionId, userId }).lean();
    if (!session) {
      notFound('Session');
    }

    const fileName = `shot-${userId}-${input.capturedAt.getTime()}`;
    const imageUrl = await imageUploader.uploadTrackerScreenshot(input.image, fileName, userId);

    const screenshot = await TrackerScreenshotModel.create({
      userId,
      sessionId: input.sessionId,
      intervalStartedAt: input.intervalStartedAt,
      capturedAt: input.capturedAt,
      imageUrl,
      displayId: input.displayId ?? '',
      blurred: input.blurred ?? false,
    });

    // A screenshot carries the activity of the interval it belongs to. Shots are uploaded
    // from *inside* the interval, so that interval usually has not been synced yet — 0
    // until it arrives. One lookup for one screenshot; the day view maps them in bulk.
    const interval = await TrackerIntervalModel.findOne({
      sessionId: input.sessionId,
      startedAt: input.intervalStartedAt,
    })
      .select('activityPercent')
      .lean();

    return { ...screenshot.toObject(), activityPercent: interval?.activityPercent ?? 0 };
  }
}

export const trackerDeviceService = new TrackerDeviceService();
