import { docsService } from './docs.service';
import { assertPermission } from '../../lib/permissions';
import type { PermissionAction } from '../permissions/permission.model';
import { withId } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { UserModel } from '../admin/user.model';
import { unauthenticated } from '../../utils/errors';
import type { Actor } from './board.service';
import type { GraphQLContext } from '../../middleware/auth';

/** Project data: the PROJECTS role, then whatever the admin matrix leaves it on Project. */
const guard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, 'Project', [ROLES.PROJECTS], action);

type PageShape = {
  _id: unknown;
  projectId: { toString(): string };
  parentId?: { toString(): string } | null;
};

/**
 * A page's two ObjectId references have to be strings for their GraphQL IDs. Generic so the
 * page's own fields — its title, its body, who saved it — survive the conversion.
 */
const serializePage = <T extends PageShape>(page: T) => ({
  ...withId(page),
  projectId: page.projectId.toString(),
  parentId: page.parentId ? page.parentId.toString() : null,
});

/** Who is editing, from the request's own token. */
async function actorOf(ctx: GraphQLContext): Promise<Actor> {
  const id = ctx.user?.id;
  if (!id) {
    unauthenticated();
  }
  const user = await UserModel.findById(id).select('name').lean();
  return { id, name: user?.name ?? ctx.user?.email ?? '' };
}

export const docsResolvers = {
  Query: {
    projectDocPages: async (
      _p: unknown,
      { projectId }: { projectId: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      const pages = await docsService.pages(projectId);
      return pages.map((page) => serializePage(page));
    },
    docPage: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return serializePage(await docsService.page(id));
    },
  },
  Mutation: {
    createDocPage: async (
      _p: unknown,
      { projectId, parentId, title }: { projectId: string; parentId?: string; title: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'CREATE');
      const page = await docsService.createPage(projectId, parentId ?? null, title);
      return serializePage(page);
    },
    updateDocPage: async (
      _p: unknown,
      { id, title, body }: { id: string; title?: string; body?: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      const editor = await actorOf(ctx);
      return serializePage(await docsService.updatePage(id, { title, body }, editor));
    },
    deleteDocPage: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'DELETE');
      return docsService.deletePage(id);
    },
    moveDocPage: async (
      _p: unknown,
      { id, parentId, toIndex }: { id: string; parentId?: string; toIndex: number },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      return docsService.movePage(id, parentId ?? null, toIndex);
    },
  },
};
