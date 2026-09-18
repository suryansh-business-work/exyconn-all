import { UserModel } from '../admin/user.model';
import {
  TrackerAccessModel,
  TrackerDeviceModel,
  TrackerManualEntryModel,
  TrackerScreenshotModel,
  TrackerSessionModel,
  TrackerWindowUsageModel,
} from '../tracker/models';
import {
  MS_PER_HOUR,
  countBy,
  dayOf,
  fillTrend,
  oneDecimal,
  type Metric,
} from './analytics.metrics';

/** How many people and apps the "top" charts name. */
const TOP = 8;

const ACTIVE_ACCESS = { isActive: true };
const LIVE_DEVICE = { isActive: true, revokedAt: null };

interface SumRow {
  _id: string;
  value: number;
}

/** The tracked time in the window: sessions, people, active and idle hours, in one pass. */
async function sessionTotals(since: Date) {
  const [row] = await TrackerSessionModel.aggregate<{
    sessions: number;
    users: string[];
    activeMs: number;
    idleMs: number;
  }>([
    { $match: { startedAt: { $gte: since } } },
    {
      $group: {
        _id: null,
        sessions: { $sum: 1 },
        users: { $addToSet: '$userId' },
        activeMs: { $sum: '$activeMs' },
        idleMs: { $sum: '$idleMs' },
      },
    },
  ]);
  const activeMs = row?.activeMs ?? 0;
  const idleMs = row?.idleMs ?? 0;
  const trackedMs = activeMs + idleMs;
  return {
    sessions: row?.sessions ?? 0,
    trackedUsers: row?.users.length ?? 0,
    activeHours: oneDecimal(activeMs / MS_PER_HOUR),
    idleHours: oneDecimal(idleMs / MS_PER_HOUR),
    activityPercent: trackedMs === 0 ? 0 : oneDecimal((activeMs / trackedMs) * 100),
  };
}

/** Active hours per day in the window, in the workspace's own days. */
async function hoursPerDay(since: Date, timeZone: string, days: readonly string[]) {
  const rows = await TrackerSessionModel.aggregate<SumRow>([
    { $match: { startedAt: { $gte: since } } },
    { $group: { _id: dayOf('startedAt', timeZone), value: { $sum: '$activeMs' } } },
  ]);
  return fillTrend(
    days,
    rows.map((row) => ({ _id: row._id, value: oneDecimal(row.value / MS_PER_HOUR) })),
  );
}

/** The people with the most active hours in the window, by name. */
async function topUsers(since: Date): Promise<Metric[]> {
  const rows = await TrackerSessionModel.aggregate<SumRow>([
    { $match: { startedAt: { $gte: since } } },
    { $group: { _id: '$userId', value: { $sum: '$activeMs' } } },
    { $sort: { value: -1 } },
    { $limit: TOP },
  ]);
  const people = await UserModel.find({ _id: { $in: rows.map((row) => row._id) } })
    .select('name')
    .lean();
  const names = new Map(people.map((person) => [String(person._id), person.name]));
  return rows.map((row) => ({
    label: names.get(row._id) ?? 'Former user',
    value: oneDecimal(row.value / MS_PER_HOUR),
  }));
}

/** The applications most time went to in the window. */
async function topApps(since: Date): Promise<Metric[]> {
  const rows = await TrackerWindowUsageModel.aggregate<SumRow>([
    { $match: { intervalStartedAt: { $gte: since } } },
    { $group: { _id: '$appName', value: { $sum: '$durationMs' } } },
    { $sort: { value: -1 } },
    { $limit: TOP },
  ]);
  return rows.map((row) => ({ label: row._id, value: oneDecimal(row.value / MS_PER_HOUR) }));
}

/** The desktop and phone tracker: who may use it, on what, and the time it recorded. */
export async function trackerAnalytics(since: Date, timeZone: string, days: readonly string[]) {
  const [
    usersWithAccess,
    consented,
    activeDevices,
    screenshots,
    totals,
    perDay,
    people,
    apps,
    devicesByPlatform,
    presence,
    manualEntriesByStatus,
  ] = await Promise.all([
    TrackerAccessModel.countDocuments(ACTIVE_ACCESS),
    TrackerAccessModel.countDocuments({ ...ACTIVE_ACCESS, consentedAt: { $ne: null } }),
    TrackerDeviceModel.countDocuments(LIVE_DEVICE),
    TrackerScreenshotModel.countDocuments({ capturedAt: { $gte: since } }),
    sessionTotals(since),
    hoursPerDay(since, timeZone, days),
    topUsers(since),
    topApps(since),
    countBy(TrackerDeviceModel, LIVE_DEVICE, 'platform'),
    countBy(TrackerAccessModel, ACTIVE_ACCESS, 'presence'),
    countBy(TrackerManualEntryModel, { startedAt: { $gte: since } }, 'status'),
  ]);
  return {
    usersWithAccess,
    consented,
    activeDevices,
    screenshots,
    ...totals,
    hoursPerDay: perDay,
    topUsers: people,
    topApps: apps,
    devicesByPlatform,
    presence,
    manualEntriesByStatus,
  };
}
