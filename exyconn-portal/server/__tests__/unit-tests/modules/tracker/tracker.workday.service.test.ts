import { Types } from 'mongoose';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
import { TaskModel } from '../../../../src/modules/projects/board.model';
import { PolicyModel } from '../../../../src/modules/legal/policy.model';
import { PolicyAcknowledgementModel } from '../../../../src/modules/legal/policy-acknowledgement.model';
import { TrackerManualEntryModel } from '../../../../src/modules/tracker/models';
import { GLOBAL_PROJECT } from '../../../../src/modules/tracker/tracker.constants';
import { trackerWorkdayService } from '../../../../src/modules/tracker/tracker.workday.service';
import { freezeClock } from '../../../helpers';

const ME = new Types.ObjectId().toHexString();
const COLLEAGUE = new Types.ObjectId().toHexString();

async function projectWithTasks() {
  const project = await ProjectModel.create({ name: 'Apollo', status: 'ACTIVE' });
  const task = (key: string, assigneeId: string) =>
    TaskModel.create({
      projectId: project._id,
      columnId: new Types.ObjectId(),
      key,
      title: `Work on ${key}`,
      assigneeId,
    });
  const theirs = await task('APO-1', COLLEAGUE);
  const mine = await task('APO-2', ME);
  return {
    projectId: project._id.toHexString(),
    theirs: theirs._id.toHexString(),
    mine: mine._id.toHexString(),
  };
}

describe('the ticket picker', () => {
  it('offers the employee’s own tickets first, then the rest of the board', async () => {
    const { projectId } = await projectWithTasks();

    const tasks = await trackerWorkdayService.tasksFor(ME, projectId, 100);

    expect(tasks.map((task) => [task.key, task.assignedToMe])).toEqual([
      ['APO-2', true],
      ['APO-1', false],
    ]);
  });

  it('caps the list at the limit it is given', async () => {
    const { projectId } = await projectWithTasks();

    await expect(trackerWorkdayService.tasksFor(ME, projectId, 1)).resolves.toHaveLength(1);
  });

  it('answers nothing for a project id that is not an object id', async () => {
    await expect(trackerWorkdayService.tasksFor(ME, 'GLBL', 100)).resolves.toEqual([]);
  });
});

describe('the ticket a session books against', () => {
  it('resolves a ticket on the same project', async () => {
    const { projectId, mine } = await projectWithTasks();

    await expect(trackerWorkdayService.bookableTask(projectId, mine)).resolves.toEqual({
      id: mine,
      key: 'APO-2',
      title: 'Work on APO-2',
    });
  });

  it('refuses a ticket from another project', async () => {
    const { mine } = await projectWithTasks();
    const other = new Types.ObjectId().toHexString();

    await expect(trackerWorkdayService.bookableTask(other, mine)).resolves.toBeNull();
  });

  it('resolves no ticket for a missing, malformed or unknown id', async () => {
    const { projectId } = await projectWithTasks();

    await expect(trackerWorkdayService.bookableTask(projectId)).resolves.toBeNull();
    await expect(trackerWorkdayService.bookableTask(projectId, 'EXY-14')).resolves.toBeNull();
    await expect(
      trackerWorkdayService.bookableTask(projectId, new Types.ObjectId().toHexString()),
    ).resolves.toBeNull();
  });
});

describe('the project a session books against', () => {
  it('resolves a bookable project by its id, and reuses the house-wide one', async () => {
    const { projectId } = await projectWithTasks();

    const chosen = await trackerWorkdayService.bookableProject(projectId);
    const fallback = await trackerWorkdayService.bookableProject(null);

    expect(chosen).toMatchObject({ id: projectId, name: 'Apollo' });
    expect(fallback.key).toBe(GLOBAL_PROJECT.key);
    await expect(ProjectModel.countDocuments({ key: GLOBAL_PROJECT.key })).resolves.toBe(1);
  });
});

describe('the tracking disclosure policy', () => {
  const publish = (overrides: Record<string, unknown> = {}) =>
    PolicyModel.create({
      title: 'Monitoring',
      slug: 'monitoring',
      summary: 'What is recorded',
      body: '<p>Counts and screenshots.</p>',
      status: 'PUBLISHED',
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      requiresAcknowledgement: true,
      ...overrides,
    });

  it('is none when the workspace has not chosen one', async () => {
    await expect(trackerWorkdayService.consentPolicy(ME, '  ')).resolves.toBeNull();
  });

  it('is none when the chosen slug is not a published policy', async () => {
    await publish({ status: 'DRAFT' });

    await expect(trackerWorkdayService.consentPolicy(ME, 'monitoring')).resolves.toBeNull();
  });

  it('reports the employee’s signature on the version now published', async () => {
    const policy = await publish();
    const signedAt = new Date('2026-02-01T10:00:00.000Z');
    await PolicyAcknowledgementModel.create({
      policyId: policy._id.toHexString(),
      policyTitle: 'Monitoring',
      version: 1,
      userId: ME,
      signedName: 'Me',
      signedAt,
    });

    const mine = await trackerWorkdayService.consentPolicy(ME, 'monitoring');
    const theirs = await trackerWorkdayService.consentPolicy(COLLEAGUE, 'monitoring');

    expect(mine).toMatchObject({
      id: policy._id.toHexString(),
      title: 'Monitoring',
      summary: 'What is recorded',
      version: 1,
      requiresAcknowledgement: true,
      acknowledged: true,
      acknowledgedAt: signedAt,
    });
    expect(theirs).toMatchObject({ acknowledged: false, acknowledgedAt: null });
  });
});

describe('today’s workday', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('carries approved off-computer time separately from measured time', async () => {
    freezeClock('2026-09-04T12:00:00.000Z');
    await TrackerManualEntryModel.create({
      userId: ME,
      startedAt: new Date('2026-09-04T10:00:00.000Z'),
      endedAt: new Date('2026-09-04T10:30:00.000Z'),
      durationMs: 30 * 60_000,
      note: 'Site visit',
      status: 'APPROVED',
    });

    const day = await trackerWorkdayService.workday(ME, { workHoursPerDay: 4 }, 'UTC');

    expect(day).toEqual({
      date: '2026-09-04',
      targetMs: 4 * 3_600_000,
      activeMs: 0,
      manualMs: 30 * 60_000,
      attendanceStatus: null,
      attendanceNote: null,
      attendanceMarked: false,
    });
  });
});
