import { Types } from 'mongoose';
import { ticketService } from '../../../../src/modules/projects/ticket.service';
import {
  BoardColumnModel,
  TaskActivityModel,
  TaskModel,
} from '../../../../src/modules/projects/board.model';
import { NotificationModel } from '../../../../src/modules/notifications/notification.model';
import { ROLES } from '../../../../src/constants/roles';
import { asArg } from '../../../mockAs';
import { codeOf } from '../codeOf';
import { addColumn, addTicket, boardWithLead, missingId, seedMember } from './projects.fixtures';

/** A board with one ticket on it, raised by the lead. */
async function ticketOnBoard() {
  const setup = await boardWithLead();
  const raised = await addTicket(setup.ctx, setup.projectId, setup.todo.id, {
    title: 'Invoice PDF is blank',
  });
  return { ...setup, raised, actor: { id: setup.lead.id, name: 'lead' } };
}

const trail = (taskId: string) => TaskActivityModel.find({ taskId }).lean();
const noticesFor = (employeeId: string) => NotificationModel.find({ employeeId }).lean();

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ticketService lookups', () => {
  it('finds a ticket by a hand-typed key in any case', async () => {
    const { raised } = await ticketOnBoard();

    const found = await ticketService.byKey(`  ${raised.key.toLowerCase()} `);

    expect(found?._id.toHexString()).toBe(raised.id);
    expect(await ticketService.byKey('NOPE-1')).toBeNull();
  });

  it('lists a project’s columns in board order', async () => {
    const { ctx, projectId } = await boardWithLead();
    await addColumn(ctx, projectId, 'Doing');
    await addColumn(ctx, projectId, 'Done');

    const columns = await ticketService.columns(projectId);

    expect(columns.map((column) => column.name)).toEqual(['To do', 'Doing', 'Done']);
  });
});

describe('ticketService.setVisibility', () => {
  it('makes a ticket public with a fresh token and records the switch', async () => {
    const { raised, actor } = await ticketOnBoard();

    const shown = await ticketService.setVisibility(raised.id, 'PUBLIC', actor);

    expect(shown.visibility).toBe('PUBLIC');
    expect(shown.publicToken).toMatch(/^[\da-f]{64}$/);
    const lines = (await trail(raised.id)).filter((line) => line.field === 'visibility');
    expect(lines.map((line) => [line.fromValue, line.toValue])).toEqual([['PRIVATE', 'PUBLIC']]);
  });

  it('issues a new token every time the ticket goes public again', async () => {
    const { raised, actor } = await ticketOnBoard();
    const first = await ticketService.setVisibility(raised.id, 'PUBLIC', actor);

    const hidden = await ticketService.setVisibility(raised.id, 'PRIVATE', actor);
    const again = await ticketService.setVisibility(raised.id, 'PUBLIC', actor);

    expect(hidden.publicToken).toBeNull();
    expect(again.publicToken).not.toBe(first.publicToken);
  });

  it('changes and records nothing when the ticket already has that visibility', async () => {
    const { raised, actor } = await ticketOnBoard();
    const before = await trail(raised.id);

    const same = await ticketService.setVisibility(raised.id, 'PRIVATE', actor);

    expect(same.publicToken).toBeNull();
    expect(await trail(raised.id)).toHaveLength(before.length);
  });

  it('reads a ticket saved before visibility existed as private', async () => {
    const { raised, actor } = await ticketOnBoard();
    await TaskModel.collection.updateOne(
      { _id: new Types.ObjectId(raised.id) },
      { $unset: { visibility: '' } },
    );

    await ticketService.setVisibility(raised.id, 'PUBLIC', actor);

    const line = (await trail(raised.id)).find((row) => row.field === 'visibility');
    expect(line?.fromValue).toBe('PRIVATE');
  });

  it('answers not found for a ticket that is not there', async () => {
    expect(
      await codeOf(ticketService.setVisibility(missingId(), 'PUBLIC', { id: 'a', name: 'A' })),
    ).toBe('NOT_FOUND');
  });

  it('answers not found when the ticket is deleted while it is being switched', async () => {
    const { raised, actor } = await ticketOnBoard();
    const realUpdateOne = TaskModel.updateOne.bind(TaskModel) as (
      ...args: unknown[]
    ) => Promise<unknown>;
    // Somebody deletes the ticket at the very moment it is switched.
    const deleteThenUpdate = (...args: unknown[]) =>
      TaskModel.deleteOne({ _id: raised.id }).then(() => realUpdateOne(...args));
    jest.spyOn(TaskModel, 'updateOne').mockImplementationOnce(asArg(deleteThenUpdate));

    expect(await codeOf(ticketService.setVisibility(raised.id, 'PUBLIC', actor))).toBe('NOT_FOUND');
  });
});

