import { boardService } from './board.service';
import { assertRole } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.PROJECTS]);

type WithId = { _id: unknown };
type TaskShape = WithId & { columnId: { toString(): string } };

/** Tasks carry a `columnId` ObjectId that must be a string for the GraphQL ID. */
const serializeTask = (t: TaskShape) => ({ ...withId(t), columnId: t.columnId.toString() });
const serializeTasks = (tasks: TaskShape[]) => tasks.map(serializeTask);

export const boardResolvers = {
  Query: {
    projectBoard: async (
      _p: unknown,
      { projectId }: { projectId: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const { columns, tasks } = await boardService.board(projectId);
      return {
        columns: withIds(columns as WithId[]),
        tasks: serializeTasks(tasks as TaskShape[]),
      };
    },
  },
  Mutation: {
    createColumn: async (
      _p: unknown,
      { projectId, name }: { projectId: string; name: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return withId((await boardService.createColumn(projectId, name)) as WithId);
    },
    renameColumn: async (
      _p: unknown,
      { id, name }: { id: string; name: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return withId((await boardService.renameColumn(id, name)) as WithId);
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
      args: { projectId: string; columnId: string; title: string; description?: string | null },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const task = await boardService.createTask(
        args.projectId,
        args.columnId,
        args.title,
        args.description,
      );
      return serializeTask(task as TaskShape);
    },
    updateTask: async (
      _p: unknown,
      { id, title, description }: { id: string; title?: string; description?: string | null },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return serializeTask(
        (await boardService.updateTask(id, { title, description })) as TaskShape,
      );
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
  },
};
