import { Types } from 'mongoose';
import { bugsResolvers } from '../../../../src/modules/bugs';
import { BugModel } from '../../../../src/modules/bugs/bugs.model';
import { projectNameFor } from '../../../../src/modules/bugs/bugs.promote';
import { boardResolvers } from '../../../../src/modules/projects/board.resolvers';
import { TaskModel } from '../../../../src/modules/projects/board.model';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { seedUser } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

const PASSWORD = process.env.TEST_USER_PASSWORD ?? `pw-${'x'.repeat(12)}`;
const DUE = new Date('2026-11-30T00:00:00.000Z');

const ctxFor = (id: string, roles: Role[] = [ROLES.PROJECTS]): GraphQLContext => ({
  user: { id, roles, email: 'lead@exyconn.com' },
});

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<Record<string, unknown>>;
const mutation = bugsResolvers.Mutation as unknown as Record<string, Resolver>;

const bugInput = (overrides: Record<string, unknown>) => ({
  title: 'Export hangs',
  description: 'The CSV export never finishes',
  severity: 'LOW',
  status: 'OPEN',
  dueDate: DUE,
  ...overrides,
});

async function setup() {
  const lead = await seedUser('lead@exyconn.com', PASSWORD, [ROLES.PROJECTS]);
  const ctx = ctxFor(lead.id);
  const project = await ProjectModel.create({ name: 'Billing', status: 'ACTIVE' });
  return { lead, ctx, projectId: String(project._id) };
}

describe('updateBug', () => {
  it('re-resolves the project and assignee names from their ids on every edit', async () => {
    const { lead, ctx, projectId } = await setup();
    const created = await mutation.createBug(
      null,
      { input: bugInput({ assigneeId: lead.id }) },
      ctx,
    );
    expect(created.projectName).toBe('');

    const updated = await mutation.updateBug(
      null,
      {
        id: created.id,
        input: bugInput({ projectId, assigneeId: lead.id, projectName: 'Forged' }),
      },
      ctx,
    );

    expect(updated).toMatchObject({ projectId, projectName: 'Billing', assigneeName: 'lead' });
  });

  it('refuses a project id that matches no project', async () => {
    const { lead, ctx } = await setup();
    const created = await mutation.createBug(
      null,
      { input: bugInput({ assigneeId: lead.id }) },
      ctx,
    );
    const missing = String(new Types.ObjectId());

    const attempt = mutation.updateBug(
      null,
      { id: created.id, input: bugInput({ projectId: missing, assigneeId: lead.id }) },
      ctx,
    );

    await expect(attempt).rejects.toThrow(/project does not exist/);
  });
});

describe('projectNameFor', () => {
  it('is empty for a bug on no project', async () => {
    expect(await projectNameFor(null)).toBe('');
    expect(await projectNameFor(undefined)).toBe('');
  });

  it('refuses an id that is not an object id at all', async () => {
    await expect(projectNameFor('not-an-id')).rejects.toThrow(/project does not exist/);
  });
});

describe('Bug field resolvers on rows that predate the fields', () => {
  it('reads absent names, ids and keys as empty strings', () => {
    const legacy = { projectName: null, assigneeId: null, assigneeName: null, taskKey: null };

    expect(bugsResolvers.Bug.projectName(legacy)).toBe('');
    expect(bugsResolvers.Bug.assigneeId(legacy)).toBe('');
    expect(bugsResolvers.Bug.assigneeName({ assigneeName: '', assignee: '' })).toBe('');
    expect(bugsResolvers.Bug.taskKey(legacy)).toBe('');
  });

  it('prefers the stored values when present', () => {
    const row = { projectName: 'Billing', assigneeId: 'u1', assigneeName: 'Asha', taskKey: 'B-2' };

    expect(bugsResolvers.Bug.projectName(row)).toBe('Billing');
    expect(bugsResolvers.Bug.assigneeId(row)).toBe('u1');
    expect(bugsResolvers.Bug.assigneeName({ ...row, assignee: 'Old Text' })).toBe('Asha');
    expect(bugsResolvers.Bug.taskKey(row)).toBe('B-2');
  });
});

describe('promoteBugToTask', () => {
  const promote = (ctx: GraphQLContext, id: string) =>
    bugsResolvers.Mutation.promoteBugToTask(null, { id }, ctx) as Promise<{
      priority: string;
      assigneeId: string;
    }>;

  it('refuses a bug that does not exist', async () => {
    const { ctx } = await setup();

    await expect(promote(ctx, String(new Types.ObjectId()))).rejects.toThrow(/bug does not exist/);
  });

  it('opens an unassigned ticket for a legacy bug with no assignee id', async () => {
    const { ctx, projectId } = await setup();
    await boardResolvers.Mutation.createColumn(null, { projectId, name: 'Backlog' }, ctx);
    const legacy = await BugModel.create({ ...bugInput({ projectId }), severity: 'MEDIUM' });

    const task = await promote(ctx, String(legacy._id));

    expect(task.priority).toBe('MEDIUM');
    expect(task.assigneeId).toBe('');
    expect(await TaskModel.countDocuments({ projectId, type: 'BUG' })).toBe(1);
  });

  it('refuses somebody without the Projects role', async () => {
    const { projectId } = await setup();
    const bug = await BugModel.create(bugInput({ projectId }));
    const outsider = ctxFor(String(new Types.ObjectId()), [ROLES.HR]);

    expect(await codeOf(promote(outsider, String(bug._id)))).toBe('FORBIDDEN');
    expect(await BugModel.findById(bug._id).lean()).toMatchObject({ taskId: '' });
  });
});
