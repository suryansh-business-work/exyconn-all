import { Types } from 'mongoose';
import { TrackerManualEntryModel } from '../../src/modules/tracker/models';
import { trackerManualService } from '../../src/modules/tracker/tracker.manual.service';

// A real ObjectId string: userId is what ctx.user.id holds, and withNames looks it up in
// the User collection. A made-up id would not survive that cast.
const EMPLOYEE = new Types.ObjectId().toString();
const OTHER = new Types.ObjectId().toString();

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const PROJECT = { id: 'p1', name: 'Acme rollout' };

/** A window that ended `endedAgoMs` ago and ran for `durationMs`. */
function window(durationMs: number, endedAgoMs = HOUR) {
  const endedAt = new Date(Date.now() - endedAgoMs);
  return { startedAt: new Date(endedAt.getTime() - durationMs), endedAt };
}

async function claim(durationMs = 2 * HOUR, note = 'Client kickoff meeting') {
  return trackerManualService.create(EMPLOYEE, { ...window(durationMs), note }, PROJECT);
}

describe('off-computer time entries', () => {
  beforeEach(async () => {
    await TrackerManualEntryModel.deleteMany({});
  });

  it('files a claim as pending, with the duration derived from the window', async () => {
    const entry = await claim(2 * HOUR);

    expect(entry.status).toBe('PENDING');
    expect(entry.durationMs).toBe(2 * HOUR);
    expect(entry.projectName).toBe('Acme rollout');
  });

  it('refuses a window that ends before it starts', async () => {
    const { startedAt, endedAt } = window(HOUR);
    await expect(
      trackerManualService.create(
        EMPLOYEE,
        { startedAt: endedAt, endedAt: startedAt, note: 'x' },
        PROJECT,
      ),
    ).rejects.toThrow(/end after it starts/i);
  });

  it('refuses time that has not been worked yet', async () => {
    const startedAt = new Date(Date.now() + HOUR);
    await expect(
      trackerManualService.create(
        EMPLOYEE,
        { startedAt, endedAt: new Date(startedAt.getTime() + HOUR), note: 'x' },
        PROJECT,
      ),
    ).rejects.toThrow(/before it has been worked/i);
  });

  it('refuses a single entry longer than a working day', async () => {
    await expect(claim(20 * HOUR)).rejects.toThrow(/more than 16 hours/i);
  });

  it('refuses a claim with no explanation', async () => {
    await expect(claim(HOUR, '   ')).rejects.toThrow(/what the time was for/i);
  });

  it('counts nothing until an entry is approved', async () => {
    const entry = await claim(2 * HOUR);
    expect(await trackerManualService.approvedTotal(EMPLOYEE)).toBe(0);

    await trackerManualService.review(String(entry._id), 'APPROVED', 'mgr');

    expect(await trackerManualService.approvedTotal(EMPLOYEE)).toBe(2 * HOUR);
  });

  it('leaves a rejected entry out of every total', async () => {
    const entry = await claim(2 * HOUR);
    await trackerManualService.review(String(entry._id), 'REJECTED', 'mgr', 'Already invoiced');

    expect(await trackerManualService.approvedTotal(EMPLOYEE)).toBe(0);
  });

  it('refuses to re-decide an entry that was already reviewed', async () => {
    const entry = await claim();
    await trackerManualService.review(String(entry._id), 'APPROVED', 'mgr');

    await expect(trackerManualService.review(String(entry._id), 'REJECTED', 'mgr')).rejects.toThrow(
      /already approved/i,
    );
  });

  it('will not let a review leave an entry pending', async () => {
    const entry = await claim();
    await expect(trackerManualService.review(String(entry._id), 'PENDING', 'mgr')).rejects.toThrow(
      /approve or reject/i,
    );
  });

  it('lets an employee withdraw their own pending claim, but not an approved one', async () => {
    const pending = await claim();
    await expect(trackerManualService.withdraw(String(pending._id), EMPLOYEE)).resolves.toBe(true);

    const approved = await claim();
    await trackerManualService.review(String(approved._id), 'APPROVED', 'mgr');
    await expect(trackerManualService.withdraw(String(approved._id), EMPLOYEE)).rejects.toThrow(
      /only a pending entry/i,
    );
  });

  it("will not let one employee withdraw another's claim", async () => {
    const entry = await claim();
    await expect(trackerManualService.withdraw(String(entry._id), OTHER)).rejects.toThrow(
      /not found/i,
    );
  });

  it('buckets approved time by the employee local day, and bills only the approved', async () => {
    const approved = await claim(3 * HOUR);
    await trackerManualService.review(String(approved._id), 'APPROVED', 'mgr');
    await claim(5 * HOUR);

    const from = new Date(Date.now() - 2 * 24 * HOUR);
    const to = new Date(Date.now() + 24 * HOUR);

    const days = await trackerManualService.approvedByDay(EMPLOYEE, from, to, 'Asia/Kolkata');
    expect(days.reduce((sum, day) => sum + day.manualMs, 0)).toBe(3 * HOUR);

    const byUser = await trackerManualService.approvedByUser(from, to);
    expect(byUser.get(EMPLOYEE)).toBe(3 * HOUR);
  });

  it('shows the review queue oldest first, with each employee named', async () => {
    await claim(HOUR, 'Older visit');
    await TrackerManualEntryModel.updateMany(
      {},
      { startedAt: new Date(Date.now() - 5 * 24 * HOUR) },
    );
    await claim(HOUR, 'Newer visit');

    const queue = await trackerManualService.withNames(await trackerManualService.listPending());

    expect(queue).toHaveLength(2);
    expect(queue[0].note).toBe('Older visit');
    expect(queue[0].userName).toBe('Deleted employee');
  });
});
