import { AppSettingsModel } from '../admin/settings.model';
import { UserModel } from '../admin/user.model';
import { emailer } from '../email';
import { ROLES } from '../../constants/roles';
import { logger } from '../../utils/logger';
import { TrackerIntervalModel, TrackerSettingsModel } from './models';
import { trackerManualService } from './tracker.manual.service';
import { getTrackerSettings } from './tracker.settings.service';
import { FALLBACK_TIMEZONE, zonedDateKey, zonedHour } from './tracker.timezone';

/** How often the process asks whether a digest is due. */
const TICK_MS = 60_000;

const MS_PER_HOUR = 3_600_000;
const DAY_MS = 24 * MS_PER_HOUR;

/** Monday, as `Date#getUTCDay` numbers the week. The weekly summary covers the week just ended. */
const WEEKLY_SEND_DAY = 1;

/** One employee's line in a digest. */
export interface DigestRow {
  name: string;
  activeMs: number;
  manualMs: number;
}

/** A digest ready to send: who worked, how much, and what to call the period. */
export interface Digest {
  periodLabel: string;
  rows: DigestRow[];
  totalHours: number;
}

const hours = (ms: number): number => Math.round((ms / MS_PER_HOUR) * 100) / 100;

/**
 * Tracked and approved off-computer time per employee over a window, busiest first.
 *
 * Employees with no time at all are left out rather than listed as zeroes: a manager
 * scanning a morning email needs the day's work, and twenty zero rows bury it. Who did
 * nothing is a question the Tracker console answers properly.
 */
export async function buildDigest(from: Date, to: Date, periodLabel: string): Promise<Digest> {
  const [tracked, manualByUser] = await Promise.all([
    TrackerIntervalModel.aggregate<{ _id: string; activeMs: number }>([
      { $match: { startedAt: { $gte: from, $lt: to } } },
      { $group: { _id: '$userId', activeMs: { $sum: '$activeMs' } } },
    ]),
    trackerManualService.approvedByUser(from, to),
  ]);

  const worked = new Map(tracked.map((row) => [row._id, row.activeMs]));
  for (const userId of manualByUser.keys()) {
    if (!worked.has(userId)) {
      worked.set(userId, 0);
    }
  }
  if (worked.size === 0) {
    return { periodLabel, rows: [], totalHours: 0 };
  }

  const users = await UserModel.find({ _id: { $in: [...worked.keys()] } })
    .select('name')
    .lean();
  const nameOf = new Map(users.map((user) => [String(user._id), user.name]));

  const rows = [...worked.entries()]
    .map(([userId, activeMs]) => ({
      name: nameOf.get(userId) ?? 'Deleted employee',
      activeMs,
      manualMs: manualByUser.get(userId) ?? 0,
    }))
    .sort((a, b) => b.activeMs + b.manualMs - (a.activeMs + a.manualMs));

  const totalMs = rows.reduce((sum, row) => sum + row.activeMs + row.manualMs, 0);
  return { periodLabel, rows, totalHours: hours(totalMs) };
}

/** Escapes the one thing in a digest that is user-supplied: an employee's own name. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * The rows as one finished HTML string.
 *
 * The email template engine has no loops on purpose — anything needing a decision is
 * decided here and handed over as text, so the template stays editable by whoever writes
 * the copy rather than by a developer.
 */
export function renderDigestRows(rows: DigestRow[]): string {
  if (rows.length === 0) {
    return '<tr><td colspan="3" style="padding:8px 0;color:#64748b;">No time was tracked.</td></tr>';
  }
  return rows
    .map((row) => {
      const offComputer = row.manualMs > 0 ? `${hours(row.manualMs)}h off-computer` : '—';
      return [
        '<tr>',
        `<td style="padding:6px 0;">${escapeHtml(row.name)}</td>`,
        `<td style="padding:6px 0;text-align:right;">${hours(row.activeMs)}h</td>`,
        `<td style="padding:6px 0;text-align:right;color:#64748b;">${offComputer}</td>`,
        '</tr>',
      ].join('');
    })
    .join('');
}

