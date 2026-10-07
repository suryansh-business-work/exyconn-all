import { Types } from 'mongoose';
import { boardResolvers } from '../../../../src/modules/projects/board.resolvers';
import { boardService } from '../../../../src/modules/projects/board.service';
import { TaskActivityModel, TaskModel } from '../../../../src/modules/projects/board.model';
import { codeOf } from '../codeOf';
import { addTicket, boardWithLead, missingId, seedMember } from './projects.fixtures';

const DUE = new Date('2026-11-30T00:00:00.000Z');
const spec = {
  url: 'https://ik.example/spec.pdf',
  name: 'spec.pdf',
  contentType: 'application/pdf',
};

/** The trail of one ticket, oldest first, minus the line written when it was raised. */
const changesOf = async (taskId: string) =>
  (await TaskActivityModel.find({ taskId }).sort({ createdAt: 1, _id: 1 }).lean()).filter(
    (entry) => entry.field !== 'created',
  );

afterEach(() => jest.restoreAllMocks());

describe('raising a ticket', () => {
  it('refuses a ticket on a project that does not exist', async () => {
    const { ctx, todo } = await boardWithLead();

    const attempt = addTicket(ctx, missingId(), todo.id, { title: 'Orphan' });

    expect(await codeOf(attempt)).toBe('NOT_FOUND');
    expect(await TaskModel.countDocuments()).toBe(0);
  });

  it('stamps files attached at creation with the reporter', async () => {
    const { ctx, projectId, todo } = await boardWithLead();

    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Spec', attachments: [spec] });

    expect(raised.attachments).toHaveLength(1);
    expect(raised.attachments[0]).toMatchObject({ name: 'spec.pdf', uploadedByName: 'lead' });
    expect(raised.attachments[0].uploadedAt).toBeInstanceOf(Date);
  });

  it('keeps the ticket when its history line cannot be written', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(TaskActivityModel, 'create').mockRejectedValueOnce(new Error('disk full'));

    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Still saved' });

    expect(await TaskModel.findById(raised.id).lean()).not.toBeNull();
    expect(logged).toHaveBeenCalledWith('Could not record ticket history', expect.any(Error));
  });
});

describe('editing a ticket', () => {
  it('records labels, story points and due dates as short plain text', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Invoice PDF' });

    await boardResolvers.Mutation.updateTask(
      null,
      {
        id: raised.id,
        input: { title: raised.title, labels: ['billing', 'pdf'], storyPoints: 5, dueDate: DUE },
      },
      ctx,
    );

    const byField = new Map((await changesOf(raised.id)).map((entry) => [entry.field, entry]));
    expect(byField.get('labels')).toMatchObject({ fromValue: '', toValue: 'billing, pdf' });
    expect(byField.get('story points')).toMatchObject({ fromValue: '', toValue: '5' });
    expect(byField.get('due date')).toMatchObject({ fromValue: '', toValue: '2026-11-30' });
  });

  it('takes a ticket off its assignee when the id is cleared', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const { user: dev } = await seedMember('dev@exyconn.com');
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Blank', assigneeId: dev.id });

    const cleared = await boardResolvers.Mutation.updateTask(
      null,
      { id: raised.id, input: { title: 'Blank', assigneeId: null } },
      ctx,
    );

    expect(cleared).toMatchObject({ assigneeId: '', assigneeName: '' });
    const [change] = await changesOf(raised.id);
    expect(change).toMatchObject({ field: 'assignee', fromValue: 'dev', toValue: '' });
  });

  it('leaves the assignee alone when the service is given no name to store', async () => {
    const { ctx, lead, projectId, todo } = await boardWithLead();
    const { user: dev } = await seedMember('dev@exyconn.com');
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Blank', assigneeId: dev.id });
    const actor = { id: lead.id, name: 'lead' };

    const saved = await boardService.updateTask(
      raised.id,
      { title: 'Renamed', assigneeId: missingId() },
      undefined as unknown as string,
      actor,
    );

    expect(saved).toMatchObject({ title: 'Renamed', assigneeId: dev.id, assigneeName: 'dev' });
  });

  it('refuses to edit a ticket that does not exist', async () => {
    const { lead } = await boardWithLead();
    const actor = { id: lead.id, name: 'lead' };

    expect(await codeOf(boardService.updateTask(missingId(), { title: 'x' }, '', actor))).toBe(
      'NOT_FOUND',
    );
  });

  it('refuses an edit to a ticket deleted between the read and the write', async () => {
    const { ctx, lead, projectId, todo } = await boardWithLead();
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Racing' });
    jest
      .spyOn(TaskModel, 'findByIdAndUpdate')
      .mockReturnValueOnce({ lean: () => Promise.resolve(null) } as never);

    const attempt = boardService.updateTask(raised.id, { title: 'x' }, '', {
      id: lead.id,
      name: 'lead',
    });

    expect(await codeOf(attempt)).toBe('NOT_FOUND');
    expect(await changesOf(raised.id)).toHaveLength(0);
  });

  it('diffs files saved before every file carried a url or a name', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Legacy files' });
    const anonUrl = 'https://ik.example/anon.pdf';
    await TaskModel.collection.updateOne(
      { _id: new Types.ObjectId(raised.id) },
      { $set: { attachments: [{ name: 'old.pdf' }, { url: anonUrl }] } },
    );

    const saved = await boardResolvers.Mutation.updateTask(
      null,
      { id: raised.id, input: { title: raised.title, attachments: [{ url: anonUrl, name: 'a' }] } },
      ctx,
    );

    expect(saved.attachments).toHaveLength(1);
    expect(saved.attachments[0]).toMatchObject({ name: 'a', uploadedByName: 'lead' });
    expect(saved.attachments[0].uploadedAt).toBeInstanceOf(Date);
    const trail = (await changesOf(raised.id)).map((e) => [e.field, e.fromValue, e.toValue]);
    expect(trail).toEqual([
      ['attachment', '', 'a'],
      ['attachment', 'old.pdf', ''],
      ['attachment', '', ''],
    ]);
  });

  it('records a first file on a ticket written before attachments existed', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Older still' });
    await TaskModel.collection.updateOne(
      { _id: new Types.ObjectId(raised.id) },
      { $unset: { attachments: 1 } },
    );

    await boardResolvers.Mutation.updateTask(
      null,
      { id: raised.id, input: { title: raised.title, attachments: [spec] } },
      ctx,
    );

    const trail = (await changesOf(raised.id)).map((e) => [e.field, e.fromValue, e.toValue]);
    expect(trail).toEqual([['attachment', '', 'spec.pdf']]);
  });
});
