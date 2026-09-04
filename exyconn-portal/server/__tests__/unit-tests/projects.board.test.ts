import { boardResolvers } from '../../src/modules/projects/board.resolvers';
import { docsResolvers } from '../../src/modules/projects/docs.resolvers';
import { ProjectModel } from '../../src/modules/projects/projects.model';
import { DocPageModel } from '../../src/modules/projects/docs.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

/** The board is projects-only, so every call needs a context that carries the role. */
const asProjects = (id: string): GraphQLContext => ({
  user: { id, roles: [ROLES.PROJECTS], email: 'lead@exyconn.com' },
});

const project = (name = 'Exyconn Portal') => ProjectModel.create({ name, status: 'ACTIVE' });

const column = (ctx: GraphQLContext, projectId: string, name = 'To do') =>
  boardResolvers.Mutation.createColumn(null, { projectId, name }, ctx);

const ticket = (ctx: GraphQLContext, projectId: string, columnId: string, title: string) =>
  boardResolvers.Mutation.createTask(null, { projectId, columnId, input: { title } }, ctx);

describe('project keys', () => {
  it('derives a key from the project name', async () => {
    const created = await project('Exyconn Portal');

    expect(created.key).toBe('EXYC');
  });

  it('keeps a second project with the same name from taking the same key', async () => {
    await project('Exyconn Portal');
    const second = await project('Exyconn Portal');

    expect(second.key).toBe('EXYC2');
  });
});

describe('tickets', () => {
  it('numbers tickets from the project key, and never repeats a number', async () => {
    const lead = await seedUser('lead@exyconn.com', 'a-strong-password', [ROLES.PROJECTS]);
    const ctx = asProjects(lead.id);
    const created = await project('Billing');
    const todo = await column(ctx, created.id);

    const first = await ticket(ctx, created.id, todo.id, 'Invoice PDF is blank');
    const second = await ticket(ctx, created.id, todo.id, 'Late fee is wrong');

    expect(first.key).toBe('BILL-1');
    expect(second.key).toBe('BILL-2');
  });

  it('records the reporter from the caller, not from the client', async () => {
    const lead = await seedUser('lead@exyconn.com', 'a-strong-password', [ROLES.PROJECTS]);
    const ctx = asProjects(lead.id);
    const created = await project('Billing');
    const todo = await column(ctx, created.id);

    const raised = await ticket(ctx, created.id, todo.id, 'Invoice PDF is blank');

    expect(raised.reporterName).toBe('lead');
  });

  it('starts unassigned, and stores the assignee name beside the id', async () => {
    const lead = await seedUser('lead@exyconn.com', 'a-strong-password', [ROLES.PROJECTS]);
    const dev = await seedUser('dev@exyconn.com', 'a-strong-password', [ROLES.PROJECTS]);
    const ctx = asProjects(lead.id);
    const created = await project('Billing');
    const todo = await column(ctx, created.id);
    const raised = await ticket(ctx, created.id, todo.id, 'Invoice PDF is blank');

    expect(raised.assigneeName).toBe('');

    const assigned = await boardResolvers.Mutation.updateTask(
      null,
      { id: raised.id, input: { title: raised.title, assigneeId: dev.id } },
      ctx,
    );

    expect(assigned.assigneeId).toBe(dev.id);
    expect(assigned.assigneeName).toBe('dev');
  });

  it('moves a ticket to another column and renumbers the one it lands in', async () => {
    const lead = await seedUser('lead@exyconn.com', 'a-strong-password', [ROLES.PROJECTS]);
    const ctx = asProjects(lead.id);
    const created = await project('Billing');
    const todo = await column(ctx, created.id, 'To do');
    const doing = await column(ctx, created.id, 'Doing');
    const first = await ticket(ctx, created.id, todo.id, 'First');
    const second = await ticket(ctx, created.id, todo.id, 'Second');

    await boardResolvers.Mutation.moveTask(
      null,
      { id: second.id, toColumnId: doing.id, toIndex: 0 },
      ctx,
    );

    const board = await boardResolvers.Query.projectBoard(null, { projectId: created.id }, ctx);
    const moved = board.tasks.find((task) => task.id === second.id);
    const stayed = board.tasks.find((task) => task.id === first.id);

    expect(moved?.columnId).toBe(doing.id);
    expect(moved?.order).toBe(0);
    expect(stayed?.order).toBe(0);
  });

  it('takes a ticket’s comments with it when the ticket is deleted', async () => {
    const lead = await seedUser('lead@exyconn.com', 'a-strong-password', [ROLES.PROJECTS]);
    const ctx = asProjects(lead.id);
    const created = await project('Billing');
    const todo = await column(ctx, created.id);
    const raised = await ticket(ctx, created.id, todo.id, 'Invoice PDF is blank');
    await boardResolvers.Mutation.addTaskComment(
      null,
      { taskId: raised.id, body: 'Reproduced on staging.' },
      ctx,
    );

    await boardResolvers.Mutation.deleteTask(null, { id: raised.id }, ctx);

    await expect(
      boardResolvers.Query.taskComments(null, { taskId: raised.id }, ctx),
    ).resolves.toHaveLength(0);
  });

  it('refuses an empty comment', async () => {
    const lead = await seedUser('lead@exyconn.com', 'a-strong-password', [ROLES.PROJECTS]);
    const ctx = asProjects(lead.id);
    const created = await project('Billing');
    const todo = await column(ctx, created.id);
    const raised = await ticket(ctx, created.id, todo.id, 'Invoice PDF is blank');

    await expect(
      boardResolvers.Mutation.addTaskComment(null, { taskId: raised.id, body: '   ' }, ctx),
    ).rejects.toThrow('A comment cannot be empty');
  });
});

describe('documentation space', () => {
  it('deletes a page together with everything filed under it', async () => {
    const lead = await seedUser('lead@exyconn.com', 'a-strong-password', [ROLES.PROJECTS]);
    const ctx = asProjects(lead.id);
    const created = await project('Billing');

    const parent = await docsResolvers.Mutation.createDocPage(
      null,
      { projectId: created.id, title: 'Runbooks' },
      ctx,
    );
    const child = await docsResolvers.Mutation.createDocPage(
      null,
      { projectId: created.id, parentId: parent.id, title: 'Releasing' },
      ctx,
    );
    await docsResolvers.Mutation.createDocPage(
      null,
      { projectId: created.id, parentId: child.id, title: 'Rolling back' },
      ctx,
    );

    await docsResolvers.Mutation.deleteDocPage(null, { id: parent.id }, ctx);

    await expect(DocPageModel.countDocuments({})).resolves.toBe(0);
  });

  it('records who saved a page last', async () => {
    const lead = await seedUser('lead@exyconn.com', 'a-strong-password', [ROLES.PROJECTS]);
    const ctx = asProjects(lead.id);
    const created = await project('Billing');
    const page = await docsResolvers.Mutation.createDocPage(
      null,
      { projectId: created.id, title: 'Runbooks' },
      ctx,
    );

    const saved = await docsResolvers.Mutation.updateDocPage(
      null,
      { id: page.id, title: 'Runbooks', body: '<p>Ship on a Tuesday.</p>' },
      ctx,
    );

    expect(saved.updatedByName).toBe('lead');
    expect(saved.body).toBe('<p>Ship on a Tuesday.</p>');
  });
});
