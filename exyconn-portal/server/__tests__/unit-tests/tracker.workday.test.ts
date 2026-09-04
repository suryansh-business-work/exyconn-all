import { AttendanceModel } from '../../src/modules/hr/attendance.model';
import { ProjectModel } from '../../src/modules/projects/projects.model';
import { TrackerIntervalModel } from '../../src/modules/tracker/models';
import { GLOBAL_PROJECT } from '../../src/modules/tracker/tracker.constants';
import {
  trackerWorkdayService,
  workProfile,
} from '../../src/modules/tracker/tracker.workday.service';
import { zonedDateKey, zonedDayStartUtc } from '../../src/modules/tracker/tracker.timezone';
import { DEFAULT_WORK_HOURS_PER_DAY } from '../../src/constants/work';

const KOLKATA = 'Asia/Kolkata';
const HOUR_MS = 3_600_000;

describe('the working arrangement', () => {
  it('falls back to the house defaults for an account that predates the fields', () => {
    // `.lean()` skips Mongoose defaults, so a user document written before the working
    // arrangement existed comes back with none of it — and the tracker's non-nullable work
    // profile would fail to serialize. Defaults are applied on read for exactly that reason.
    const profile = workProfile({});

    expect(profile.workingTime).toBe('FLEXIBLE');
    expect(profile.workLocation).toBe('OFFICE');
    expect(profile.workHoursPerDay).toBe(DEFAULT_WORK_HOURS_PER_DAY);
    expect(profile.targetMs).toBe(DEFAULT_WORK_HOURS_PER_DAY * HOUR_MS);
  });

  it('turns the contracted hours into the milliseconds the tracker measures in', () => {
    expect(workProfile({ workHoursPerDay: 6 }).targetMs).toBe(6 * HOUR_MS);
  });
});

describe('the employee’s local day', () => {
  it('reads a late-evening UTC instant as the NEXT day in a zone that is ahead', () => {
    // 19:00 UTC is already half past midnight in Kolkata. Bucketing that on the UTC date
    // would put an employee's first half-hour of work on the day before they did it.
    const instant = new Date('2026-09-04T19:00:00.000Z');

    expect(zonedDateKey(instant, KOLKATA)).toBe('2026-09-05');
    expect(zonedDayStartUtc(instant, KOLKATA).toISOString()).toBe('2026-09-05T00:00:00.000Z');
  });

  it('agrees with UTC for an instant in the middle of the UTC day', () => {
    const instant = new Date('2026-09-04T09:00:00.000Z');
    expect(zonedDateKey(instant, 'UTC')).toBe('2026-09-04');
  });
});

describe('today’s progress', () => {
  it('sums only the intervals that fall on the employee’s own day', async () => {
    const today = zonedDateKey(new Date(), KOLKATA);
    await TrackerIntervalModel.create([
      {
        userId: 'u1',
        sessionId: 's1',
        startedAt: new Date(),
        endedAt: new Date(),
        activeMs: 90 * 60_000,
        idleMs: 0,
        keyCount: 0,
        mouseCount: 0,
        activityPercent: 100,
      },
      // Another employee's work must never reach this employee's bar.
      {
        userId: 'u2',
        sessionId: 's2',
        startedAt: new Date(),
        endedAt: new Date(),
        activeMs: 45 * 60_000,
        idleMs: 0,
        keyCount: 0,
        mouseCount: 0,
        activityPercent: 100,
      },
    ]);

    const activeMs = await trackerWorkdayService.activeMsOn('u1', KOLKATA, today);

    expect(activeMs).toBe(90 * 60_000);
  });

  it('reports nothing for a day the employee did not work', async () => {
    await expect(trackerWorkdayService.activeMsOn('u1', KOLKATA, '1999-01-01')).resolves.toBe(0);
  });
});

describe('attendance from the desktop app', () => {
  it('upserts one record per day, so marking in twice does not double the day', async () => {
    const day = zonedDayStartUtc(new Date(), KOLKATA);

    await trackerWorkdayService.markAttendance('u1', day, 'PRESENT', null);
    await trackerWorkdayService.markAttendance('u1', day, 'WFH', 'From home today');

    const records = await AttendanceModel.find({ employeeId: 'u1' }).lean();
    expect(records).toHaveLength(1);
    expect(records[0].status).toBe('WFH');
    expect(records[0].note).toBe('From home today');
  });
});

describe('bookable projects', () => {
  it('creates the house-wide project on demand and offers it first', async () => {
    await ProjectModel.create({ name: 'Apollo', status: 'ACTIVE' });

    const projects = await trackerWorkdayService.projects();

    expect(projects[0].key).toBe(GLOBAL_PROJECT.key);
    expect(projects.map((project) => project.name)).toContain('Apollo');
  });

  it('does not offer a finished project', async () => {
    await ProjectModel.create({ name: 'Done', status: 'COMPLETED' });

    const projects = await trackerWorkdayService.projects();

    expect(projects.map((project) => project.name)).not.toContain('Done');
  });

  it('falls back to the house-wide project when the requested one is not bookable', async () => {
    // Losing the time because a project was archived would be worse than booking it here.
    const project = await trackerWorkdayService.bookableProject('nope');

    expect(project.key).toBe(GLOBAL_PROJECT.key);
  });
});
