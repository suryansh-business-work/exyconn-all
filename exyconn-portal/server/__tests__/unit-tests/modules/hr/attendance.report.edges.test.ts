import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { AttendanceModel } from '../../../../src/modules/hr/attendance.model';
import { attendancePage } from '../../../../src/modules/hr/attendance.report';
import {
  TrackerAccessModel,
  TrackerManualEntryModel,
  TrackerSessionModel,
} from '../../../../src/modules/tracker/models';
import { FilterOp } from '../../../../src/graphql/generated/types';
import { TABLE_QUERY_LIMITS } from '../../../../src/utils/tableQuery';
import { currentOrganizationId } from '../../../../src/lib/tenant';

const HOUR = 3_600_000;
const PROJECT = new Types.ObjectId().toHexString();
const DAY_9 = new Date('2026-09-09T00:00:00.000Z');
const DAY_10 = new Date('2026-09-10T00:00:00.000Z');
const E1 = new Types.ObjectId().toHexString();

const page = (extra: Partial<Parameters<typeof attendancePage>[0]> = {}) =>
  attendancePage({ page: 0, pageSize: 25, ...extra });
const filter = (field: string, value: string) => ({ field, op: FilterOp.Equals, value });
const orgId = () => new Types.ObjectId(currentOrganizationId() ?? undefined);

async function employee(name: string) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase()}@example.com`,
    passwordHash: 'not-a-real-hash',
    roles: ['EMPLOYEE'],
  });
  return user._id.toHexString();
}

describe('attendance register edge cases', () => {
  it('names a record whose employee no longer exists by its id', async () => {
    const gone = new Types.ObjectId().toHexString();
    await AttendanceModel.create({ employeeId: gone, date: DAY_10, status: 'PRESENT' });

    const [row] = (await page()).rows;

    expect(row).toMatchObject({
      employeeName: gone,
      employeeEmail: '',
      designation: null,
      department: null,
    });
  });

  it('returns an empty page without asking the tracker anything', async () => {
    await expect(page({ filters: [filter('status', 'ABSENT')] })).resolves.toEqual({
      totalCount: 0,
      rows: [],
    });
  });

  it('refuses a date filter that is not a date', async () => {
    await expect(page({ filters: [filter('dateFrom', 'last week')] })).rejects.toThrow(
      'dateFrom must be a date (YYYY-MM-DD)',
    );
  });

  it('ignores a blank filter and a blank search', async () => {
    await AttendanceModel.create({ employeeId: E1, date: DAY_10, status: 'PRESENT' });

    const result = await page({ search: '   ', filters: [filter('dateTo', '  ')] });

    expect(result.totalCount).toBe(1);
  });

  it('refuses a search longer than the table allows', async () => {
    const search = 'x'.repeat(TABLE_QUERY_LIMITS.maxSearchLength + 1);

    await expect(page({ search })).rejects.toThrow(
      `Search is limited to ${TABLE_QUERY_LIMITS.maxSearchLength} characters`,
    );
  });

  it('honours a range open at either end', async () => {
    await AttendanceModel.create([
      { employeeId: E1, date: DAY_9, status: 'PRESENT' },
      { employeeId: E1, date: DAY_10, status: 'WFH' },
    ]);

    const from = await page({ filters: [filter('dateFrom', '2026-09-10')] });
    const to = await page({ filters: [filter('dateTo', '2026-09-09')] });

    expect(from.rows.map((row) => row.status)).toEqual(['WFH']);
    expect(to.rows.map((row) => row.status)).toEqual(['PRESENT']);
  });
});

describe('the tracker brief on a record', () => {
  let asha: string;

  beforeEach(async () => {
    asha = await employee('Asha');
    // Her tracker zone wins over her (empty) profile: 03:00 UTC on the 10th is the 9th in LA.
    await TrackerAccessModel.create({
      userId: asha,
      grantedBy: 'hr',
      timezone: 'America/Los_Angeles',
    });
    await AttendanceModel.create({ employeeId: asha, date: DAY_9, status: 'PRESENT' });
    // A running session from before projects and counters were stored: no end, no totals.
    await TrackerSessionModel.collection.insertOne({
      organizationId: orgId(),
      userId: asha,
      deviceId: 'dev-1',
      startedAt: new Date('2026-09-10T03:00:00.000Z'),
      status: 'active',
      projectId: PROJECT,
      projectName: 'Atlas',
    });
    // An approved off-computer entry stored without a project or a duration.
    await TrackerManualEntryModel.collection.insertOne({
      organizationId: orgId(),
      userId: asha,
      startedAt: new Date('2026-09-09T22:00:00.000Z'),
      endedAt: new Date('2026-09-09T23:00:00.000Z'),
      note: 'Workshop',
      status: 'APPROVED',
    });
  });

  it("files items under the employee's local day and reads missing totals as zero", async () => {
    const [row] = (await page()).rows;

    expect(row.tracker).toEqual({
      activeMs: 0,
      idleMs: 0,
      manualMs: 0,
      sessions: 1,
      firstStartedAt: new Date('2026-09-09T22:00:00.000Z'),
      lastEndedAt: new Date('2026-09-09T23:00:00.000Z'),
      projects: [
        { projectId: PROJECT, projectName: 'Atlas', activeMs: 0, manualMs: 0, sessions: 1 },
        { projectId: '', projectName: '', activeMs: 0, manualMs: 0, sessions: 0 },
      ],
    });
  });

  it('finds the project day from a range that is open at either end', async () => {
    const onProject = (bound: string, value: string) =>
      page({ filters: [filter('projectId', PROJECT), filter(bound, value)] });

    expect((await onProject('dateFrom', '2026-09-09')).totalCount).toBe(1);
    expect((await onProject('dateTo', '2026-09-09')).totalCount).toBe(1);
    expect((await onProject('dateFrom', '2026-09-20')).totalCount).toBe(0);
  });

  it('keeps an employee with a session but no attendance off the register', async () => {
    await TrackerSessionModel.create({
      userId: asha,
      deviceId: 'dev-1',
      startedAt: new Date('2026-09-12T15:00:00.000Z'),
      endedAt: new Date('2026-09-12T16:00:00.000Z'),
      status: 'stopped',
      projectId: PROJECT,
      projectName: 'Atlas',
      activeMs: HOUR,
    });

    expect((await page({ filters: [filter('projectId', PROJECT)] })).totalCount).toBe(1);
  });
});
