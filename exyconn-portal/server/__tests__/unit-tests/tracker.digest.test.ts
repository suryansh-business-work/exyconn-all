import { Types } from 'mongoose';
import { UserModel } from '../../src/modules/admin/user.model';
import { TrackerIntervalModel, TrackerManualEntryModel } from '../../src/modules/tracker/models';
import {
  buildDigest,
  dailyWindow,
  isDigestDue,
  renderDigestRows,
} from '../../src/modules/tracker/tracker.digest';

const HOUR = 3_600_000;

async function employee(name: string) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`,
    passwordHash: 'not-a-real-hash',
    roles: ['EMPLOYEE'],
  });
  return String(user._id);
}

async function tracked(userId: string, activeMs: number) {
  await TrackerIntervalModel.create({
    userId,
    sessionId: new Types.ObjectId().toString(),
    startedAt: new Date(Date.now() - 2 * HOUR),
    endedAt: new Date(Date.now() - HOUR),
    activeMs,
    idleMs: 0,
    activityPercent: 80,
  });
}

async function approvedManual(userId: string, durationMs: number) {
  await TrackerManualEntryModel.create({
    userId,
    startedAt: new Date(Date.now() - 3 * HOUR),
    endedAt: new Date(Date.now() - 3 * HOUR + durationMs),
    durationMs,
    note: 'Client meeting',
    status: 'APPROVED',
  });
}

describe('tracker digest', () => {
  beforeEach(async () => {
    await Promise.all([
      TrackerIntervalModel.deleteMany({}),
      TrackerManualEntryModel.deleteMany({}),
      UserModel.deleteMany({}),
    ]);
  });

  const window = () => ({ from: new Date(Date.now() - 24 * HOUR), to: new Date() });

  it('ranks employees by everything they worked, tracked and claimed together', async () => {
    const quiet = await employee('Quiet Worker');
    const busy = await employee('Busy Worker');
    await tracked(quiet, 6 * HOUR);
    await tracked(busy, 2 * HOUR);
    await approvedManual(busy, 5 * HOUR);

    const { from, to } = window();
    const digest = await buildDigest(from, to, 'today');

    expect(digest.rows.map((row) => row.name)).toEqual(['Busy Worker', 'Quiet Worker']);
    expect(digest.totalHours).toBe(13);
  });

  it('includes somebody whose whole day was off-computer', async () => {
    const userId = await employee('Meeting Person');
    await approvedManual(userId, 4 * HOUR);

    const { from, to } = window();
    const digest = await buildDigest(from, to, 'today');

    expect(digest.rows).toEqual([{ name: 'Meeting Person', activeMs: 0, manualMs: 4 * HOUR }]);
  });

  it('leaves out an employee who tracked nothing, rather than listing a zero', async () => {
    await employee('Absent Person');
    const worker = await employee('Worker');
    await tracked(worker, HOUR);

    const { from, to } = window();
    const digest = await buildDigest(from, to, 'today');

    expect(digest.rows).toHaveLength(1);
    expect(digest.rows[0].name).toBe('Worker');
  });

  it('reports an empty period honestly rather than failing', async () => {
    const { from, to } = window();
    await expect(buildDigest(from, to, 'today')).resolves.toEqual({
      periodLabel: 'today',
      rows: [],
      totalHours: 0,
    });
  });

  it('escapes an employee name so it cannot inject markup into the email', () => {
    const html = renderDigestRows([
      { name: '<script>alert(1)</script>', activeMs: HOUR, manualMs: 0 },
    ]);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('says so when nothing was tracked', () => {
    expect(renderDigestRows([])).toContain('No time was tracked');
  });

  describe('due check', () => {
    const clock = { hour: 9, dateKey: '2026-09-04' };

    it('does not fire while the digest is switched off', () => {
      expect(isDigestDue(false, 9, '', clock)).toBe(false);
    });

    it('does not fire before the chosen hour', () => {
      expect(isDigestDue(true, 9, '', { ...clock, hour: 8 })).toBe(false);
    });

    it('still fires after the chosen hour, so a restart does not skip the day', () => {
      expect(isDigestDue(true, 9, '', { ...clock, hour: 14 })).toBe(true);
    });

    it('never sends the same day twice', () => {
      expect(isDigestDue(true, 9, '2026-09-04', clock)).toBe(false);
      expect(isDigestDue(true, 9, '2026-09-03', clock)).toBe(true);
    });
  });

  it('labels the daily window with the day that just ended', () => {
    const now = new Date('2026-09-04T09:00:00.000Z');
    expect(dailyWindow(now, 'UTC').label).toBe('on 2026-09-03');
  });
});
