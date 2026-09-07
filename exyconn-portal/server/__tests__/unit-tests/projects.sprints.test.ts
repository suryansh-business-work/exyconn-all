import { boardResolvers } from '../../src/modules/projects/board.resolvers';
import { sprintsResolvers } from '../../src/modules/projects/sprints.resolvers';
import { sprintsService } from '../../src/modules/projects/sprints.service';
import { ProjectModel } from '../../src/modules/projects/projects.model';
import { TaskActivityModel, TaskModel } from '../../src/modules/projects/board.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

const PASSWORD = process.env.TEST_USER_PASSWORD ?? 'a-strong-password';

const asProjects = (id: string): GraphQLContext => ({
  user: { id, roles: [ROLES.PROJECTS], email: 'lead@exyconn.com' },
});

const lead = () => seedUser('lead@exyconn.com', PASSWORD, [ROLES.PROJECTS]);

const project = (name = 'Billing') => ProjectModel.create({ name, status: 'ACTIVE' });

const column = (ctx: GraphQLContext, projectId: string, name: string) =>
  boardResolvers.Mutation.createColumn(null, { projectId, name }, ctx);

const sprint = (ctx: GraphQLContext, projectId: string, name: string) =>
  sprintsResolvers.Mutation.createSprint(null, { projectId, input: { name } }, ctx);

const ticket = (ctx: GraphQLContext, projectId: string, columnId: string, title: string) =>
  boardResolvers.Mutation.createTask(null, { projectId, columnId, input: { title } }, ctx);

/** A board with a To do and a Done column — the last one is what "done" means. */
async function boardOf(ctx: GraphQLContext, projectId: string) {
  const todo = await column(ctx, projectId, 'To do');
  const done = await column(ctx, projectId, 'Done');
  return { todo, done };
}

describe('sprints', () => {
  it('starts a planned sprint', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const one = await sprint(ctx, created.id, 'Sprint 1');

    const started = await sprintsResolvers.Mutation.startSprint(null, { id: one.id }, ctx);

    expect(started.state).toBe('ACTIVE');
  });

  it('refuses a second running sprint on the same project', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const one = await sprint(ctx, created.id, 'Sprint 1');
    const two = await sprint(ctx, created.id, 'Sprint 2');
    await sprintsResolvers.Mutation.startSprint(null, { id: one.id }, ctx);

    await expect(
      sprintsResolvers.Mutation.startSprint(null, { id: two.id }, ctx),
    ).rejects.toThrow(/already has a sprint running/);
  });

  it('refuses to start a sprint that is already complete', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const one = await sprint(ctx, created.id, 'Sprint 1');
    await sprintsResolvers.Mutation.startSprint(null, { id: one.id }, ctx);
    await sprintsResolvers.Mutation.completeSprint(null, { id: one.id }, ctx);

    await expect(
      sprintsResolvers.Mutation.startSprint(null, { id: one.id }, ctx),
    ).rejects.toThrow(/Only a planned sprint/);
  });
});

describe('completing a sprint', () => {
  it('says the leftovers go to the next planned sprint, and moves them there', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const { todo, done } = await boardOf(ctx, created.id);
    const one = await sprint(ctx, created.id, 'Sprint 1');
    const two = await sprint(ctx, created.id, 'Sprint 2');

    const open = await ticket(ctx, created.id, todo.id, 'Still going');
    const finished = await ticket(ctx, created.id, done.id, 'Shipped');
    await sprintsResolvers.Mutation.setTaskSprint(null, { taskId: open.id, sprintId: one.id }, ctx);
    await sprintsResolvers.Mutation.setTaskSprint(
      null,
      { taskId: finished.id, sprintId: one.id },
      ctx,
    );

    const plan = await sprintsResolvers.Query.sprintCompletionPlan(null, { id: one.id }, ctx);
    expect(plan.unfinishedCount).toBe(1);
    expect(plan.targetSprintName).toBe('Sprint 2');

    await sprintsResolvers.Mutation.completeSprint(null, { id: one.id }, ctx);

    expect((await TaskModel.findById(open.id).lean())?.sprintId).toBe(two.id);
    expect((await TaskModel.findById(finished.id).lean())?.sprintId).toBe(one.id);
  });

  it('sends the leftovers to the backlog when nothing is planned next', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const { todo } = await boardOf(ctx, created.id);
    const one = await sprint(ctx, created.id, 'Sprint 1');
    const open = await ticket(ctx, created.id, todo.id, 'Still going');
    await sprintsResolvers.Mutation.setTaskSprint(null, { taskId: open.id, sprintId: one.id }, ctx);

    const plan = await sprintsResolvers.Query.sprintCompletionPlan(null, { id: one.id }, ctx);
    expect(plan.targetSprintName).toBe('the backlog');
    expect(plan.targetSprintId).toBeNull();

    await sprintsResolvers.Mutation.completeSprint(null, { id: one.id }, ctx);

    expect((await TaskModel.findById(open.id).lean())?.sprintId).toBeNull();
  });

  it('refuses to complete the same sprint twice', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const one = await sprint(ctx, created.id, 'Sprint 1');
    await sprintsResolvers.Mutation.completeSprint(null, { id: one.id }, ctx);

    await expect(
      sprintsResolvers.Mutation.completeSprint(null, { id: one.id }, ctx),
    ).rejects.toThrow(/already complete/);
  });

  it('returns a deleted sprint’s tickets to the backlog rather than deleting them', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const { todo } = await boardOf(ctx, created.id);
    const one = await sprint(ctx, created.id, 'Sprint 1');
    const open = await ticket(ctx, created.id, todo.id, 'Still going');
    await sprintsResolvers.Mutation.setTaskSprint(null, { taskId: open.id, sprintId: one.id }, ctx);

    await sprintsResolvers.Mutation.deleteSprint(null, { id: one.id }, ctx);

    const saved = await TaskModel.findById(open.id).lean();
    expect(saved).not.toBeNull();
    expect(saved?.sprintId).toBeNull();
  });
});

