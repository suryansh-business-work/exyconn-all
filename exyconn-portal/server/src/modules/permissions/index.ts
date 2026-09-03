import { RolePermissionModel } from './permission.model';
import { permissionsTypeDefs } from './permissions.typeDefs';
import { PERMISSION_MODULES, invalidatePermissionCache } from '../../lib/permissions';
import { assertRole } from '../../middleware/roleGuard';
import { badRequest } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

type Args = { role: string; module: string; actions?: string[] };

function assertKnownModule(module: string) {
  if (!PERMISSION_MODULES.has(module)) badRequest(`Unknown module: ${module}`);
}

export const permissionsResolvers = {
  Query: {
    listPermissionModules: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, [ROLES.ADMIN]);
      return [...PERMISSION_MODULES].sort((a, b) => a.localeCompare(b));
    },
    listRolePermissions: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, [ROLES.ADMIN]);
      return withIds(
        (await RolePermissionModel.find().sort({ role: 1, module: 1 }).lean()) as {
          _id: unknown;
        }[],
      );
    },
  },
  Mutation: {
    setRolePermission: async (
      _p: unknown,
      { role, module, actions = [] }: Args,
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, [ROLES.ADMIN]);
      if (role === ROLES.ADMIN) badRequest('ADMIN cannot be restricted');
      assertKnownModule(module);
      const row = await RolePermissionModel.findOneAndUpdate(
        { role, module },
        { role, module, actions: [...new Set(actions)] },
        { upsert: true, new: true, runValidators: true },
      ).lean();
      invalidatePermissionCache();
      return withId(row as { _id: unknown });
    },
    clearRolePermission: async (_p: unknown, { role, module }: Args, ctx: GraphQLContext) => {
      assertRole(ctx, [ROLES.ADMIN]);
      const res = await RolePermissionModel.deleteOne({ role, module });
      invalidatePermissionCache();
      return res.deletedCount > 0;
    },
  },
};
export { permissionsTypeDefs };
