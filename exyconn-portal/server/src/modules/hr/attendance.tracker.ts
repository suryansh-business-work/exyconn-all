import { UserModel } from '../admin/user.model';
import {
  TrackerAccessModel,
  TrackerManualEntryModel,
  TrackerSessionModel,
} from '../tracker/models';
import { getTrackerSettings } from '../tracker/tracker.settings.service';
import { resolveEffectiveTimezone, zonedDateKey } from '../tracker/tracker.timezone';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Time one employee booked against one project on one attendance day. */
export interface AttendanceProjectTime {
  projectId: string;
  projectName: string;
  activeMs: number;
  manualMs: number;
  sessions: number;
}

/** What the tracker recorded on one attendance day, read in the employee's own zone. */
export interface AttendanceTrackerBrief {
  activeMs: number;
  idleMs: number;
  manualMs: number;
  sessions: number;
  firstStartedAt: Date | null;
  lastEndedAt: Date | null;
  projects: AttendanceProjectTime[];
}

/** One tracked item — a measured session or an approved off-computer entry. */
interface TrackedItem {
  userId: string;
  startedAt: Date;
  endedAt: Date | null;
  projectId: string;
  projectName: string;
  activeMs: number;
  idleMs: number;
  manualMs: number;
  isSession: boolean;
}

/**
 * The attendance key for an employee's day. Attendance is stored at midnight UTC of the
 * employee's LOCAL date, so its ISO date is exactly the local day the tracker buckets on.
 */
export const dayKeyOf = (employeeId: string, date: Date | string): string =>
  `${employeeId}|${new Date(date).toISOString().slice(0, 10)}`;

/** Each employee's effective zone: their tracker pick, their profile, then the workspace's. */
async function timezonesOf(userIds: string[]): Promise<Map<string, string>> {
  const [settings, access, users] = await Promise.all([
    getTrackerSettings(),
    TrackerAccessModel.find({ userId: { $in: userIds } })
      .select('userId timezone')
      .lean(),
    UserModel.find({ _id: { $in: userIds } })
      .select('timezone')
      .lean(),
  ]);
  const accessZone = new Map(access.map((row) => [row.userId, row.timezone]));
  const profileZone = new Map(users.map((user) => [String(user._id), user.timezone]));
  return new Map(
    userIds.map((userId) => [
      userId,
      resolveEffectiveTimezone({
        employeeTimezone: accessZone.get(userId) || profileZone.get(userId),
        defaultTimezone: settings.defaultTimezone,
      }),
    ]),
  );
}

/**
 * Sessions and approved off-computer entries in a window. The window is a day wider than
 * asked on both sides: a local day in UTC+14 or UTC-12 starts a day away from its UTC date.
 */
async function trackedItems(
  match: { userIds?: string[]; projectId?: string },
  from: Date | null,
  to: Date | null,
): Promise<TrackedItem[]> {
  const startedAt: Record<string, Date> = {};
  if (from) {
    startedAt.$gte = new Date(from.getTime() - MS_PER_DAY);
  }
  if (to) {
    startedAt.$lt = new Date(to.getTime() + 2 * MS_PER_DAY);
  }
  const filter: Record<string, unknown> = {};
  if (match.userIds) {
    filter.userId = { $in: match.userIds };
  }
  if (match.projectId) {
    filter.projectId = match.projectId;
  }
  if (from || to) {
    filter.startedAt = startedAt;
  }
  const [sessions, manual] = await Promise.all([
    TrackerSessionModel.find(filter)
      .select('userId startedAt endedAt projectId projectName activeMs idleMs')
      .lean(),
    TrackerManualEntryModel.find({ ...filter, status: 'APPROVED' })
      .select('userId startedAt endedAt projectId projectName durationMs')
      .lean(),
  ]);
  // Sessions recorded before projects were tracked (and a lean read applies no defaults)
  // carry no project at all: that is time booked without a project, not a missing value
  // that fails the whole register.
  return [
    ...sessions.map((s) => ({
      userId: s.userId,
      startedAt: s.startedAt,
      endedAt: s.endedAt ?? null,
      projectId: s.projectId ?? '',
      projectName: s.projectName ?? '',
      activeMs: s.activeMs ?? 0,
      idleMs: s.idleMs ?? 0,
      manualMs: 0,
      isSession: true,
    })),
    ...manual.map((m) => ({
      userId: m.userId,
      startedAt: m.startedAt,
      endedAt: m.endedAt,
      projectId: m.projectId ?? '',
      projectName: m.projectName ?? '',
      activeMs: 0,
      idleMs: 0,
      manualMs: m.durationMs ?? 0,
      isSession: false,
    })),
  ];
}

