import { Types } from 'mongoose';
import { UserModel } from '../../src/modules/admin/user.model';
import { AttendanceModel } from '../../src/modules/hr/attendance.model';
import { attendancePage } from '../../src/modules/hr/attendance.report';
import { TrackerManualEntryModel, TrackerSessionModel } from '../../src/modules/tracker/models';
import { FilterOp } from '../../src/graphql/generated/types';
import { currentOrganizationId } from '../../src/lib/tenant';

const HOUR = 3_600_000;
const ACME = new Types.ObjectId().toString();
const BETA = new Types.ObjectId().toString();
/** Attendance is keyed at midnight UTC of the employee's local day. */
const DAY = new Date('2026-09-10T00:00:00.000Z');
const NEXT_DAY = new Date('2026-09-11T00:00:00.000Z');

const page = (extra: Partial<Parameters<typeof attendancePage>[0]> = {}) =>
  attendancePage({ page: 0, pageSize: 25, ...extra });

const filter = (field: string, value: string) => ({ field, op: FilterOp.Equals, value });

async function employee(name: string, timezone: string | null = null) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`,
    passwordHash: 'not-a-real-hash',
    roles: ['EMPLOYEE'],
    designation: 'Engineer',
    timezone,
  });
  return String(user._id);
}

async function session(userId: string, projectId: string, startedAt: string, activeMs: number) {
  const start = new Date(startedAt);
  await TrackerSessionModel.create({
    userId,
    deviceId: 'dev-1',
    startedAt: start,
    endedAt: new Date(start.getTime() + activeMs),
    status: 'stopped',
    projectId,
    projectName: projectId === ACME ? 'Acme' : 'Beta',
    activeMs,
    idleMs: 0,
  });
}

async function manual(userId: string, startedAt: string, durationMs: number, status: string) {
  const start = new Date(startedAt);
  await TrackerManualEntryModel.create({
    userId,
    projectId: ACME,
    projectName: 'Acme',
    startedAt: start,
    endedAt: new Date(start.getTime() + durationMs),
    durationMs,
    note: 'Client call',
    status,
  });
}

describe('HR attendance register', () => {
  let asha: string;
  let ben: string;

  beforeEach(async () => {
    asha = await employee('Asha Rao', 'Asia/Kolkata');
    ben = await employee('Ben Cole');
    await AttendanceModel.create([
      { employeeId: asha, date: DAY, status: 'PRESENT', note: 'On site' },
      { employeeId: asha, date: NEXT_DAY, status: 'WFH' },
      { employeeId: ben, date: DAY, status: 'ABSENT' },
    ]);
    // 20:00 UTC on the 9th is 01:30 on the 10th in Kolkata — Asha's 10th, not her 9th.
    await session(asha, ACME, '2026-09-09T20:00:00.000Z', 2 * HOUR);
    await session(asha, BETA, '2026-09-10T05:00:00.000Z', HOUR);
    await session(asha, BETA, '2026-09-11T05:00:00.000Z', HOUR);
    await manual(asha, '2026-09-10T08:00:00.000Z', HOUR / 2, 'APPROVED');
    await manual(asha, '2026-09-10T09:00:00.000Z', 4 * HOUR, 'PENDING');
  });

  it("joins each record to the employee and that local day's tracker brief", async () => {
    const result = await page();
    const row = result.rows.find((r) => r.employeeId === asha && r.status === 'PRESENT');

    expect(result.totalCount).toBe(3);
    expect(row).toMatchObject({ employeeName: 'Asha Rao', designation: 'Engineer' });
    expect(row?.tracker).toMatchObject({ activeMs: 3 * HOUR, manualMs: HOUR / 2, sessions: 2 });
    expect(row?.tracker.projects.map((p) => [p.projectName, p.activeMs, p.manualMs])).toEqual([
      ['Acme', 2 * HOUR, HOUR / 2],
      ['Beta', HOUR, 0],
    ]);
    expect(row?.tracker.firstStartedAt).toEqual(new Date('2026-09-09T20:00:00.000Z'));
  });

  it('reads a session recorded before projects existed as time with no project', async () => {
    // Written straight to the collection, as those sessions were: no project fields at all.
    await TrackerSessionModel.collection.insertOne({
      organizationId: new Types.ObjectId(currentOrganizationId() ?? undefined),
      userId: ben,
      deviceId: 'dev-2',
      startedAt: new Date('2026-09-10T06:00:00.000Z'),
      endedAt: new Date('2026-09-10T07:00:00.000Z'),
      status: 'stopped',
      activeMs: HOUR,
      idleMs: 0,
      keyCount: 0,
      mouseCount: 0,
    });

    const result = await page({ filters: [filter('employeeId', ben)] });

    expect(result.rows[0].tracker.projects).toEqual([
      { projectId: '', projectName: '', activeMs: HOUR, manualMs: 0, sessions: 1 },
    ]);
  });

  it('gives an untracked day an empty brief', async () => {
    const result = await page({ filters: [filter('employeeId', ben)] });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].tracker).toMatchObject({ activeMs: 0, sessions: 0, projects: [] });
  });

  it("searches the employee's name and the note", async () => {
    expect((await page({ search: 'ben' })).rows.map((r) => r.employeeId)).toEqual([ben]);
    expect((await page({ search: 'on site' })).totalCount).toBe(1);
  });

  it('filters by status and an inclusive date range', async () => {
    expect((await page({ filters: [filter('status', 'WFH')] })).totalCount).toBe(1);
    const range = [filter('dateFrom', '2026-09-10'), filter('dateTo', '2026-09-10')];
    expect((await page({ filters: range })).totalCount).toBe(2);
  });

  it('keeps only the days someone tracked time on the chosen project', async () => {
    const acme = await page({ filters: [filter('projectId', ACME)] });
    const beta = await page({ filters: [filter('projectId', BETA)] });

    expect(acme.rows.map((r) => r.date)).toEqual([DAY]);
    expect(beta.totalCount).toBe(2);
    expect(beta.rows.every((r) => r.employeeId === asha)).toBe(true);
  });

  it('matches nothing for a project nobody tracked on', async () => {
    const result = await page({ filters: [filter('projectId', new Types.ObjectId().toString())] });

    expect(result.totalCount).toBe(0);
  });

  it('refuses a range that ends before it starts', async () => {
    const range = [filter('dateFrom', '2026-09-11'), filter('dateTo', '2026-09-10')];

    await expect(page({ filters: range })).rejects.toThrow('on or before');
  });
});
