import { boardResolvers } from '../../../../src/modules/projects/board.resolvers';
import { BoardColumnModel, TaskModel } from '../../../../src/modules/projects/board.model';
import { codeOf } from '../codeOf';
import { addColumn, addTicket, boardWithLead, missingId, newProject } from './projects.fixtures';

const mutation = boardResolvers.Mutation;

/** The columns of a project in the order the board draws them. */
const columnNames = async (projectId: string) =>
  (await BoardColumnModel.find({ projectId }).sort({ order: 1 }).lean()).map((c) => c.name);

describe('board columns', () => {
  it('appends each new column after the ones already on the board', async () => {
    const { ctx, projectId, todo } = await boardWithLead();

    const doing = await addColumn(ctx, projectId, 'Doing');

    expect(todo.order).toBe(0);
    expect(doing.order).toBe(1);
    expect(doing.isDone).toBe(false);
  });

  it('renames a column', async () => {
    const { ctx, todo } = await boardWithLead();

    const renamed = await mutation.renameColumn(null, { id: todo.id, name: 'Backlog' }, ctx);

    expect(renamed).toMatchObject({ id: todo.id, name: 'Backlog' });
  });

  it('marks a column as the end of the line, and can take that back', async () => {
    const { ctx, todo } = await boardWithLead();

    const done = await mutation.setColumnDone(null, { id: todo.id, isDone: true }, ctx);
    expect(done.isDone).toBe(true);

    const undone = await mutation.setColumnDone(null, { id: todo.id, isDone: false }, ctx);
    expect(undone.isDone).toBe(false);
  });

  it('refuses to rename, mark or delete a column that does not exist', async () => {
    const { ctx } = await boardWithLead();
    const id = missingId();

    expect(await codeOf(mutation.renameColumn(null, { id, name: 'Ghost' }, ctx))).toBe('NOT_FOUND');
    expect(await codeOf(mutation.setColumnDone(null, { id, isDone: true }, ctx))).toBe('NOT_FOUND');
    expect(await codeOf(mutation.deleteColumn(null, { id }, ctx))).toBe('NOT_FOUND');
  });

  it('deletes a column together with its tickets, leaving the other columns alone', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const doing = await addColumn(ctx, projectId, 'Doing');
    await addTicket(ctx, projectId, todo.id, { title: 'Goes with its column' });
    const kept = await addTicket(ctx, projectId, doing.id, { title: 'Stays' });

    await expect(mutation.deleteColumn(null, { id: todo.id }, ctx)).resolves.toBe(true);

    expect(await columnNames(projectId)).toEqual(['Doing']);
    expect((await TaskModel.find({ projectId }).lean()).map((t) => String(t._id))).toEqual([
      kept.id,
    ]);
  });

  it('reorders the columns of the named project only', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const doing = await addColumn(ctx, projectId, 'Doing');
    const done = await addColumn(ctx, projectId, 'Done');
    const other = await newProject('Website');
    const foreign = await addColumn(ctx, other.id, 'Elsewhere');

    const columnIds = [done.id, todo.id, foreign.id, doing.id];
    await expect(mutation.reorderColumns(null, { projectId, columnIds }, ctx)).resolves.toBe(true);

    expect(await columnNames(projectId)).toEqual(['Done', 'To do', 'Doing']);
    expect((await BoardColumnModel.findById(foreign.id).lean())?.order).toBe(0);
  });

  it('serves the board as columns and tickets with string ids', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Invoice PDF is blank' });

    const board = await boardResolvers.Query.projectBoard(null, { projectId }, ctx);

    expect(board.columns.map((column) => column.id)).toEqual([todo.id]);
    expect(board.tasks).toHaveLength(1);
    expect(board.tasks[0]).toMatchObject({ id: raised.id, columnId: todo.id });
  });
});
