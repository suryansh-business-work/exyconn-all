import { boardResolvers } from '../../src/modules/projects/board.resolvers';
import { ProjectModel } from '../../src/modules/projects/projects.model';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

/** The board is projects-only, so every call needs a context that carries the role. */
const asProjects = (id: string, email: string): GraphQLContext => ({
  user: { id, roles: [ROLES.PROJECTS], email },
});

const project = (name = 'Billing') => ProjectModel.create({ name, status: 'ACTIVE' });

const column = (ctx: GraphQLContext, projectId: string, name: string) =>
  boardResolvers.Mutation.createColumn(null, { projectId, name }, ctx);

/** Everything one person has been told, newest last. */
const noticesFor = (employeeId: string) =>
  NotificationModel.find({ employeeId }).sort({ createdAt: 1 }).lean();

/** A lead who runs the board and a developer who is given the work. */
async function team() {
  const lead = await seedUser('lead@exyconn.com', 'a-strong-password', [ROLES.PROJECTS]);
  const dev = await seedUser('dev@exyconn.com', 'a-strong-password', [ROLES.PROJECTS]);
  return {
    lead,
    dev,
    leadCtx: asProjects(lead.id, 'lead@exyconn.com'),
    devCtx: asProjects(dev.id, 'dev@exyconn.com'),
  };
}

describe('a ticket assigned to you', () => {
  it('tells the assignee who handed it over, and links to the board', async () => {
    const { dev, leadCtx } = await team();
    const created = await project();
    const todo = await column(leadCtx, created.id, 'To do');

    await boardResolvers.Mutation.createTask(
      null,
      {
        projectId: created.id,
        columnId: todo.id,
        input: { title: 'Invoice PDF is blank', assigneeId: dev.id },
      },
      leadCtx,
    );

    const notices = await noticesFor(dev.id);
    expect(notices).toHaveLength(1);
    expect(notices[0].kind).toBe('PROJECT');
    expect(notices[0].title).toBe('BILL-1 is yours');
    expect(notices[0].body).toContain('lead');
    expect(notices[0].link).toBe(`/projects/${created.id}/board`);
  });

  it('says nothing when you assign a ticket to yourself', async () => {
    const { lead, leadCtx } = await team();
    const created = await project();
    const todo = await column(leadCtx, created.id, 'To do');

    await boardResolvers.Mutation.createTask(
      null,
      { projectId: created.id, columnId: todo.id, input: { title: 'Mine', assigneeId: lead.id } },
      leadCtx,
    );

    expect(await noticesFor(lead.id)).toHaveLength(0);
  });

  it('does not re-announce an assignment when another field is saved', async () => {
    const { dev, leadCtx } = await team();
    const created = await project();
    const todo = await column(leadCtx, created.id, 'To do');
    const task = await boardResolvers.Mutation.createTask(
      null,
      { projectId: created.id, columnId: todo.id, input: { title: 'Blank PDF', assigneeId: dev.id } },
      leadCtx,
    );

    await boardResolvers.Mutation.updateTask(
      null,
      { id: task.id, input: { title: 'Blank PDF', assigneeId: dev.id, priority: 'HIGH' } },
      leadCtx,
    );

    expect(await noticesFor(dev.id)).toHaveLength(1);
  });

  it('tells the new holder when a ticket changes hands', async () => {
    const { dev, leadCtx } = await team();
    const created = await project();
    const todo = await column(leadCtx, created.id, 'To do');
    const task = await boardResolvers.Mutation.createTask(
      null,
      { projectId: created.id, columnId: todo.id, input: { title: 'Blank PDF' } },
      leadCtx,
    );

    await boardResolvers.Mutation.updateTask(
      null,
      { id: task.id, input: { title: 'Blank PDF', assigneeId: dev.id } },
      leadCtx,
    );

    const notices = await noticesFor(dev.id);
    expect(notices).toHaveLength(1);
    expect(notices[0].title).toBe('BILL-1 is yours');
  });
});

