import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { TrackerManualEntryModel } from '../../../../src/modules/tracker/models';
import { trackerTimeLogService } from '../../../../src/modules/tracker/tracker.timelog.service';

const HOUR = 3_600_000;
const PROJECT = new Types.ObjectId().toHexString();
const FROM = new Date('2026-09-01T00:00:00.000Z');
const TO = new Date('2026-09-30T00:00:00.000Z');
const STARTED = new Date('2026-09-04T09:00:00.000Z');

describe('a time-log row built from an approved claim written before ticket keys existed', () => {
  it('keeps the hours and shows the ticket with an empty key and title', async () => {
    const user = await UserModel.create({
      name: 'Asha',
      email: `${randomUUID()}@exyconn.com`,
      passwordHash: randomUUID(),
    });
    const taskId = new Types.ObjectId().toHexString();
    const entry = await TrackerManualEntryModel.create({
      userId: user._id.toHexString(),
      projectId: PROJECT,
      taskId,
      taskKey: 'PRJ-1',
      taskTitle: 'Workshop',
      startedAt: STARTED,
      endedAt: new Date(STARTED.getTime() + HOUR),
      durationMs: HOUR,
      note: 'Client workshop',
      status: 'APPROVED',
    });
    await TrackerManualEntryModel.updateOne(
      { _id: entry._id },
      { $unset: { taskKey: 1, taskTitle: 1 } },
    );

    const rows = await trackerTimeLogService.summary(PROJECT, FROM, TO);

    expect(rows).toEqual([
      expect.objectContaining({
        userName: 'Asha',
        taskId,
        taskKey: '',
        taskTitle: '',
        manualMs: HOUR,
        activeMs: 0,
      }),
    ]);
  });

  it('files a claim written before tickets existed under no ticket at all', async () => {
    const user = await UserModel.create({
      name: 'Dev',
      email: `${randomUUID()}@exyconn.com`,
      passwordHash: randomUUID(),
    });
    const entry = await TrackerManualEntryModel.create({
      userId: user._id.toHexString(),
      projectId: PROJECT,
      startedAt: STARTED,
      endedAt: new Date(STARTED.getTime() + HOUR),
      durationMs: HOUR,
      note: 'Client workshop',
      status: 'APPROVED',
    });
    await TrackerManualEntryModel.updateOne(
      { _id: entry._id },
      { $unset: { taskId: 1, taskKey: 1, taskTitle: 1 } },
    );

    const rows = await trackerTimeLogService.summary(PROJECT, FROM, TO);

    expect(rows).toEqual([
      expect.objectContaining({
        userName: 'Dev',
        taskId: '',
        taskKey: '',
        taskTitle: '',
        manualMs: HOUR,
      }),
    ]);
  });
});
