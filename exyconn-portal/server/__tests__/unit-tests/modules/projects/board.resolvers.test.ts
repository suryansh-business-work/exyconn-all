import { Types } from 'mongoose';
import { actorOf, boardResolvers } from '../../../../src/modules/projects/board.resolvers';
import { TaskCommentModel, TaskModel } from '../../../../src/modules/projects/board.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { addTicket, boardWithLead, ctxFor, missingId, seedMember } from './projects.fixtures';

const { Query, Mutation } = boardResolvers;

/** A ticket with one comment on it, written by the lead. */
async function commented() {
  const setup = await boardWithLead();
  const raised = await addTicket(setup.ctx, setup.projectId, setup.todo.id, { title: 'Blank' });
  const comment = await Mutation.addTaskComment(
    null,
    { taskId: raised.id, body: 'Reproduced.', attachments: null },
    setup.ctx,
  );
  return { ...setup, raised, comment };
}

describe('board queries', () => {
  it('lists a project’s tickets newest first', async () => {
    const { ctx, projectId, todo } = await boardWithLead();
    const older = await addTicket(ctx, projectId, todo.id, { title: 'Older' });
    const newer = await addTicket(ctx, projectId, todo.id, { title: 'Newer' });
    await TaskModel.collection.updateOne(
      { _id: new Types.ObjectId(older.id) },
      { $set: { createdAt: new Date('2000-01-01T00:00:00.000Z') } },
    );

    const tasks = await Query.projectTasks(null, { projectId }, ctx);

    expect(tasks.map((task) => task.id)).toEqual([newer.id, older.id]);
    expect(tasks[0].columnId).toBe(todo.id);
  });

  it('lists the active people with the Projects role, by name', async () => {
    const { ctx } = await boardWithLead();
    await seedMember('adam@exyconn.com');
    await seedMember('hr@exyconn.com', [ROLES.HR]);
    const { user: gone } = await seedMember('gone@exyconn.com');
    await UserModel.updateOne({ _id: gone._id }, { isActive: false });

    const members = await Query.listProjectMembers(null, {}, ctx);

    expect(members.map((member) => member.name)).toEqual(['adam', 'lead']);
    expect(typeof members[0].id).toBe('string');
  });

  it('refuses somebody without the Projects role', async () => {
    const { projectId } = await boardWithLead();
    const outsider = ctxFor(missingId(), [ROLES.HR]);

    expect(await codeOf(Query.projectBoard(null, { projectId }, outsider))).toBe('FORBIDDEN');
  });
});

describe('who is acting', () => {
  it('refuses a request with no signed-in person', async () => {
    expect(await codeOf(actorOf({ user: null }))).toBe('UNAUTHENTICATED');
  });

  it('refuses a token that carries no user id', async () => {
    expect(await codeOf(actorOf(ctxFor('')))).toBe('UNAUTHENTICATED');
  });

  it('falls back to the token’s email when the account has gone', async () => {
    expect(await actorOf(ctxFor(missingId(), [ROLES.PROJECTS], 'old@exyconn.com'))).toMatchObject({
      name: 'old@exyconn.com',
    });
  });

  it('reads an empty name when the account has gone and the token has no email', async () => {
    const id = missingId();
    const ctx: GraphQLContext = {
      user: { id, roles: [ROLES.PROJECTS], email: undefined as unknown as string },
    };

    expect(await actorOf(ctx)).toEqual({ id, name: '' });
  });

  it('stores no assignee name for an id that matches nobody', async () => {
    const { ctx, projectId, todo } = await boardWithLead();

    const raised = await addTicket(ctx, projectId, todo.id, {
      title: 'Ghost owner',
      assigneeId: missingId(),
    });

    expect(raised.assigneeName).toBe('');
  });
});

describe('deleting a comment', () => {
  it('lets the author take their own comment down', async () => {
    const { ctx, comment } = await commented();

    await expect(Mutation.deleteTaskComment(null, { id: comment.id }, ctx)).resolves.toBe(true);
    expect(await TaskCommentModel.countDocuments()).toBe(0);
  });

  it('stores a comment sent with no attachments as having none', async () => {
    const { comment } = await commented();

    expect(comment.attachments).toEqual([]);
    expect(typeof comment.taskId).toBe('string');
  });

  it('refuses anybody else on the project', async () => {
    const { comment } = await commented();
    const { ctx: dev } = await seedMember('dev@exyconn.com');

    expect(await codeOf(Mutation.deleteTaskComment(null, { id: comment.id }, dev))).toBe(
      'FORBIDDEN',
    );
    expect(await TaskCommentModel.countDocuments()).toBe(1);
  });

  it('lets an administrator take any comment down', async () => {
    const { comment } = await commented();
    const admin = ctxFor(missingId(), [ROLES.ADMIN], 'admin@exyconn.com');

    await expect(Mutation.deleteTaskComment(null, { id: comment.id }, admin)).resolves.toBe(true);
  });

  it('refuses a comment that does not exist', async () => {
    const { ctx } = await boardWithLead();

    expect(await codeOf(Mutation.deleteTaskComment(null, { id: missingId() }, ctx))).toBe(
      'NOT_FOUND',
    );
  });
});
