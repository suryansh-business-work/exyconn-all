import { isValidObjectId } from 'mongoose';
import { UserModel } from './user.model';
import { assertAuthenticated, assertRole } from '../../middleware/roleGuard';
import { forbidden } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import { ROLES, type Role } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';
import type { TokenPayload } from '../../utils/jwt';

/** The picker projection of a user — what `EmployeeOption` exposes. */
const OPTION_FIELDS = 'name email designation';
const ORG_FIELDS = 'name designation department avatarUrl managerId';

/** How far back "recent" reaches in a manager's team queues. */
const RECENT_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Ids of the active users whose `managerId` is this user. */
export async function directReportIds(managerId: string): Promise<string[]> {
  const rows = await UserModel.find({ managerId, isActive: true }).select('_id').lean();
  return rows.map((row) => String(row._id));
}

/** Whether `employeeId` currently reports to `managerId`. */
export async function isManagerOf(managerId: string, employeeId: string): Promise<boolean> {
  if (!isValidObjectId(employeeId)) return false;
  const found = await UserModel.exists({ _id: employeeId, managerId });
  return found !== null;
}

/**
 * Who may decide something about an employee: the module's own roles (ADMIN always), or
 * the employee's manager. The manager check is the reporting line as it stands now, so a
 * re-assigned employee's old manager loses the power the moment HR moves them.
 */
export async function assertMayActFor(
  ctx: GraphQLContext,
  employeeId: string,
  roles: Role[],
): Promise<TokenPayload> {
  const user = assertAuthenticated(ctx);
  const userRoles = user.roles ?? [];
  const byRole = userRoles.includes(ROLES.ADMIN) || userRoles.some((role) => roles.includes(role));
  if (byRole || (await isManagerOf(user.id, employeeId))) return user;
  forbidden('Only HR or the employee’s manager may do this');
}

/** Filter for every row that belongs to one of the given employees. */
export function teamScope(employeeIds: string[]) {
  return { employeeId: { $in: employeeIds } };
}

/** Filter for the rows a manager still has to act on, plus what they decided lately. */
export function pendingOrRecent(employeeIds: string[]) {
  const cutoff = new Date(Date.now() - RECENT_DAYS * MS_PER_DAY);
  return {
    ...teamScope(employeeIds),
    $or: [{ status: 'PENDING' }, { updatedAt: { $gte: cutoff } }],
  };
}

/** The reporting line: who reports to whom, and the org chart HR reads it from. */
export const reportingResolvers = {
  User: {
    managerName: async (parent: { managerId?: string | null }) => {
      if (!parent.managerId || !isValidObjectId(parent.managerId)) return null;
      const manager = await UserModel.findById(parent.managerId).select('name').lean();
      return manager?.name ?? null;
    },
  },
  Query: {
    myManager: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const me = await UserModel.findById(user.id).select('managerId').lean();
      if (!me?.managerId) return null;
      const manager = await UserModel.findById(me.managerId).select(OPTION_FIELDS).lean();
      return manager ? withId(manager) : null;
    },
    myDirectReports: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const rows = await UserModel.find({ managerId: user.id, isActive: true })
        .select(OPTION_FIELDS)
        .sort({ name: 1 })
        .lean();
      return withIds(rows);
    },
    orgChart: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, [ROLES.HR]);
      const rows = await UserModel.find({ isActive: true })
        .select(ORG_FIELDS)
        .sort({ name: 1 })
        .lean();
      return withIds(rows);
    },
  },
};
