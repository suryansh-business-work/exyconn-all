import { boardService, type Actor, type TaskInput } from './board.service';
import { assertRole } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { UserModel } from '../admin/user.model';
import { unauthenticated } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.PROJECTS]);

type WithId = { _id: unknown };
type TaskShape = WithId & { columnId: { toString(): string } };
type CommentShape = WithId & { taskId: { toString(): string } };

/**
 * Tickets and comments carry ObjectId references that must be strings for a GraphQL ID.
 * Generic so the document's own fields survive: a serializer that narrowed its result to the
 * ids would hide every ticket field from the callers that read them.
 */
const serializeTask = <T extends TaskShape>(t: T) => ({
  ...withId(t),
  columnId: t.columnId.toString(),
});
const serializeTasks = <T extends TaskShape>(tasks: T[]) => tasks.map((t) => serializeTask(t));
const serializeComment = <T extends CommentShape>(c: T) => ({
  ...withId(c),
  taskId: c.taskId.toString(),
});

/** Who is acting, from the request's own token — never from anything the client sent. */
async function actorOf(ctx: GraphQLContext): Promise<Actor> {
  const id = ctx.user?.id;
  if (!id) {
    unauthenticated();
  }
  const user = await UserModel.findById(id).select('name').lean();
  return { id, name: user?.name ?? ctx.user?.email ?? '' };
}

/**
 * The name to store beside an assignee id. Denormalised so a board of dozens of cards
 * renders without a join, and resolved from the database so it cannot be spoofed.
 */
async function assigneeNameOf(assigneeId?: string | null): Promise<string> {
  if (!assigneeId) {
    return '';
  }
  const user = await UserModel.findById(assigneeId).select('name').lean();
  return user?.name ?? '';
}

export const boardResolvers = {
  Query: {
    projectBoard: async (
      _p: unknown,
      { projectId }: { projectId: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const { columns, tasks } = await boardService.board(projectId);
      return { columns: withIds(columns), tasks: serializeTasks(tasks) };
    },
    projectTasks: async (
      _p: unknown,
      { projectId }: { projectId: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return serializeTasks(await boardService.tasks(projectId));
    },
    taskComments: async (_p: unknown, { taskId }: { taskId: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return (await boardService.comments(taskId)).map((c) => serializeComment(c));
    },
    listProjectMembers: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      guard(ctx);
      const members = await UserModel.find({ roles: ROLES.PROJECTS, isActive: true })
        .select('name email')
        .sort({ name: 1 })
        .lean();
      return withIds(members);
    },
  },
  Mutation: {
    createColumn: async (
      _p: unknown,
      { projectId, name }: { projectId: string; name: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return withId(await boardService.createColumn(projectId, name));
    },
    renameColumn: async (
      _p: unknown,
      { id, name }: { id: string; name: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return withId(await boardService.renameColumn(id, name));
    },
    deleteColumn: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return boardService.deleteColumn(id);
    },
    reorderColumns: async (
      _p: unknown,
      { projectId, columnIds }: { projectId: string; columnIds: string[] },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return boardService.reorderColumns(projectId, columnIds);
    },
    createTask: async (
      _p: unknown,
      args: { projectId: string; columnId: string; input: TaskInput },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const [reporter, assigneeName] = await Promise.all([
        actorOf(ctx),
        assigneeNameOf(args.input.assigneeId),
      ]);
      const task = await boardService.createTask(
        args.projectId,
        args.columnId,
        args.input,
        reporter,
        assigneeName,
      );
      return serializeTask(task);
    },
    updateTask: async (
      _p: unknown,
      { id, input }: { id: string; input: TaskInput },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const assigneeName = await assigneeNameOf(input.assigneeId);
      return serializeTask(await boardService.updateTask(id, input, assigneeName));
    },
    deleteTask: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return boardService.deleteTask(id);
    },
    moveTask: async (
      _p: unknown,
      { id, toColumnId, toIndex }: { id: string; toColumnId: string; toIndex: number },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return boardService.moveTask(id, toColumnId, toIndex);
    },
    addTaskComment: async (
      _p: unknown,
      { taskId, body }: { taskId: string; body: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const author = await actorOf(ctx);
      return serializeComment(await boardService.addComment(taskId, body, author));
    },
    deleteTaskComment: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return boardService.deleteComment(id);
    },
  },
};
