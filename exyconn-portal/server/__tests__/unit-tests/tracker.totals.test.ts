import { randomUUID } from 'node:crypto';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { trackerAdminService } from '../../src/modules/tracker/tracker.admin.service';
import {
  TrackerIntervalModel,
  TrackerScreenshotModel,
  TrackerSessionModel,
} from '../../src/modules/tracker/models';

const DAY_START = new Date('2026-07-13T00:00:00.000Z');
const DAY_END = new Date('2026-07-14T00:00:00.000Z');
const INTERVAL_START = new Date('2026-07-13T09:00:00.000Z');
const INTERVAL_END = new Date('2026-07-13T09:10:00.000Z');

async function employee() {
  const user = await UserModel.create({
    name: 'Emp',
    email: `${randomUUID()}@exyconn.com`,
    passwordHash: randomUUID(),
    roles: [ROLES.EMPLOYEE],
  });
  return user.id as string;
}

/** One session + one 10-minute interval, written straight to the models. */
async function trackedInterval(
  userId: string,
  startedAt: Date,
  endedAt: Date,
  activeMs: number,
  idleMs: number,
  activityPercent: number,
) {
  const session = await TrackerSessionModel.create({
    userId,
    deviceId: 'device-1',
    startedAt,
    status: 'stopped',
    endedAt,
    activeMs,
    idleMs,
  });
  const sessionId = String(session._id);
  await TrackerIntervalModel.create({
    userId,
    sessionId,
    startedAt,
    endedAt,
    keyCount: 0,
    mouseCount: 0,
    activeMs,
    idleMs,
    activityPercent,
  });
  return sessionId;
}

function screenshot(userId: string, sessionId: string, intervalStartedAt: Date, capturedAt: Date) {
  return TrackerScreenshotModel.create({
    userId,
    sessionId,
    intervalStartedAt,
    capturedAt,
    imageUrl: 'https://ik.example/shot.jpg',
    displayId: '1',
  });
}

describe('trackerTotals (all-time)', () => {
  it('sums interval time and counts screenshots and sessions', async () => {
    const userId = await employee();
    const sessionId = await trackedInterval(
      userId,
      INTERVAL_START,
      INTERVAL_END,
      480_000,
      120_000,
      80,
    );
    await trackedInterval(
      userId,
      new Date('2026-07-14T09:00:00.000Z'),
      new Date('2026-07-14T09:10:00.000Z'),
      300_000,
      300_000,
      50,
    );
    await screenshot(userId, sessionId, INTERVAL_START, new Date('2026-07-13T09:04:00.000Z'));
    await screenshot(userId, sessionId, INTERVAL_START, new Date('2026-07-13T09:07:00.000Z'));

    await expect(trackerAdminService.totals(userId)).resolves.toEqual({
      activeMs: 780_000,
      idleMs: 420_000,
      screenshots: 2,
      sessions: 2,
    });
  });

  it("never counts another employee's time", async () => {
    const mine = await employee();
    const theirs = await employee();
    await trackedInterval(theirs, INTERVAL_START, INTERVAL_END, 600_000, 0, 100);

    await expect(trackerAdminService.totals(mine)).resolves.toEqual({
      activeMs: 0,
      idleMs: 0,
      screenshots: 0,
      sessions: 0,
    });
  });

  it('reports zeroes for an employee who has never tracked (no rows to aggregate)', async () => {
    const userId = await employee();

    await expect(trackerAdminService.totals(userId)).resolves.toEqual({
      activeMs: 0,
      idleMs: 0,
      screenshots: 0,
      sessions: 0,
    });
  });
});

describe('TrackerScreenshot.activityPercent', () => {
  it('carries the activity of the interval the screenshot belongs to', async () => {
    const userId = await employee();
    const sessionId = await trackedInterval(
      userId,
      INTERVAL_START,
      INTERVAL_END,
      480_000,
      120_000,
      80,
    );
    await screenshot(userId, sessionId, INTERVAL_START, new Date('2026-07-13T09:04:00.000Z'));

    const day = await trackerAdminService.day(userId, DAY_START, DAY_END);

    expect(day.screenshots).toHaveLength(1);
    expect(day.screenshots[0].activityPercent).toBe(80);
  });

  it('reports 0 when the interval it belongs to has not been synced yet', async () => {
    const userId = await employee();
    const sessionId = await trackedInterval(
      userId,
      INTERVAL_START,
      INTERVAL_END,
      480_000,
      120_000,
      80,
    );
    // Uploaded from inside a later interval that has not reached the server yet.
    const orphanInterval = new Date('2026-07-13T09:10:00.000Z');
    await screenshot(userId, sessionId, orphanInterval, new Date('2026-07-13T09:12:00.000Z'));

    const day = await trackerAdminService.day(userId, DAY_START, DAY_END);

    expect(day.screenshots).toHaveLength(1);
    expect(day.screenshots[0].activityPercent).toBe(0);
  });

  it("does not read another session's interval that started at the same moment", async () => {
    const userId = await employee();
    const mySession = await trackedInterval(userId, INTERVAL_START, INTERVAL_END, 600_000, 0, 100);
    // A second session whose interval starts at the exact same time, at 0% activity. The
    // screenshot below belongs to THIS one — a lookup keyed on startedAt alone would
    // report the other session's 100%.
    const idleSession = await trackedInterval(userId, INTERVAL_START, INTERVAL_END, 0, 600_000, 0);
    await screenshot(userId, idleSession, INTERVAL_START, new Date('2026-07-13T09:04:00.000Z'));

    const day = await trackerAdminService.day(userId, DAY_START, DAY_END);

    expect(mySession).not.toBe(idleSession);
    expect(day.screenshots[0].activityPercent).toBe(0);
  });
});
