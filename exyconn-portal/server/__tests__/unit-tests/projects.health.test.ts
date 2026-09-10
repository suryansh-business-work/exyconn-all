import { ProjectModel } from '../../src/modules/projects/projects.model';
import { BoardColumnModel, TaskModel } from '../../src/modules/projects/board.model';
import { BugModel } from '../../src/modules/bugs/bugs.model';
import { projectHealth, projectHealthOverview } from '../../src/modules/projects/projects.health';

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const NOW = day('2026-06-15');

interface ProjectOver {
  name?: string;
  status?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  budgetHours?: number | null;
}

const project = (over: ProjectOver = {}) =>
  ProjectModel.create({
    name: 'Website Redesign',
    status: 'ACTIVE',
    startDate: day('2026-06-01'),
    endDate: day('2026-06-30'),
    ...over,
  });

const column = (projectId: unknown, name: string, isDone = false) =>
  BoardColumnModel.create({ projectId, name, order: 0, isDone });

const task = (projectId: unknown, columnId: unknown, assigneeId = '') =>
  TaskModel.create({
    projectId,
    columnId,
    key: `WEB-${Math.random().toString(36).slice(2, 7)}`,
    title: 'Something to do',
    assigneeId,
  });

/** `projectHealth` takes the lean shape the resolver selects. */
const leanOf = async (id: unknown) =>
  ProjectModel.findById(id)
    .select('name key status clientName startDate endDate budgetHours')
    .lean();

async function healthOf(id: unknown, now = NOW) {
  const lean = await leanOf(id);
  if (!lean) throw new Error('project vanished');
  return projectHealth(lean, now);
}

describe('project progress', () => {
  it('counts only the tickets sitting in a done column', async () => {
    const p = await project();
    const todo = await column(p._id, 'To do');
    const done = await column(p._id, 'Done', true);
    await task(p._id, todo);
    await task(p._id, todo);
    await task(p._id, done);

    const health = await healthOf(p._id);

    expect(health.taskCount).toBe(3);
    expect(health.doneTaskCount).toBe(1);
    expect(health.progressPercent).toBeCloseTo(33.3, 0);
  });

  it('reports null, not zero, when no column is marked done', async () => {
    const p = await project();
    const todo = await column(p._id, 'To do');
    await task(p._id, todo);

    const health = await healthOf(p._id);

    // 0% would read as "nothing done" rather than "nobody told us what done means".
    expect(health.progressPercent).toBeNull();
  });

  it('counts the people who actually hold a ticket', async () => {
    const p = await project();
    const todo = await column(p._id, 'To do');
    await task(p._id, todo, 'u1');
    await task(p._id, todo, 'u1');
    await task(p._id, todo, 'u2');
    await task(p._id, todo);

    expect((await healthOf(p._id)).teamSize).toBe(2);
  });

  it('leaves resolved and closed bugs out of the open count', async () => {
    const p = await project();
    const id = String(p._id);
    const bug = (title: string, status: string) =>
      BugModel.create({
        title,
        description: 'Steps to reproduce are in the ticket.',
        dueDate: day('2026-07-01'),
        projectId: id,
        status,
      });
    await bug('Broken', 'OPEN');
    await bug('Also broken', 'IN_PROGRESS');
    await bug('Fixed', 'RESOLVED');
    await bug('Shipped', 'CLOSED');

    expect((await healthOf(p._id)).openBugCount).toBe(2);
  });
});

describe('project timeline', () => {
  it('is overdue past its end date', async () => {
    const p = await project({ endDate: day('2026-06-01') });
    expect((await healthOf(p._id)).timeline).toBe('OVERDUE');
  });

  it('is due soon inside the last week', async () => {
    const p = await project({ endDate: day('2026-06-18') });
    expect((await healthOf(p._id)).timeline).toBe('DUE_SOON');
  });

  it('is on track with room left', async () => {
    const p = await project({ endDate: day('2026-08-01') });
    expect((await healthOf(p._id)).timeline).toBe('ON_TRACK');
  });

  it('has nothing to be late for without an end date', async () => {
    const p = await project({ endDate: null });
    expect((await healthOf(p._id)).timeline).toBe('NO_DATES');
  });

  it('reads as completed whatever the dates say', async () => {
    const p = await project({ status: 'COMPLETED', endDate: day('2026-06-01') });
    expect((await healthOf(p._id)).timeline).toBe('COMPLETED');
  });
});

describe('project risk', () => {
  it('is low when nothing is wrong', async () => {
    const p = await project({ endDate: day('2026-08-01') });
    const done = await column(p._id, 'Done', true);
    await task(p._id, done);

    const health = await healthOf(p._id);

    expect(health.risk).toBe('LOW');
    expect(health.riskReasons).toEqual([]);
  });

  it('is medium on a single problem, and says which', async () => {
    const p = await project({ endDate: day('2026-06-01') });
    const done = await column(p._id, 'Done', true);
    await task(p._id, done);

    const health = await healthOf(p._id);

    expect(health.risk).toBe('MEDIUM');
    expect(health.riskReasons).toEqual(['Past its end date']);
  });

  it('is high once two things are wrong at once', async () => {
    // A real span, so "behind schedule" has a calendar to be behind.
    const p = await project({ startDate: day('2026-05-01'), endDate: day('2026-06-01') });
    const todo = await column(p._id, 'To do');
    const done = await column(p._id, 'Done', true);
    await task(p._id, todo);
    await task(p._id, todo);
    await task(p._id, todo);
    await task(p._id, done);

    const health = await healthOf(p._id);

    expect(health.risk).toBe('HIGH');
    expect(health.riskReasons).toEqual([
      'Past its end date',
      'Behind where the calendar says it should be',
    ]);
  });

  it('is unknown, not low, when nothing measurable was set up', async () => {
    const p = await project({ startDate: null, endDate: null, budgetHours: null });

    const health = await healthOf(p._id);

    // Silence is not good news.
    expect(health.risk).toBe('UNKNOWN');
  });
});

describe('the portfolio view', () => {
  it('puts the projects in trouble first', async () => {
    const healthy = await project({ name: 'Calm', endDate: day('2026-08-01') });
    const late = await project({ name: 'Late', endDate: day('2026-06-01') });
    for (const p of [healthy, late]) {
      const done = await column(p._id, 'Done', true);
      await task(p._id, done);
    }

    const rows = await projectHealthOverview(NOW);

    expect(rows.map((row) => row.name)).toEqual(['Late', 'Calm']);
  });
});
