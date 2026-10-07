import { Types } from 'mongoose';
import { projectHealthResolvers } from '../../../../src/modules/projects/projects.health.resolvers';
import { projectHealth } from '../../../../src/modules/projects/projects.health';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
import { BoardColumnModel, TaskModel } from '../../../../src/modules/projects/board.model';
import {
  trackerBillingService,
  type ProjectBillingRow,
} from '../../../../src/modules/tracker/tracker.billing.service';
import { ROLES } from '../../../../src/constants/roles';
import { codeOf } from '../codeOf';
import { ctxFor, missingId } from './projects.fixtures';

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const NOW = day('2026-06-15');
/** The resolvers measure against the real clock, so their end dates sit well past it. */
const FAR_OFF = day('2099-01-01');
const lead = ctxFor(missingId());

/** One billing row, as the time log reports it, carrying `hours`. */
const billed = (hours: number): ProjectBillingRow => ({
  projectId: '',
  projectName: '',
  clientId: null,
  clientName: '',
  currency: 'USD',
  employees: [],
  hours,
  amount: 0,
  budgetHours: null,
  budgetAmount: null,
});

let billing: jest.SpyInstance;

beforeEach(() => {
  billing = jest.spyOn(trackerBillingService, 'billingByProject').mockResolvedValue([]);
});
afterEach(() => jest.restoreAllMocks());

/** A project with one ticket in a done column, so its progress is measurable and complete. */
async function finishedProject(fields: Record<string, unknown>) {
  const project = await ProjectModel.create({ status: 'ACTIVE', ...fields });
  const done = await BoardColumnModel.create({
    projectId: project._id,
    name: 'Done',
    isDone: true,
  });
  await TaskModel.create({ projectId: project._id, columnId: done._id, key: 'K-1', title: 'Done' });
  return project;
}

describe('project health figures', () => {
  it('measures logged hours against the agreed budget, and flags an overrun', async () => {
    billing.mockResolvedValue([billed(60.04), billed(70)]);
    const project = await finishedProject({
      name: 'Overrun',
      budgetHours: 100,
      startDate: day('2026-06-01'),
      endDate: FAR_OFF,
    });

    const health = await projectHealthResolvers.Query.projectHealth(null, { id: project.id }, lead);

    expect(health.loggedHours).toBe(130);
    expect(health.budgetUsedPercent).toBe(130);
    expect(health.risk).toBe('MEDIUM');
    expect(health.riskReasons).toEqual(['Over its agreed hours']);
    expect(billing).toHaveBeenCalledWith(day('2026-06-01'), expect.any(Date), project.id);
  });

  it('counts hours from the beginning of time for a project with no start date', async () => {
    const project = await finishedProject({ name: 'Undated', budgetHours: 0 });

    const health = await projectHealthResolvers.Query.projectHealth(null, { id: project.id }, lead);

    expect(billing).toHaveBeenCalledWith(new Date(0), expect.any(Date), project.id);
    expect(health.budgetUsedPercent).toBeNull();
    expect(health.risk).toBe('LOW');
  });

  it('cannot call a project behind when its window has no length', async () => {
    const project = await ProjectModel.create({
      name: 'Instant',
      status: 'ACTIVE',
      startDate: day('2026-08-01'),
      endDate: day('2026-08-01'),
    });
    const todo = await BoardColumnModel.create({ projectId: project._id, name: 'To do' });
    await BoardColumnModel.create({ projectId: project._id, name: 'Done', isDone: true });
    await TaskModel.create({ projectId: project._id, columnId: todo._id, key: 'K-1', title: 'x' });
    const lean = await ProjectModel.findById(project._id).lean();
    if (!lean) throw new Error('project vanished');

    const health = await projectHealth(lean, NOW);

    expect(health.progressPercent).toBe(0);
    expect(health.riskReasons).toEqual([]);
  });

  it('reads absent dates, budget and client on a sparse row as empty', async () => {
    const health = await projectHealth(
      { _id: new Types.ObjectId(), name: 'Bare', key: 'BARE', status: 'PLANNING' },
      NOW,
    );

    expect(health).toMatchObject({
      clientName: '',
      startDate: null,
      endDate: null,
      budgetHours: null,
      timeline: 'NO_DATES',
      risk: 'UNKNOWN',
      teamSize: 0,
    });
  });
});

describe('project health on rows written outside the form', () => {
  it('treats a negative budget as no budget, and a start without an end as undated', async () => {
    const start = day('2026-06-01');

    const health = await projectHealth(
      {
        _id: new Types.ObjectId(),
        name: 'Odd',
        key: 'ODD',
        status: 'ACTIVE',
        startDate: start,
        budgetHours: -1,
      },
      NOW,
    );

    expect(health).toMatchObject({
      budgetUsedPercent: null,
      timeline: 'NO_DATES',
      risk: 'UNKNOWN',
    });
    expect(billing).toHaveBeenCalledWith(start, expect.any(Date), String(health.projectId));
  });
});

describe('project health queries', () => {
  it('answers not found for a project that does not exist', async () => {
    const attempt = projectHealthResolvers.Query.projectHealth(null, { id: missingId() }, lead);

    expect(await codeOf(attempt)).toBe('NOT_FOUND');
  });

  it('refuses somebody without the Projects role', async () => {
    const outsider = ctxFor(missingId(), [ROLES.HR]);

    expect(() => projectHealthResolvers.Query.projectHealthOverview(null, {}, outsider)).toThrow(
      'You do not have access to this resource',
    );
  });

  it('orders projects at the same risk by name', async () => {
    await finishedProject({ name: 'Zeta', endDate: FAR_OFF });
    await finishedProject({ name: 'Alpha', endDate: FAR_OFF });

    const rows = await projectHealthResolvers.Query.projectHealthOverview(null, {}, lead);

    expect(rows.map((row) => [row.name, row.risk])).toEqual([
      ['Alpha', 'LOW'],
      ['Zeta', 'LOW'],
    ]);
  });
});