describe('epics', () => {
  it('files a ticket under an epic', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const { todo } = await boardOf(ctx, created.id);
    const epic = await boardResolvers.Mutation.createTask(
      null,
      { projectId: created.id, columnId: todo.id, input: { title: 'Billing rewrite', type: 'EPIC' } },
      ctx,
    );
    const child = await ticket(ctx, created.id, todo.id, 'Invoice PDF');

    await sprintsResolvers.Mutation.setTaskParent(
      null,
      { taskId: child.id, parentTaskId: epic.id },
      ctx,
    );

    expect((await TaskModel.findById(child.id).lean())?.parentTaskId).toBe(epic.id);
  });

  it('refuses to file a ticket under anything that is not an epic', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const { todo } = await boardOf(ctx, created.id);
    const parent = await ticket(ctx, created.id, todo.id, 'Not an epic');
    const child = await ticket(ctx, created.id, todo.id, 'Invoice PDF');

    await expect(
      sprintsResolvers.Mutation.setTaskParent(
        null,
        { taskId: child.id, parentTaskId: parent.id },
        ctx,
      ),
    ).rejects.toThrow(/only be filed under an epic/);
  });

  it('refuses to make a ticket its own epic', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const { todo } = await boardOf(ctx, created.id);
    const one = await ticket(ctx, created.id, todo.id, 'Invoice PDF');

    await expect(
      sprintsService.setTaskParent(one.id, one.id),
    ).rejects.toThrow(/cannot be its own epic/);
  });
});

describe('attachments', () => {
  const file = { url: 'https://ik.example/spec.pdf', name: 'spec.pdf', contentType: 'application/pdf' };

  it('stamps the uploader from the caller, never from the client', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const { todo } = await boardOf(ctx, created.id);
    const one = await ticket(ctx, created.id, todo.id, 'Invoice PDF');

    await boardResolvers.Mutation.updateTask(
      null,
      { id: one.id, input: { title: one.title, attachments: [file] } },
      ctx,
    );

    const saved = await TaskModel.findById(one.id).lean();
    expect(saved?.attachments[0].uploadedByName).toBe('lead');
  });

  it('records a history line when a file is attached and when it is taken off', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const { todo } = await boardOf(ctx, created.id);
    const one = await ticket(ctx, created.id, todo.id, 'Invoice PDF');

    await boardResolvers.Mutation.updateTask(
      null,
      { id: one.id, input: { title: one.title, attachments: [file] } },
      ctx,
    );
    await boardResolvers.Mutation.updateTask(
      null,
      { id: one.id, input: { title: one.title, attachments: [] } },
      ctx,
    );

    const trail = await TaskActivityModel.find({ taskId: one.id, field: 'attachment' })
      .sort({ createdAt: 1 })
      .lean();
    expect(trail.map((entry) => [entry.fromValue, entry.toValue])).toEqual([
      ['', 'spec.pdf'],
      ['spec.pdf', ''],
    ]);
  });

  it('keeps the original uploader when the ticket is saved again', async () => {
    const ctx = asProjects((await lead()).id);
    const other = asProjects((await seedUser('dev@exyconn.com', PASSWORD, [ROLES.PROJECTS])).id);
    const created = await project();
    const { todo } = await boardOf(ctx, created.id);
    const one = await ticket(ctx, created.id, todo.id, 'Invoice PDF');

    await boardResolvers.Mutation.updateTask(
      null,
      { id: one.id, input: { title: one.title, attachments: [file] } },
      ctx,
    );
    await boardResolvers.Mutation.updateTask(
      null,
      { id: one.id, input: { title: 'Renamed', attachments: [file] } },
      other,
    );

    const saved = await TaskModel.findById(one.id).lean();
    expect(saved?.attachments[0].uploadedByName).toBe('lead');
  });

  it('carries a comment’s file onto the ticket’s history', async () => {
    const ctx = asProjects((await lead()).id);
    const created = await project();
    const { todo } = await boardOf(ctx, created.id);
    const one = await ticket(ctx, created.id, todo.id, 'Invoice PDF');

    await boardResolvers.Mutation.addTaskComment(
      null,
      { taskId: one.id, body: 'Here is the spec', attachments: [file] },
      ctx,
    );

    const trail = await TaskActivityModel.find({ taskId: one.id, field: 'attachment' }).lean();
    expect(trail).toHaveLength(1);
    expect(trail[0].toValue).toBe('spec.pdf');
  });
});
