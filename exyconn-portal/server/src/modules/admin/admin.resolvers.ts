import { adminService, assertMayAssignRoles } from './admin.service';
import { assertAuthenticated, assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId, withIds } from '../../utils/serialize';
import { diffChanges, recordAudit } from '../audit';
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

const USER_MODULE = 'User';

const sortedRoles = (roles: readonly string[] | undefined) => [...(roles ?? [])].sort().join(', ');

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
    listEmployeeOptions: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertAuthenticated(ctx); // any signed-in user may fill an employee picker
      return withIds(await adminService.listEmployeeOptions());
    },
    appSettings: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertAuthenticated(ctx); // any signed-in user reads the formatting settings
      return withId(await adminService.getSettings());
    },
  },
  Mutation: {
    createUser: async (_p: unknown, { input }: { input: CreateUserInput }, ctx: GraphQLContext) => {
      const actor = assertRole(ctx, userWriters);
      assertMayAssignRoles(actor.roles ?? [], input.roles);
      const { user, password } = await adminService.createUser(input);
      const created = withId(user.toObject());
      await recordAudit(ctx, {
        action: 'CREATE',
        module: USER_MODULE,
        entityId: created.id,
        entityLabel: created.email,
        summary: `Created user ${created.name} (${sortedRoles(created.roles)})`,
      });
      return { user: created, password };
    },
    updateUser: async (
      _p: unknown,
      { id, input }: { id: string; input: UpdateUserInput },
      ctx: GraphQLContext,
    ) => {
      const actor = assertRole(ctx, userWriters);
      const target = await adminService.getUser(id);
      assertMayAssignRoles(actor.roles ?? [], input.roles, target.roles);
      const updated = withId(await adminService.updateUser(id, input));
      const rolesChanged =
        input.roles !== undefined && sortedRoles(input.roles) !== sortedRoles(target.roles);
      const fromRoles = sortedRoles(target.roles);
      const toRoles = sortedRoles(updated.roles);
      await recordAudit(ctx, {
        action: rolesChanged ? 'ROLE_CHANGE' : 'UPDATE',
        module: USER_MODULE,
        entityId: id,
        entityLabel: updated.email,
        summary: rolesChanged
          ? `Changed roles of ${updated.name} from [${fromRoles}] to [${toRoles}]`
          : `Updated user ${updated.name}`,
        changes: diffChanges(target, input),
      });
      return updated;
    },
    deleteUser: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, adminOnly);
      const target = await adminService.getUser(id);
      const removed = await adminService.deleteUser(id);
      await recordAudit(ctx, {
        action: 'DELETE',
        module: USER_MODULE,
        entityId: id,
        entityLabel: target.email,
        summary: `Deleted user ${target.name}`,
      });
      return removed;
    },
    setUserActive: async (
      _p: unknown,
      { id, isActive }: { id: string; isActive: boolean },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      const user = withId(await adminService.setUserActive(id, isActive));
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: USER_MODULE,
        entityId: id,
        entityLabel: user.email,
        summary: `${isActive ? 'Activated' : 'Deactivated'} user ${user.name}`,
      });
      return user;
    },
    setUserBlocked: async (
      _p: unknown,
      { id, isBlocked, reason }: { id: string; isBlocked: boolean; reason?: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      const user = withId(await adminService.setUserBlocked(id, isBlocked, reason));
      const blockedSummary = reason
        ? `Blocked user ${user.name}: ${reason}`
        : `Blocked user ${user.name}`;
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: USER_MODULE,
        entityId: id,
        entityLabel: user.email,
        summary: isBlocked ? blockedSummary : `Unblocked user ${user.name}`,
      });
      return user;
    },
    resetUserPassword: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, adminOnly);
      const target = await adminService.getUser(id);
      const password = await adminService.resetUserPassword(id);
      await recordAudit(ctx, {
        action: 'PASSWORD_RESET',
        module: USER_MODULE,
        entityId: id,
        entityLabel: target.email,
        summary: `Issued a temporary password for ${target.name}`,
      });
      return password;
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
      const before = await adminService.getSettings();
      const settings = withId(await adminService.updateSettings(input));
      await recordAudit(ctx, {
        action: 'SETTINGS',
        module: 'AppSettings',
        entityId: settings.id,
        entityLabel: 'global',
        summary: 'Updated app settings',
        changes: diffChanges(before, input),
      });
      return settings;
    },
  },
};
