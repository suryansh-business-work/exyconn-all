import { Types } from 'mongoose';
import { UserModel } from '../../src/modules/admin/user.model';
import {
  TrackerIntervalModel,
  TrackerManualEntryModel,
  TrackerScreenshotModel,
  TrackerSessionModel,
} from '../../src/modules/tracker/models';
import { trackerTimeLogService } from '../../src/modules/tracker/tracker.timelog.service';

const HOUR = 3_600_000;
const PROJECT = new Types.ObjectId().toString();
const OTHER_PROJECT = new Types.ObjectId().toString();
const TASK_A = new Types.ObjectId().toString();
const TASK_B = new Types.ObjectId().toString();

const WINDOW = {
  from: new Date(Date.now() - 7 * 24 * HOUR),
  to: new Date(Date.now() + 24 * HOUR),
};

async function employee(name: string) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`,
    passwordHash: 'not-a-real-hash',
    roles: ['EMPLOYEE'],
  });
  return String(user._id);
}

/** A tracked run with its interval time, optionally against a ticket. */
async function session(
  userId: string,
  opts: {
    projectId?: string;
    taskId?: string;
    taskKey?: string;
    activeMs?: number;
    idleMs?: number;
    shots?: number;
  } = {},
) {
  const doc = await TrackerSessionModel.create({
    userId,
    deviceId: 'dev-1',
    startedAt: new Date(Date.now() - 2 * HOUR),
    endedAt: new Date(Date.now() - HOUR),
    status: 'stopped',
    projectId: opts.projectId ?? PROJECT,
    projectName: 'Acme',
    taskId: opts.taskId ?? '',
    taskKey: opts.taskKey ?? '',
    taskTitle: opts.taskKey ? `Work on ${opts.taskKey}` : '',
  });
  const sessionId = String(doc._id);

  await TrackerIntervalModel.create({
    userId,
    sessionId,
    startedAt: new Date(Date.now() - 2 * HOUR),
    endedAt: new Date(Date.now() - HOUR),
    activeMs: opts.activeMs ?? HOUR,
    idleMs: opts.idleMs ?? 0,
    activityPercent: 70,
  });

  for (let i = 0; i < (opts.shots ?? 0); i += 1) {
    await TrackerScreenshotModel.create({
      userId,
      sessionId,
      intervalStartedAt: new Date(Date.now() - 2 * HOUR),
      capturedAt: new Date(Date.now() - 2 * HOUR + i * 60_000),
      imageUrl: `https://ik.example/shot-${sessionId}-${i}.png`,
      fileId: `f-${sessionId}-${i}`,
    });
  }
  return sessionId;
}

