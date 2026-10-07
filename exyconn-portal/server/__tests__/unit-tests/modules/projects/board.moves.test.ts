import { boardService } from '../../../../src/modules/projects/board.service';
import {
  BoardColumnModel,
  TaskActivityModel,
  TaskCommentModel,
  TaskModel,
} from '../../../../src/modules/projects/board.model';
import { codeOf } from '../codeOf';
import { addColumn, addTicket, boardWithLead, missingId } from './projects.fixtures';

/** Ticket titles in a column, in the order the board draws them. */
const titlesIn = async (columnId: string) =>
  (await TaskModel.find({ columnId }).sort({ order: 1 }).lean()).map((task) => task.title);

/** A To do column holding First, Second and Third, in that order. */
async function threeTickets() {
  const setup = await boardWithLead();
  const { ctx, projectId, todo } = setup;
  const first = await addTicket(ctx, projectId, todo.id, { title: 'First' });
  const second = await addTicket(ctx, projectId, todo.id, { title: 'Second' });
  const third = await addTicket(ctx, projectId, todo.id, { title: 'Third' });
  return { ...setup, actor: { id: setup.lead.id, name: 'lead' }, first, second, third };
}

describe('moving a ticket', () => {
  it('puts an index past the end at the bottom of the column', async () => {
    const { todo, actor, first } = await threeTickets();

    await boardService.moveTask(first.id, todo.id, 99, actor);

    expect(await titlesIn(todo.id)).toEqual(['Second', 'Third', 'First']);
  });

  it('puts a negative index at the top of the column', async () => {
    const { todo, actor, third } = await threeTickets();

    await boardService.moveTask(third.id, todo.id, -4, actor);

    expect(await titlesIn(todo.id)).toEqual(['Third', 'First', 'Second']);
  });

  it('closes the gap a ticket leaves behind in its old column', async () => {
    const { ctx, projectId, todo, actor, second } = await threeTickets();
    const doing = await addColumn(ctx, projectId, 'Doing');

    await boardService.moveTask(second.id, doing.id, 0, actor);

    const left = await TaskModel.find({ columnId: todo.id }).sort({ order: 1 }).lean();
    expect(left.map((task) => [task.title, task.order])).toEqual([
      ['First', 0],
      ['Third', 1],
    ]);
  });

  it('records a move out of a column that has since been deleted with an empty name', async () => {
    const { ctx, projectId, todo, actor, first } = await threeTickets();
    const doing = await addColumn(ctx, projectId, 'Doing');
    await BoardColumnModel.deleteOne({ _id: todo.id });

    await boardService.moveTask(first.id, doing.id, 0, actor);

    const [line] = await TaskActivityModel.find({ taskId: first.id, field: 'column' }).lean();
    expect(line).toMatchObject({ fromValue: '', toValue: 'Doing' });
  });

  it('records a move into a column it cannot find with an empty name', async () => {
    const { todo, actor, first } = await threeTickets();
    const nowhere = missingId();

    await expect(boardService.moveTask(first.id, nowhere, 0, actor)).resolves.toBe(true);

    const [line] = await TaskActivityModel.find({ taskId: first.id, field: 'column' }).lean();
    expect(line).toMatchObject({ fromValue: 'To do', toValue: '' });
    expect(await titlesIn(nowhere)).toEqual(['First']);
    expect(await titlesIn(todo.id)).toEqual(['Second', 'Third']);
  });

  it('refuses to move a ticket that does not exist', async () => {
    const { todo, actor } = await threeTickets();

    expect(await codeOf(boardService.moveTask(missingId(), todo.id, 0, actor))).toBe('NOT_FOUND');
  });
});

describe('taking things off the board', () => {
  it('refuses to delete a ticket that does not exist', async () => {
    expect(await codeOf(boardService.deleteTask(missingId()))).toBe('NOT_FOUND');
  });

  it('refuses a comment on a ticket that does not exist, and stores nothing', async () => {
    const { actor } = await threeTickets();

    expect(await codeOf(boardService.addComment(missingId(), 'Hello?', actor))).toBe('NOT_FOUND');
    expect(await TaskCommentModel.countDocuments()).toBe(0);
  });

  it('stamps a comment’s files with its author', async () => {
    const { actor, first } = await threeTickets();
    const file = { url: 'https://ik.example/log.txt', name: 'log.txt' };

    const comment = await boardService.addComment(first.id, 'Logs attached', actor, [file]);

    expect(comment.attachments).toHaveLength(1);
    expect(comment.attachments[0]).toMatchObject({ name: 'log.txt', uploadedByName: 'lead' });
  });

  it('refuses to delete a comment that does not exist', async () => {
    expect(await codeOf(boardService.deleteComment(missingId()))).toBe('NOT_FOUND');
  });
});
