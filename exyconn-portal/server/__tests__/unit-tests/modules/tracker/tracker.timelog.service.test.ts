import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import {
  TrackerIntervalModel,
  TrackerManualEntryModel,
  TrackerScreenshotModel,
  TrackerSessionModel,
} from '../../../../src/modules/tracker/models';
import { trackerTimeLogService } from '../../../../src/modules/tracker/tracker.timelog.service';

const HOUR = 3_600_000;
const PROJECT = new Types.ObjectId().toString();
const FROM = new Date('2026-09-01T00:00:00.000Z');
const TO = new Date('2026-09-30T00:00:00.000Z');

async function employee(name: string) {
  const user = await UserModel.create({
    name,
    email: `${randomUUID()}@exyconn.com`,
    passwordHash: randomUUID(),
  });
  return String(user._id);
}

function session(userId: string, startedAt: string, endedAt: Date | null = null) {
  return TrackerSessionModel.create({
    userId,
    deviceId: 'd1',
    startedAt: new Date(startedAt),
    endedAt,
    status: endedAt ? 'stopped' : 'active',
    projectId: PROJECT,
  });
}

describe('the drill-down', () => {
  it('lists every run on the project, newest first, when no row is picked', async () => {
    const asha = await employee('Asha');
    const gone = new Types.ObjectId().toString();
    const older = await session(asha, '2026-09-03T09:00:00.000Z', new Date('2026-09-03T10:00:00Z'));
    await TrackerIntervalModel.create({
      userId: asha,
      sessionId: String(older._id),
      startedAt: new Date('2026-09-03T09:00:00.000Z'),
      endedAt: new Date('2026-09-03T09:10:00.000Z'),
      activeMs: HOUR,
      idleMs: 60_000,
    });
    await TrackerScreenshotModel.create({
      userId: asha,
      sessionId: String(older._id),
      intervalStartedAt: new Date('2026-09-03T09:00:00.000Z'),
      capturedAt: new Date('2026-09-03T09:05:00.000Z'),
      imageUrl: 'https://ik.example/a.png',
    });
    // Still running, and written before ticket fields existed: no endedAt, no ticket at all.
    const running = await TrackerSessionModel.collection.insertOne({
      userId: gone,
      deviceId: 'd1',
      startedAt: new Date('2026-09-04T09:00:00.000Z'),
      status: 'active',
      projectId: PROJECT,
    });

    const runs = await trackerTimeLogService.sessions(PROJECT, FROM, TO);

    expect(runs).toEqual([
      expect.objectContaining({
        id: String(running.insertedId),
        userName: 'Deleted employee',
        taskKey: '',
        taskTitle: '',
        endedAt: null,
        activeMs: 0,
        idleMs: 0,
        screenshotCount: 0,
      }),
      expect.objectContaining({
        id: String(older._id),
        userName: 'Asha',
        activeMs: HOUR,
        idleMs: 60_000,
        screenshotCount: 1,
      }),
    ]);
  });

  it('answers nothing for a project with no runs in the window', async () => {
    await expect(trackerTimeLogService.sessions(PROJECT, FROM, TO, null, null)).resolves.toEqual(
      [],
    );
  });
});

describe('the summary', () => {
  it('credits time to a deleted account rather than dropping it', async () => {
    const gone = new Types.ObjectId().toString();
    await session(gone, '2026-09-03T09:00:00.000Z', new Date('2026-09-03T10:00:00Z'));

    const [row] = await trackerTimeLogService.summary(PROJECT, FROM, TO);

    expect(row).toMatchObject({
      id: `${gone}:`,
      userName: 'Deleted employee',
      sessions: 1,
      activeMs: 0,
      screenshots: 0,
    });
  });

  it('reads sessions and claims stored without ticket fields as booked to no ticket', async () => {
    // Raw inserts skip the schema defaults, which is how rows older than tickets look.
    const userId = await employee('Asha');
    await TrackerSessionModel.collection.insertOne({
      userId,
      deviceId: 'd1',
      startedAt: new Date('2026-09-03T09:00:00.000Z'),
      status: 'stopped',
      projectId: PROJECT,
    });
    await TrackerManualEntryModel.collection.insertOne({
      userId,
      projectId: PROJECT,
      startedAt: new Date('2026-09-04T09:00:00.000Z'),
      endedAt: new Date('2026-09-04T10:00:00.000Z'),
      durationMs: HOUR,
      note: 'Planning',
      status: 'APPROVED',
    });

    const rows = await trackerTimeLogService.summary(PROJECT, FROM, TO);

    expect(rows).toEqual([
      expect.objectContaining({
        id: `${userId}:`,
        taskId: '',
        taskKey: '',
        taskTitle: '',
        sessions: 1,
        manualMs: HOUR,
      }),
    ]);
  });

  it('answers an empty log for a project nobody worked on', async () => {
    await expect(trackerTimeLogService.summary(PROJECT, FROM, TO)).resolves.toEqual([]);
  });
});

describe('a session’s screenshots', () => {
  it('returns each shot in capture order with its blur flag', async () => {
    const asha = await employee('Asha');
    const run = await session(asha, '2026-09-03T09:00:00.000Z');
    const shot = (minute: number, blurred: boolean) =>
      TrackerScreenshotModel.create({
        userId: asha,
        sessionId: String(run._id),
        intervalStartedAt: new Date('2026-09-03T09:00:00.000Z'),
        capturedAt: new Date(Date.UTC(2026, 8, 3, 9, minute)),
        imageUrl: `https://ik.example/${minute}.png`,
        blurred,
      });
    await shot(7, false);
    await shot(2, true);

    const shots = await trackerTimeLogService.screenshots(PROJECT, String(run._id));

    expect(shots.map((s) => [s.imageUrl, s.blurred])).toEqual([
      ['https://ik.example/2.png', true],
      ['https://ik.example/7.png', false],
    ]);
  });
});
