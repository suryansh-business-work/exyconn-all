import { bugsResolvers } from '../../src/modules/bugs';
import { BugModel } from '../../src/modules/bugs/bugs.model';
import { boardResolvers } from '../../src/modules/projects/board.resolvers';
import { TaskModel } from '../../src/modules/projects/board.model';
import { ProjectModel } from '../../src/modules/projects/projects.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

const asProjects = (id: string): GraphQLContext => ({
  user: { id, roles: [ROLES.PROJECTS], email: 'lead@exyconn.com' },
});

const DUE = new Date('2026-09-30T00:00:00.000Z');

type BugOut = {
  id: string;
  projectName: string;
  assigneeName: string;
  taskKey: string;
};

async function lead() {
  const user = await seedUser('lead@exyconn.com', 'a-strong-password', [ROLES.PROJECTS]);
  return { id: user.id, ctx: asProjects(user.id) };
}

const project = () => ProjectModel.create({ name: 'Exyconn Portal', status: 'ACTIVE' });

const column = (ctx: GraphQLContext, projectId: string, name: string) =>
  boardResolvers.Mutation.createColumn(null, { projectId, name }, ctx);

const fileBug = (ctx: GraphQLContext, input: Record<string, unknown>) =>
  bugsResolvers.Mutation.createBug(
    null,
    {
      input: {
        title: 'Login button unresponsive',
        description: 'Nothing happens on tap',
        severity: 'CRITICAL',
        status: 'OPEN',
        dueDate: DUE,
        ...input,
      },
    } as never,
    ctx,
  ) as Promise<BugOut>;

const promote = (ctx: GraphQLContext, id: string) =>
  bugsResolvers.Mutation.promoteBugToTask(null, { id }, ctx) as Promise<{
    id: string;
    key: string;
    type: string;
    priority: string;
    columnId: string;
  }>;

describe('bugs on a project', () => {
  it('stores the project and assignee names beside their ids', async () => {
    const { id, ctx } = await lead();
    const created = await project();

    const bug = await fileBug(ctx, { projectId: String(created._id), assigneeId: id });

    expect(bug).toMatchObject({ projectName: 'Exyconn Portal', assigneeName: 'lead' });
  });

  it('refuses an assignee that is not a user', async () => {
    const { ctx } = await lead();

    await expect(fileBug(ctx, { assigneeId: 'nobody' })).rejects.toThrow(/assignee/i);
  });

  it('still shows the name on a bug filed before the assignee was a user', async () => {
    const legacy = await BugModel.create({
      title: 'Old bug',
      description: 'From before',
      severity: 'LOW',
      status: 'OPEN',
      assignee: 'Someone Typed',
      dueDate: DUE,
    });

    expect(bugsResolvers.Bug.assigneeName(legacy.toObject())).toBe('Someone Typed');
    expect(bugsResolvers.Bug.taskKey(legacy.toObject())).toBe('');
  });
});

describe('promoteBugToTask', () => {
  it('makes a BUG ticket in the first column and records its key on the bug', async () => {
    const { id, ctx } = await lead();
    const created = await project();
    const projectId = String(created._id);
    const first = (await column(ctx, projectId, 'To do')) as { id: string };
    await column(ctx, projectId, 'Done');
    const bug = await fileBug(ctx, { projectId, assigneeId: id });

    const task = await promote(ctx, bug.id);

    expect(task).toMatchObject({
      key: 'EXYC-1',
      type: 'BUG',
      priority: 'HIGHEST',
      columnId: first.id,
    });
    expect(await TaskModel.countDocuments({ projectId })).toBe(1);
    expect(await BugModel.findById(bug.id).lean()).toMatchObject({
      taskId: task.id,
      taskKey: 'EXYC-1',
    });
  });

  it('refuses to promote the same bug twice', async () => {
    const { id, ctx } = await lead();
    const created = await project();
    const projectId = String(created._id);
    await column(ctx, projectId, 'To do');
    const bug = await fileBug(ctx, { projectId, assigneeId: id });
    await promote(ctx, bug.id);

    await expect(promote(ctx, bug.id)).rejects.toThrow(/already ticket EXYC-1/);
    expect(await TaskModel.countDocuments({ projectId })).toBe(1);
  });

  it('refuses a bug with no project', async () => {
    const { id, ctx } = await lead();
    const bug = await fileBug(ctx, { assigneeId: id });

    await expect(promote(ctx, bug.id)).rejects.toThrow(/project/i);
  });

  it('refuses when the board has no column to put the ticket in', async () => {
    const { id, ctx } = await lead();
    const created = await project();
    const bug = await fileBug(ctx, { projectId: String(created._id), assigneeId: id });

    await expect(promote(ctx, bug.id)).rejects.toThrow(/no columns/i);
  });
});