describe('project time log', () => {
  beforeEach(async () => {
    await Promise.all([
      TrackerSessionModel.deleteMany({}),
      TrackerIntervalModel.deleteMany({}),
      TrackerScreenshotModel.deleteMany({}),
      TrackerManualEntryModel.deleteMany({}),
      UserModel.deleteMany({}),
    ]);
  });

  it('reports who worked on which ticket, with time and screenshot counts', async () => {
    const dev = await employee('Dev One');
    await session(dev, { taskId: TASK_A, taskKey: 'EXY-14', activeMs: 2 * HOUR, shots: 3 });

    const [row] = await trackerTimeLogService.summary(PROJECT, WINDOW.from, WINDOW.to);

    expect(row).toMatchObject({
      userName: 'Dev One',
      taskKey: 'EXY-14',
      activeMs: 2 * HOUR,
      sessions: 1,
      screenshots: 3,
    });
  });

  it("keeps one person's two tickets as separate rows", async () => {
    const dev = await employee('Dev One');
    await session(dev, { taskId: TASK_A, taskKey: 'EXY-14', activeMs: HOUR });
    await session(dev, { taskId: TASK_B, taskKey: 'EXY-15', activeMs: 2 * HOUR });

    const rows = await trackerTimeLogService.summary(PROJECT, WINDOW.from, WINDOW.to);

    expect(rows).toHaveLength(2);
    // Busiest ticket first.
    expect(rows.map((row) => row.taskKey)).toEqual(['EXY-15', 'EXY-14']);
  });

  it('adds up two sessions on the same ticket by the same person', async () => {
    const dev = await employee('Dev One');
    await session(dev, { taskId: TASK_A, taskKey: 'EXY-14', activeMs: HOUR, shots: 1 });
    await session(dev, { taskId: TASK_A, taskKey: 'EXY-14', activeMs: HOUR, shots: 2 });

    const rows = await trackerTimeLogService.summary(PROJECT, WINDOW.from, WINDOW.to);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ activeMs: 2 * HOUR, sessions: 2, screenshots: 3 });
  });

  it('keeps two people on the same ticket apart', async () => {
    const one = await employee('Dev One');
    const two = await employee('Dev Two');
    await session(one, { taskId: TASK_A, taskKey: 'EXY-14', activeMs: HOUR });
    await session(two, { taskId: TASK_A, taskKey: 'EXY-14', activeMs: HOUR });

    const rows = await trackerTimeLogService.summary(PROJECT, WINDOW.from, WINDOW.to);

    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.userName))).toEqual(new Set(['Dev One', 'Dev Two']));
  });

  it('groups time booked to no ticket into its own row', async () => {
    const dev = await employee('Dev One');
    await session(dev, { activeMs: HOUR });

    const rows = await trackerTimeLogService.summary(PROJECT, WINDOW.from, WINDOW.to);

    expect(rows).toHaveLength(1);
    expect(rows[0].taskId).toBe('');
    expect(rows[0].taskKey).toBe('');
  });

  it("never counts another project's sessions", async () => {
    const dev = await employee('Dev One');
    await session(dev, { projectId: OTHER_PROJECT, taskKey: 'OTH-1', activeMs: 5 * HOUR });

    await expect(trackerTimeLogService.summary(PROJECT, WINDOW.from, WINDOW.to)).resolves.toEqual(
      [],
    );
  });

  it('counts approved off-computer time, and ignores a pending claim', async () => {
    const dev = await employee('Dev One');
    await TrackerManualEntryModel.create({
      userId: dev,
      projectId: PROJECT,
      taskId: TASK_A,
      taskKey: 'EXY-14',
      startedAt: new Date(Date.now() - 3 * HOUR),
      endedAt: new Date(Date.now() - 2 * HOUR),
      durationMs: HOUR,
      note: 'Kickoff call',
      status: 'APPROVED',
    });
    await TrackerManualEntryModel.create({
      userId: dev,
      projectId: PROJECT,
      taskId: TASK_B,
      taskKey: 'EXY-15',
      startedAt: new Date(Date.now() - 3 * HOUR),
      endedAt: new Date(Date.now() - 2 * HOUR),
      durationMs: 4 * HOUR,
      note: 'Not approved yet',
      status: 'PENDING',
    });

    const rows = await trackerTimeLogService.summary(PROJECT, WINDOW.from, WINDOW.to);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ taskKey: 'EXY-14', manualMs: HOUR, activeMs: 0, sessions: 0 });
  });

  it('merges a ticket that has both tracked and claimed time into one row', async () => {
    const dev = await employee('Dev One');
    await session(dev, { taskId: TASK_A, taskKey: 'EXY-14', activeMs: HOUR });
    await TrackerManualEntryModel.create({
      userId: dev,
      projectId: PROJECT,
      taskId: TASK_A,
      taskKey: 'EXY-14',
      startedAt: new Date(Date.now() - 3 * HOUR),
      endedAt: new Date(Date.now() - 2 * HOUR),
      durationMs: HOUR,
      note: 'Review call',
      status: 'APPROVED',
    });

    const rows = await trackerTimeLogService.summary(PROJECT, WINDOW.from, WINDOW.to);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ activeMs: HOUR, manualMs: HOUR });
  });

  describe('drill-down', () => {
    it('lists the runs behind one person and ticket', async () => {
      const one = await employee('Dev One');
      const two = await employee('Dev Two');
      await session(one, { taskId: TASK_A, taskKey: 'EXY-14', activeMs: HOUR, shots: 2 });
      await session(two, { taskId: TASK_A, taskKey: 'EXY-14', activeMs: HOUR });

      const rows = await trackerTimeLogService.sessions(
        PROJECT,
        WINDOW.from,
        WINDOW.to,
        one,
        TASK_A,
      );

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ userName: 'Dev One', screenshotCount: 2 });
    });

    it('treats an empty taskId as the real filter "booked to no ticket"', async () => {
      const dev = await employee('Dev One');
      await session(dev, { activeMs: HOUR });
      await session(dev, { taskId: TASK_A, taskKey: 'EXY-14', activeMs: HOUR });

      const rows = await trackerTimeLogService.sessions(PROJECT, WINDOW.from, WINDOW.to, dev, '');

      expect(rows).toHaveLength(1);
      expect(rows[0].taskKey).toBe('');
    });
  });

  describe('screenshots', () => {
    it('returns the shots of a session that belongs to the project', async () => {
      const dev = await employee('Dev One');
      const sessionId = await session(dev, { taskKey: 'EXY-14', shots: 2 });

      const shots = await trackerTimeLogService.screenshots(PROJECT, sessionId);

      expect(shots).toHaveLength(2);
      expect(shots[0].imageUrl).toContain('shot-');
    });

    it('refuses a session id from another project, so it cannot be used as a handle', async () => {
      const dev = await employee('Dev One');
      const sessionId = await session(dev, { projectId: OTHER_PROJECT, shots: 3 });

      await expect(trackerTimeLogService.screenshots(PROJECT, sessionId)).resolves.toEqual([]);
    });
  });
});
