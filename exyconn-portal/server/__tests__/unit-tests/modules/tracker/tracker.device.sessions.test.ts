import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
import { TaskModel } from '../../../../src/modules/projects/board.model';
import {
  trackerDeviceService,
  type IntervalInput,
} from '../../../../src/modules/tracker/tracker.device.service';
import { updateTrackerSettings } from '../../../../src/modules/tracker/tracker.settings.service';
import { TRACKER_LIMITS } from '../../../../src/modules/tracker/tracker.constants';
import {
  TrackerAccessModel,
  TrackerDeviceModel,
  TrackerIntervalModel,
  TrackerSessionModel,
  TrackerWindowUsageModel,
} from '../../../../src/modules/tracker/models';
import { codeOf } from '../codeOf';

const DEVICE_ID = 'device-sessions';
const STARTED = new Date('2026-07-13T09:00:00.000Z');
const ENDED = new Date('2026-07-13T09:10:00.000Z');

/** An employee who accepted the disclosure and marked in for today, on an enrolled device. */
async function readyToTrack() {
  const user = await UserModel.create({
    name: 'Emp',
    email: `${randomUUID()}@exyconn.com`,
    passwordHash: randomUUID(),
  });
  const userId = user._id.toHexString();
  await TrackerAccessModel.create({ userId, grantedBy: 'admin', consentedAt: new Date() });
  await TrackerDeviceModel.create({ userId, deviceId: DEVICE_ID, tokenHash: 'h', platform: 'ios' });
  await trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT', 'In the office');
  return userId;
}

async function openSession(userId: string) {
  const session = await trackerDeviceService.startSession(userId, DEVICE_ID, new Date());
  return session._id.toHexString();
}

const interval = (overrides: Partial<IntervalInput> = {}): IntervalInput => ({
  startedAt: STARTED,
  endedAt: ENDED,
  keyCount: 1,
  mouseCount: 1,
  activeMs: 300_000,
  idleMs: 300_000,
  ...overrides,
});

describe('starting a session', () => {
  it('books the chosen project and ticket', async () => {
    const userId = await readyToTrack();
    const project = await ProjectModel.create({ name: 'Apollo', status: 'ACTIVE' });
    const task = await TaskModel.create({
      projectId: project._id,
      columnId: new Types.ObjectId(),
      key: 'APO-7',
      title: 'Wire the billing export',
    });

    const session = await trackerDeviceService.startSession(
      userId,
      DEVICE_ID,
      new Date(),
      project._id.toHexString(),
      task._id.toHexString(),
    );

    expect(session).toMatchObject({
      status: 'active',
      projectId: project._id.toHexString(),
      projectName: 'Apollo',
      taskId: task._id.toHexString(),
      taskKey: 'APO-7',
      taskTitle: 'Wire the billing export',
    });
  });

  it('refuses an employee whose grant was revoked', async () => {
    const userId = await readyToTrack();
    await TrackerAccessModel.updateOne({ userId }, { isActive: false });

    await expect(codeOf(openSession(userId))).resolves.toBe('FORBIDDEN');
  });
});

describe('stopping a session', () => {
  it('closes the caller’s own session', async () => {
    const userId = await readyToTrack();
    const sessionId = await openSession(userId);

    const stopped = await trackerDeviceService.stopSession(userId, sessionId, ENDED);

    expect(stopped).toMatchObject({ status: 'stopped', endedAt: ENDED });
  });

  it('cannot stop somebody else’s session', async () => {
    const userId = await readyToTrack();
    const sessionId = await openSession(userId);

    const attempt = trackerDeviceService.stopSession(
      new Types.ObjectId().toHexString(),
      sessionId,
      ENDED,
    );

    await expect(attempt).rejects.toThrow('Session not found');
    await expect(TrackerSessionModel.findById(sessionId).lean()).resolves.toMatchObject({
      status: 'active',
    });
  });
});

describe('syncing intervals', () => {
  it('refuses an oversized batch before touching the database', async () => {
    const batch = Array.from({ length: TRACKER_LIMITS.maxIntervalsPerSync + 1 }, () => interval());

    await expect(trackerDeviceService.syncIntervals('u1', 'nope', batch)).rejects.toThrow(
      /Too many intervals/,
    );
  });

  it('refuses a session that is not the caller’s', async () => {
    const attempt = trackerDeviceService.syncIntervals('u1', new Types.ObjectId().toHexString(), [
      interval(),
    ]);

    await expect(codeOf(attempt)).resolves.toBe('NOT_FOUND');
  });

  it('records an interval with no input at all as 0% active, not a division by zero', async () => {
    const userId = await readyToTrack();
    const sessionId = await openSession(userId);

    await trackerDeviceService.syncIntervals(userId, sessionId, [
      interval({ activeMs: 0, idleMs: 0 }),
    ]);

    const stored = await TrackerIntervalModel.findOne({ sessionId }).lean();
    expect(stored?.activityPercent).toBe(0);
  });

  it('never stores a window title once the workspace switches titles off', async () => {
    const userId = await readyToTrack();
    const sessionId = await openSession(userId);
    await updateTrackerSettings({ trackWindowTitles: false });

    await trackerDeviceService.syncIntervals(userId, sessionId, [
      interval({
        windows: [{ appName: 'Mail', windowTitle: 'Salary review', durationMs: 60_000 }],
      }),
    ]);

    const usage = await TrackerWindowUsageModel.findOne({ sessionId }).lean();
    expect(usage).toMatchObject({ appName: 'Mail', windowTitle: '', durationMs: 60_000 });
  });

  it('stores an untitled window as an empty title while titles are on', async () => {
    const userId = await readyToTrack();
    const sessionId = await openSession(userId);

    await trackerDeviceService.syncIntervals(userId, sessionId, [
      interval({ windows: [{ appName: 'Terminal', durationMs: 30_000 }] }),
    ]);

    const usage = await TrackerWindowUsageModel.findOne({ sessionId }).lean();
    expect(usage).toMatchObject({ appName: 'Terminal', windowTitle: '' });
  });

  it('accepts an empty batch and leaves the session totals alone', async () => {
    const userId = await readyToTrack();
    const sessionId = await openSession(userId);

    await expect(trackerDeviceService.syncIntervals(userId, sessionId, [])).resolves.toBe(0);

    const session = await TrackerSessionModel.findById(sessionId).lean();
    expect(session).toMatchObject({ activeMs: 0, idleMs: 0, keyCount: 0 });
  });
});
