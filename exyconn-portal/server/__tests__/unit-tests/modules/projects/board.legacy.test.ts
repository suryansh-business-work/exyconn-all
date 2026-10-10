import { boardResolvers } from '../../../../src/modules/projects/board.resolvers';
import { boardService } from '../../../../src/modules/projects/board.service';
import { TaskModel } from '../../../../src/modules/projects/board.model';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
import { projectView } from '../../../../src/modules/projects/share.service';
import { addTicket, boardWithLead } from './projects.fixtures';

const { Query, Mutation } = boardResolvers;

describe('the comments of a ticket', () => {
  it('lists them oldest first, with the ticket id as a plain string', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Blank' });
    await Mutation.addTaskComment(
      null,
      { taskId: raised.id, body: 'Reproduced.', attachments: null },
      ctx,
    );
    await Mutation.addTaskComment(
      null,
      { taskId: raised.id, body: 'Fixed.', attachments: null },
      ctx,
    );

    const comments = await Query.taskComments(null, { taskId: raised.id }, ctx);

    expect(comments.map((comment) => comment.body)).toEqual(['Reproduced.', 'Fixed.']);
    expect(comments[0].taskId).toBe(raised.id);
  });
});

describe('editing a ticket stored before assignees existed', () => {
  it('saves the change and treats the missing assignee as nobody', async () => {
    const { lead, ctx, projectId, todo } = await boardWithLead();
    const raised = await addTicket(ctx, projectId, todo.id, { title: 'Blank' });
    await TaskModel.updateOne({ _id: raised.id }, { $unset: { assigneeId: 1 } });

    const saved = await boardService.updateTask(raised.id, { title: 'Renamed' }, '', {
      id: lead.id,
      name: 'lead',
    });

    expect(saved).toMatchObject({ title: 'Renamed' });
  });
});

describe('the client view of a project stored without a client name', () => {
  it('shows an empty client name', async () => {
    const created = await ProjectModel.create({ name: 'Billing', status: 'ACTIVE' });
    await ProjectModel.updateOne({ _id: created._id }, { $unset: { clientName: 1 } });
    const stored = await ProjectModel.findById(created._id).lean();

    const view = await projectView(stored as NonNullable<typeof stored>);

    expect(view).toMatchObject({ name: 'Billing', clientName: '' });
  });
});
