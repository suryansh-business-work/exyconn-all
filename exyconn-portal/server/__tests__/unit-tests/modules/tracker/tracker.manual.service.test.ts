import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { TRACKER_MANUAL_LIMITS } from '../../../../src/modules/tracker/tracker.constants';
import { trackerManualService } from '../../../../src/modules/tracker/tracker.manual.service';
import { codeOf } from '../codeOf';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

async function employee(name: string) {
  const user = await UserModel.create({
    name,
    email: `${randomUUID()}@exyconn.com`,
    passwordHash: randomUUID(),
  });
  return user._id.toHexString();
}

/** A window that ended `endedAgoMs` ago and ran for `durationMs`. */
function window(durationMs: number, endedAgoMs = HOUR) {
  const endedAt = new Date(Date.now() - endedAgoMs);
  return { startedAt: new Date(endedAt.getTime() - durationMs), endedAt };
}

describe('filing off-computer time', () => {
  it('refuses an entry shorter than a minute', async () => {
    const attempt = trackerManualService.create(
      'u1',
      { ...window(30_000), note: 'Quick call' },
      undefined,
    );

    await expect(attempt).rejects.toThrow('An entry must cover at least a minute.');
  });

  it('refuses work claimed more than 90 days after it was done', async () => {
    const attempt = trackerManualService.create(
      'u1',
      { ...window(HOUR, TRACKER_MANUAL_LIMITS.maxBackdateMs), note: 'Old visit' },
      undefined,
    );

    await expect(attempt).rejects.toThrow(
      'Entries can only be claimed within 90 days of the work.',
    );
  });

  it('files an entry booked to no project, against a ticket, under the employee’s name', async () => {
    const userId = await employee('Asha Rao');
    const task = { id: new Types.ObjectId().toHexString(), key: 'EXY-14', title: 'Export hangs' };

    const entry = await trackerManualService.create(
      userId,
      { ...window(HOUR), note: '  Pairing at the whiteboard  ' },
      undefined,
      task,
    );

    expect(entry).toMatchObject({
      projectId: '',
      projectName: '',
      taskId: task.id,
      taskKey: 'EXY-14',
      taskTitle: 'Export hangs',
      note: 'Pairing at the whiteboard',
      userName: 'Asha Rao',
    });
  });
});

describe('reviewing off-computer time', () => {
  it('refuses an entry that does not exist', async () => {
    const attempt = trackerManualService.review(
      new Types.ObjectId().toHexString(),
      'APPROVED',
      'mgr',
    );

    await expect(codeOf(attempt)).resolves.toBe('NOT_FOUND');
  });

  it('records who decided, when, and the trimmed note', async () => {
    const userId = await employee('Dev Shah');
    const entry = await trackerManualService.create(
      userId,
      { ...window(HOUR), note: 'Customer visit' },
      { id: 'p1', name: 'Acme' },
    );

    const reviewed = await trackerManualService.review(
      String(entry._id),
      'REJECTED',
      'mgr-1',
      '  Already invoiced  ',
    );

    expect(reviewed).toMatchObject({
      status: 'REJECTED',
      reviewedBy: 'mgr-1',
      reviewNote: 'Already invoiced',
      userName: 'Dev Shah',
    });
    expect(reviewed.reviewedAt).toBeInstanceOf(Date);
  });
});

describe('reading off-computer time back', () => {
  it('names every employee on a mixed list, newest entry first', async () => {
    const asha = await employee('Asha Rao');
    await trackerManualService.create(asha, { ...window(HOUR, 3 * DAY), note: 'Older' }, undefined);
    await trackerManualService.create(asha, { ...window(HOUR), note: 'Newer' }, undefined);

    const entries = await trackerManualService.list(
      asha,
      new Date(Date.now() - 7 * DAY),
      new Date(),
    );

    expect(entries.map((entry) => [entry.note, entry.userName])).toEqual([
      ['Newer', 'Asha Rao'],
      ['Older', 'Asha Rao'],
    ]);
  });

  it('answers an empty list without looking anybody up', async () => {
    const lookup = jest.spyOn(UserModel, 'find');

    await expect(
      trackerManualService.list('u1', new Date(Date.now() - DAY), new Date()),
    ).resolves.toEqual([]);
    await expect(trackerManualService.listPending()).resolves.toEqual([]);
    expect(lookup).not.toHaveBeenCalled();
    lookup.mockRestore();
  });

  it('totals nothing for an employee with no approved time', async () => {
    await expect(trackerManualService.approvedTotal('nobody')).resolves.toBe(0);
    await expect(
      trackerManualService.approvedByUser(new Date(Date.now() - DAY), new Date()),
    ).resolves.toEqual(new Map());
  });
});