/** Everyone who should receive a tracker digest: the people who administer the tracker. */
async function digestRecipients(): Promise<Array<{ name: string; email: string }>> {
  const managers = await UserModel.find({
    isActive: true,
    roles: { $in: [ROLES.TRACKER, ROLES.ADMIN] },
  })
    .select('name email')
    .lean();
  return managers.map((user) => ({ name: user.name, email: user.email }));
}

/** Sends one digest to every manager. One failure must not stop the rest going out. */
async function sendDigest(digest: Digest): Promise<void> {
  const recipients = await digestRecipients();
  if (recipients.length === 0) {
    logger.warn('Tracker digest is on but nobody holds the TRACKER role; nothing sent');
    return;
  }

  const variables = {
    periodLabel: digest.periodLabel,
    rows: renderDigestRows(digest.rows),
    totalHours: String(digest.totalHours),
    employeeCount: String(digest.rows.length),
  };

  for (const recipient of recipients) {
    try {
      await emailer.send({
        template: 'tracker-digest',
        to: recipient.email,
        variables: { ...variables, name: recipient.name },
        triggeredBy: 'tracker digest schedule',
      });
    } catch (error) {
      logger.error({ error, to: recipient.email }, 'Tracker digest send failed');
    }
  }
}

/** The window the daily digest covers: the local day that has just ended. */
export function dailyWindow(now: Date, timezone: string) {
  const endedAt = new Date(now.getTime());
  const from = new Date(endedAt.getTime() - DAY_MS);
  return { from, to: endedAt, label: `on ${zonedDateKey(from, timezone)}` };
}

/** The window the weekly digest covers: the seven local days that have just ended. */
export function weeklyWindow(now: Date, timezone: string) {
  const from = new Date(now.getTime() - 7 * DAY_MS);
  return {
    from,
    to: now,
    label: `from ${zonedDateKey(from, timezone)} to ${zonedDateKey(now, timezone)}`,
  };
}

/**
 * Whether a digest is due now.
 *
 * "At or after the chosen hour, and not already sent today" rather than an exact-hour
 * match, so a restart during the send hour still delivers — and the stored last-run date
 * still stops a second copy. Same shape as the payroll dispatch check.
 */
export function isDigestDue(
  enabled: boolean,
  hour: number,
  lastRun: string,
  now: {
    hour: number;
    dateKey: string;
  },
): boolean {
  return enabled && now.hour >= hour && lastRun !== now.dateKey;
}

/** Sends whichever digests are due, and records that they went. */
async function runDueDigests(): Promise<void> {
  const [settings, appSettings] = await Promise.all([
    getTrackerSettings(),
    AppSettingsModel.findOne().lean(),
  ]);
  if (!settings.dailyDigestEnabled && !settings.weeklyDigestEnabled) {
    return;
  }

  const timezone = settings.defaultTimezone || appSettings?.timezone || FALLBACK_TIMEZONE;
  const now = new Date();
  const clock = { hour: zonedHour(now, timezone), dateKey: zonedDateKey(now, timezone) };

  if (
    isDigestDue(
      settings.dailyDigestEnabled,
      settings.digestHour,
      settings.dailyDigestLastRun ?? '',
      clock,
    )
  ) {
    const window = dailyWindow(now, timezone);
    await sendDigest(await buildDigest(window.from, window.to, window.label));
    await TrackerSettingsModel.updateOne({ key: 'global' }, { dailyDigestLastRun: clock.dateKey });
  }

  const isSendDay = now.getUTCDay() === WEEKLY_SEND_DAY;
  const weeklyDue =
    isSendDay &&
    isDigestDue(
      settings.weeklyDigestEnabled,
      settings.digestHour,
      settings.weeklyDigestLastRun ?? '',
      clock,
    );
  if (weeklyDue) {
    const window = weeklyWindow(now, timezone);
    await sendDigest(await buildDigest(window.from, window.to, window.label));
    await TrackerSettingsModel.updateOne({ key: 'global' }, { weeklyDigestLastRun: clock.dateKey });
  }
}

/** Starts the once-a-minute check that emails tracker digests on the workspace's schedule. */
export function startTrackerDigest(): void {
  const tick = () => {
    runDueDigests().catch((error: unknown) => logger.error(error, 'Tracker digest check failed'));
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Tracker digest scheduler started');
}