/** Groups tracked items by the employee's local day, keyed like {@link dayKeyOf}. */
async function byLocalDay(items: TrackedItem[]): Promise<Map<string, TrackedItem[]>> {
  const zones = await timezonesOf([...new Set(items.map((item) => item.userId))]);
  const days = new Map<string, TrackedItem[]>();
  for (const item of items) {
    const zone = zones.get(item.userId) ?? 'UTC';
    const key = `${item.userId}|${zonedDateKey(item.startedAt, zone)}`;
    days.set(key, [...(days.get(key) ?? []), item]);
  }
  return days;
}

/** Folds one day's items into per-project totals, the busiest project first. */
function projectTotals(items: TrackedItem[]): AttendanceProjectTime[] {
  const projects = new Map<string, AttendanceProjectTime>();
  for (const item of items) {
    const project = projects.get(item.projectId) ?? {
      projectId: item.projectId,
      projectName: item.projectName,
      activeMs: 0,
      manualMs: 0,
      sessions: 0,
    };
    project.activeMs += item.activeMs;
    project.manualMs += item.manualMs;
    project.sessions += item.isSession ? 1 : 0;
    projects.set(item.projectId, project);
  }
  return [...projects.values()].sort((a, b) => b.activeMs + b.manualMs - (a.activeMs + a.manualMs));
}

/** One day's brief. Measured and claimed time stay apart, as everywhere in the tracker. */
function briefOf(items: TrackedItem[]): AttendanceTrackerBrief {
  const starts = items.map((item) => item.startedAt.getTime());
  const ends = items.flatMap((item) => (item.endedAt ? [item.endedAt.getTime()] : []));
  return {
    activeMs: items.reduce((sum, item) => sum + item.activeMs, 0),
    idleMs: items.reduce((sum, item) => sum + item.idleMs, 0),
    manualMs: items.reduce((sum, item) => sum + item.manualMs, 0),
    sessions: items.filter((item) => item.isSession).length,
    firstStartedAt: starts.length > 0 ? new Date(Math.min(...starts)) : null,
    lastEndedAt: ends.length > 0 ? new Date(Math.max(...ends)) : null,
    projects: projectTotals(items),
  };
}

/** The tracker brief for every employee-day on a page, keyed like {@link dayKeyOf}. */
export async function trackerBriefs(
  rows: ReadonlyArray<{ employeeId: string; date: Date }>,
): Promise<Map<string, AttendanceTrackerBrief>> {
  if (rows.length === 0) {
    return new Map();
  }
  const times = rows.map((row) => new Date(row.date).getTime());
  const items = await trackedItems(
    { userIds: [...new Set(rows.map((row) => row.employeeId))] },
    new Date(Math.min(...times)),
    new Date(Math.max(...times)),
  );
  const days = await byLocalDay(items);
  return new Map([...days].map(([key, dayItems]) => [key, briefOf(dayItems)]));
}

/** An empty brief, for a day the employee attended without tracking anything. */
export const EMPTY_BRIEF: AttendanceTrackerBrief = briefOf([]);

/**
 * The employee-days on which anyone booked time to `projectId`, as an attendance filter.
 * Matches nothing when nobody did, rather than silently dropping the filter.
 */
export async function projectDaysFilter(projectId: string, from: Date | null, to: Date | null) {
  const days = await byLocalDay(await trackedItems({ projectId }, from, to));
  const pairs = [...days.keys()].map((key) => {
    const [employeeId, date] = key.split('|');
    return { employeeId, date: new Date(`${date}T00:00:00.000Z`) };
  });
  return pairs.length > 0 ? { $or: pairs } : { employeeId: { $in: [] as string[] } };
}