describe('a comment on a ticket', () => {
  it('reaches the assignee and the reporter, but never the author', async () => {
    const { lead, dev, leadCtx, devCtx } = await team();
    const created = await project();
    const todo = await column(leadCtx, created.id, 'To do');
    const task = await boardResolvers.Mutation.createTask(
      null,
      { projectId: created.id, columnId: todo.id, input: { title: 'Blank PDF', assigneeId: dev.id } },
      leadCtx,
    );
    await NotificationModel.deleteMany({});

    await boardResolvers.Mutation.addTaskComment(
      null,
      { taskId: task.id, body: 'Reproduced on staging.' },
      devCtx,
    );

    const toLead = await noticesFor(lead.id);
    expect(toLead).toHaveLength(1);
    expect(toLead[0].title).toBe('New comment on BILL-1');
    expect(toLead[0].body).toContain('dev');
    expect(await noticesFor(dev.id)).toHaveLength(0);
  });

  it('tells one person once when the reporter is also the assignee', async () => {
    const { lead, leadCtx, devCtx } = await team();
    const created = await project();
    const todo = await column(leadCtx, created.id, 'To do');
    const task = await boardResolvers.Mutation.createTask(
      null,
      {
        projectId: created.id,
        columnId: todo.id,
        input: { title: 'Blank PDF', assigneeId: lead.id },
      },
      leadCtx,
    );
    await NotificationModel.deleteMany({});

    await boardResolvers.Mutation.addTaskComment(
      null,
      { taskId: task.id, body: 'Any progress?' },
      devCtx,
    );

    expect(await noticesFor(lead.id)).toHaveLength(1);
  });
});

describe('a ticket moved to a done column', () => {
  it('tells the assignee when somebody else calls it finished', async () => {
    const { dev, leadCtx, devCtx } = await team();
    const created = await project();
    const todo = await column(leadCtx, created.id, 'To do');
    const done = await column(leadCtx, created.id, 'Done');
    await boardResolvers.Mutation.setColumnDone(null, { id: done.id, isDone: true }, leadCtx);
    const task = await boardResolvers.Mutation.createTask(
      null,
      { projectId: created.id, columnId: todo.id, input: { title: 'Blank PDF', assigneeId: dev.id } },
      devCtx,
    );
    await NotificationModel.deleteMany({});

    await boardResolvers.Mutation.moveTask(
      null,
      { id: task.id, toColumnId: done.id, toIndex: 0 },
      leadCtx,
    );

    const notices = await noticesFor(dev.id);
    expect(notices).toHaveLength(1);
    expect(notices[0].title).toBe('BILL-1 was moved to Done');
  });

  it('says nothing when you finish your own ticket', async () => {
    const { dev, leadCtx, devCtx } = await team();
    const created = await project();
    const todo = await column(leadCtx, created.id, 'To do');
    const done = await column(leadCtx, created.id, 'Done');
    await boardResolvers.Mutation.setColumnDone(null, { id: done.id, isDone: true }, leadCtx);
    const task = await boardResolvers.Mutation.createTask(
      null,
      { projectId: created.id, columnId: todo.id, input: { title: 'Blank PDF', assigneeId: dev.id } },
      devCtx,
    );
    await NotificationModel.deleteMany({});

    await boardResolvers.Mutation.moveTask(
      null,
      { id: task.id, toColumnId: done.id, toIndex: 0 },
      devCtx,
    );

    expect(await noticesFor(dev.id)).toHaveLength(0);
  });

  it('says nothing about a move between columns that do not mean finished', async () => {
    const { dev, leadCtx, devCtx } = await team();
    const created = await project();
    const todo = await column(leadCtx, created.id, 'To do');
    const doing = await column(leadCtx, created.id, 'In progress');
    const task = await boardResolvers.Mutation.createTask(
      null,
      { projectId: created.id, columnId: todo.id, input: { title: 'Blank PDF', assigneeId: dev.id } },
      devCtx,
    );
    await NotificationModel.deleteMany({});

    await boardResolvers.Mutation.moveTask(
      null,
      { id: task.id, toColumnId: doing.id, toIndex: 0 },
      leadCtx,
    );

    expect(await noticesFor(dev.id)).toHaveLength(0);
  });
});
