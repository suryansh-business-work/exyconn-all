import { adminService } from './admin.service';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateSettingsInput,
  SendMailInput,
} from './admin.service';

type LeanDoc = { _id: unknown };

const adminOnly = [ROLES.ADMIN];
/** Employee records are readable by HR too (ADMIN always passes assertRole). */
const userReaders = [ROLES.HR];

export const adminResolvers = {
  Query: {
    listUsers: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, userReaders);
      return withIds(await adminService.listUsers());
    },
    listUsersPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, userReaders);
      const page = await adminService.listUsersPaged(input);
      return { rows: withIds(page.rows as LeanDoc[]), totalCount: page.totalCount };
    },
    getUser: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, userReaders);
      return withId(await adminService.getUser(id));
    },
    appSettings: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, []); // any authenticated user may read formatting settings
      return withId(await adminService.getSettings());
    },
  },
  Mutation: {
    createUser: async (_p: unknown, { input }: { input: CreateUserInput }, ctx: GraphQLContext) => {
      assertRole(ctx, adminOnly);
      const { user, password } = await adminService.createUser(input);
      return { user: withId(user.toObject()), password };
    },
    updateUser: async (
      _p: unknown,
      { id, input }: { id: string; input: UpdateUserInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return withId(await adminService.updateUser(id, input));
    },
    deleteUser: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, adminOnly);
      return adminService.deleteUser(id);
    },
    setUserActive: async (
      _p: unknown,
      { id, isActive }: { id: string; isActive: boolean },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return withId(await adminService.setUserActive(id, isActive));
    },
    setUserBlocked: async (
      _p: unknown,
      { id, isBlocked, reason }: { id: string; isBlocked: boolean; reason?: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return withId(await adminService.setUserBlocked(id, isBlocked, reason));
    },
    resetUserPassword: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, adminOnly);
      return adminService.resetUserPassword(id);
    },
    sendUserMail: async (
      _p: unknown,
      { id, input }: { id: string; input: SendMailInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return adminService.sendUserMail(id, input);
    },
    updateSettings: async (
      _p: unknown,
      { input }: { input: UpdateSettingsInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return withId(await adminService.updateSettings(input));
    },
  },
};