describe('ticketService.share', () => {
  it('tells each chosen Projects user once, with the note, and records who', async () => {
    const { raised, actor } = await ticketOnBoard();
    const { user: dev } = await seedMember('dev@exyconn.com');
    const { user: qa } = await seedMember('qa@exyconn.com');

    const told = await ticketService.share(
      raised.id,
      [dev.id, qa.id, dev.id, actor.id],
      '  Can you check this? ',
      actor,
    );

    expect(told).toBe(2);
    const [notice] = await noticesFor(dev.id);
    expect(notice.title).toBe(`${raised.key} was shared with you`);
    expect(notice.body).toBe('lead shared "Invoice PDF is blank" with you. "Can you check this?"');
    expect(notice.link).toBe(`/projects/browse/${raised.key}`);
    expect(await noticesFor(qa.id)).toHaveLength(1);
    expect(await noticesFor(actor.id)).toHaveLength(0);
    const line = (await trail(raised.id)).find((row) => row.field === 'shared with');
    expect(line?.toValue).toBe('dev, qa');
  });

  it('sends the plain notice when there is no note', async () => {
    const { raised, actor } = await ticketOnBoard();
    const { user: dev } = await seedMember('dev@exyconn.com');

    await ticketService.share(raised.id, [dev.id], '   ', actor);

    const [notice] = await noticesFor(dev.id);
    expect(notice.body).toBe('lead shared "Invoice PDF is blank" with you.');
  });

  it('refuses when nobody chosen could open Projects', async () => {
    const { raised, actor } = await ticketOnBoard();
    const { user: hr } = await seedMember('hr@exyconn.com', [ROLES.HR]);

    expect(await codeOf(ticketService.share(raised.id, [hr.id, actor.id], '', actor))).toBe(
      'BAD_USER_INPUT',
    );
    expect(await NotificationModel.countDocuments()).toBe(0);
  });

  it.each([
    ['nobody', []],
    ['more than fifty people', Array.from({ length: 51 }, () => missingId())],
  ])('refuses sharing with %s', async (_label, recipients) => {
    const { raised, actor } = await ticketOnBoard();

    expect(await codeOf(ticketService.share(raised.id, recipients, '', actor))).toBe(
      'BAD_USER_INPUT',
    );
  });

  it('refuses a note over 500 characters, and takes one of exactly 500', async () => {
    const { raised, actor } = await ticketOnBoard();
    const { user: dev } = await seedMember('dev@exyconn.com');

    expect(await codeOf(ticketService.share(raised.id, [dev.id], 'x'.repeat(501), actor))).toBe(
      'BAD_USER_INPUT',
    );
    expect(await ticketService.share(raised.id, [dev.id], 'x'.repeat(500), actor)).toBe(1);
  });

  it('answers not found for a ticket that is not there', async () => {
    const { user: dev } = await seedMember('dev@exyconn.com');

    expect(
      await codeOf(ticketService.share(missingId(), [dev.id], '', { id: 'a', name: 'A' })),
    ).toBe('NOT_FOUND');
  });
});

describe('ticketService.publicTask', () => {
  it('shows a public ticket with its project, column and people', async () => {
    const { raised, actor, ctx, projectId } = await ticketOnBoard();
    await TaskModel.updateOne(
      { _id: raised.id },
      {
        description: '<p>Blank</p>',
        assigneeName: 'Dev',
        labels: ['billing'],
        dueDate: new Date('2026-11-01T00:00:00.000Z'),
      },
    );
    const done = await addColumn(ctx, projectId, 'Done');
    await BoardColumnModel.updateOne({ _id: done.id }, { isDone: true });
    await TaskModel.updateOne({ _id: raised.id }, { columnId: done.id });
    const { publicToken } = await ticketService.setVisibility(raised.id, 'PUBLIC', actor);

    const view = await ticketService.publicTask(String(publicToken));

    expect(view).toMatchObject({
      key: raised.key,
      title: 'Invoice PDF is blank',
      description: '<p>Blank</p>',
      type: 'TASK',
      priority: 'MEDIUM',
      status: 'Done',
      isDone: true,
      assigneeName: 'Dev',
      labels: ['billing'],
      dueDate: new Date('2026-11-01T00:00:00.000Z'),
      projectName: 'Billing',
    });
    expect(view?.updatedAt).toBeInstanceOf(Date);
    expect(view).not.toHaveProperty('publicToken');
  });

  it('fills the gaps of an old row whose project and column have gone', async () => {
    const token = 'a'.repeat(64);
    await TaskModel.collection.insertOne({
      projectId: new Types.ObjectId(),
      columnId: new Types.ObjectId(),
      key: 'OLD-1',
      title: 'Old',
      type: 'BUG',
      priority: 'LOW',
      visibility: 'PUBLIC',
      publicToken: token,
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    expect(await ticketService.publicTask(token)).toEqual({
      key: 'OLD-1',
      title: 'Old',
      description: '',
      type: 'BUG',
      priority: 'LOW',
      status: '',
      isDone: false,
      assigneeName: '',
      labels: [],
      dueDate: null,
      projectName: '',
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    });
  });

  it('answers null for a ticket made private since, an unknown token, or a malformed one', async () => {
    const { raised, actor } = await ticketOnBoard();
    const { publicToken } = await ticketService.setVisibility(raised.id, 'PUBLIC', actor);
    await ticketService.setVisibility(raised.id, 'PRIVATE', actor);

    expect(await ticketService.publicTask(String(publicToken))).toBeNull();
    expect(await ticketService.publicTask('b'.repeat(64))).toBeNull();
    expect(await ticketService.publicTask('short')).toBeNull();
  });
});
