import { ticketService, type TaskVisibility } from './ticket.service';
import { actorOf, serializeTask } from './board.resolvers';
import { assertPermission } from '../../lib/permissions';
import type { PermissionAction } from '../permissions/permission.model';
import { withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { env } from '../../config/env';
import type { GraphQLContext } from '../../middleware/auth';

/** Project data: the PROJECTS role, then whatever the admin matrix leaves it on Project. */
const guard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, 'Project', [ROLES.PROJECTS], action);

/** The ticket fields the computed ones below are read from. */
interface TaskSource {
  projectId: { toString(): string };
  visibility?: string | null;
  publicToken?: string | null;
}

/** Public tickets open on the status site — the one app with no sign-in, as project shares do. */
const publicUrlOf = (token: string) => `${env.projectShareBaseUrl}/ticket/${token}`;

export const ticketResolvers = {
  Task: {
    projectId: (task: TaskSource) => task.projectId.toString(),
    /** Written before visibility existed, a `.lean()` row comes back without it. */
    visibility: (task: TaskSource) => task.visibility ?? 'PRIVATE',
    publicUrl: (task: TaskSource) =>
      task.visibility === 'PUBLIC' && task.publicToken ? publicUrlOf(task.publicToken) : null,
  },
  Query: {
    taskByKey: async (_p: unknown, { key }: { key: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      const task = await ticketService.byKey(key);
      return task ? serializeTask(task) : null;
    },
    projectColumns: async (
      _p: unknown,
      { projectId }: { projectId: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      return withIds(await ticketService.columns(projectId));
    },
    /** Public: whoever holds a public link has no portal account, by design. */
    publicTask: (_p: unknown, { token }: { token: string }) => ticketService.publicTask(token),
  },
  Mutation: {
    setTaskVisibility: async (
      _p: unknown,
      { id, visibility }: { id: string; visibility: TaskVisibility },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      const task = await ticketService.setVisibility(id, visibility, await actorOf(ctx));
      return serializeTask(task);
    },
    shareTask: async (
      _p: unknown,
      args: { id: string; recipientIds: string[]; note?: string | null },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      return ticketService.share(args.id, args.recipientIds, args.note ?? '', await actorOf(ctx));
    },
  },
};
