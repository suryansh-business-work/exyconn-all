import { sprintsResolvers } from '../../../../src/modules/projects/sprints.resolvers';
import { TaskModel } from '../../../../src/modules/projects/board.model';
import { ROLES } from '../../../../src/constants/roles';
import { codeOf } from '../codeOf';
import { addTicket, boardWithLead, ctxFor, missingId } from './projects.fixtures';

const { Query, Mutation } = sprintsResolvers;

describe('sprint resolvers', () => {
  it('lists sprints with their project as a string id', async () => {
    const { ctx, projectId } = await boardWithLead();
    await Mutation.createSprint(null, { projectId, input: { name: 'Sprint 1' } }, ctx);

    const sprints = await Query.projectSprints(null, { projectId }, ctx);

    expect(sprints).toHaveLength(1);
    expect(sprints[0]).toMatchObject({ name: 'Sprint 1', projectId });
    expect(typeof sprints[0].id).toBe('string');
  });

  it('renames a sprint', async () => {
    const { ctx, projectId } = await boardWithLead();
    const sprint = await Mutation.createSprint(null, { projectId, input: { name: 'S1' } }, ctx);

    const saved = await Mutation.updateSprint(
      null,
      { id: sprint.id, input: { name: 'Sprint one' } },
      ctx,
    );

    expect(saved).toMatchObject({ id: sprint.id, name: 'Sprint one', projectId });
  });

  it('creates, lists, updates and deletes a milestone', async () => {
    const { ctx, projectId } = await boardWithLead();

    const created = await Mutation.createMilestone(
      null,
      { projectId, input: { name: 'Launch', description: 'Go live' } },
      ctx,
    );
    const updated = await Mutation.updateMilestone(
      null,
      { id: created.id, input: { name: 'Launch', state: 'MISSED' } },
      ctx,
    );
    const listed = await Query.projectMilestones(null, { projectId }, ctx);

    expect(created).toMatchObject({ name: 'Launch', description: 'Go live', projectId });
    expect(updated.state).toBe('MISSED');
    expect(listed.map((one) => one.id)).toEqual([created.id]);
    await expect(Mutation.deleteMilestone(null, { id: created.id }, ctx)).resolves.toBe(true);
    expect(await Query.projectMilestones(null, { projectId }, ctx)).toEqual([]);
  });

  it('sends a ticket back to the backlog when no sprint is named', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const sprint = await Mutation.createSprint(null, { projectId, input: { name: 'S1' } }, ctx);
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Blank' });
    await Mutation.setTaskSprint(null, { taskId: raised.id, sprintId: sprint.id }, ctx);

    const back = await Mutation.setTaskSprint(null, { taskId: raised.id }, ctx);

    expect(back).toMatchObject({ id: raised.id, sprintId: null, columnId: todo.id });
  });

  it('takes a ticket out of its epic when no parent is named', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const epic = await addTicket(ctx, projectId, todo.id, { title: 'Epic', type: 'EPIC' });
    const child = await addTicket(ctx, projectId, todo.id, { title: 'Child' });
    await Mutation.setTaskParent(null, { taskId: child.id, parentTaskId: epic.id }, ctx);

    const freed = await Mutation.setTaskParent(null, { taskId: child.id }, ctx);

    expect(freed.parentTaskId).toBeNull();
    expect((await TaskModel.findById(child.id).lean())?.parentTaskId).toBeNull();
  });

  it('refuses somebody without the Projects role', async () => {
    const { projectId } = await boardWithLead();
    const outsider = ctxFor(missingId(), [ROLES.FINANCE]);

    expect(await codeOf(Query.projectSprints(null, { projectId }, outsider))).toBe('FORBIDDEN');
    expect(
      await codeOf(Mutation.createSprint(null, { projectId, input: { name: 'x' } }, outsider)),
    ).toBe('FORBIDDEN');
  });
});
