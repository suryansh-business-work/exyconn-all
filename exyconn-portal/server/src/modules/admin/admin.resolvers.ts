import { adminService, assertMayAssignRoles } from './admin.service';
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
/**
 * Who may add and edit an employee record.
 *
 * HR is in here so there is genuinely ONE user database: an employee added in HR is the same
 * row the Admin console lists, with the same roles, rather than a shadow record someone has
 * to re-key. `assertMayAssignRoles` is what keeps that from also being a way to mint admins.
 */
const userWriters = [ROLES.ADMIN, ROLES.HR];
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
    listUsersStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, userReaders);
      return adminService.listUsersStats();
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
      const actor = assertRole(ctx, userWriters);
      assertMayAssignRoles(actor.roles ?? [], input.roles);
      const { user, password } = await adminService.createUser(input);
      return { user: withId(user.toObject()), password };
    },
    updateUser: async (
      _p: unknown,
      { id, input }: { id: string; input: UpdateUserInput },
      ctx: GraphQLContext,
    ) => {
      const actor = assertRole(ctx, userWriters);
      const target = await adminService.getUser(id);
      assertMayAssignRoles(actor.roles ?? [], input.roles, target.roles);
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
