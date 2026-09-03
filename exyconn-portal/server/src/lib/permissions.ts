import {
  RolePermissionModel,
  type PermissionAction,
} from '../modules/permissions/permission.model';
import { assertRole } from '../middleware/roleGuard';
import { forbidden } from '../utils/errors';
import { ROLES, type Role } from '../constants/roles';
import type { GraphQLContext } from '../middleware/auth';

/** Every CRUD module that registered a guard, so the admin matrix can list them. */
export const PERMISSION_MODULES = new Set<string>();

const CACHE_TTL_MS = 10_000;
let cache: { at: number; rows: Map<string, Set<string>> } | null = null;

/** (role, module) -> allowed actions, refreshed at most every 10s. Undefined = no restriction. */
async function restrictions(): Promise<Map<string, Set<string>>> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.rows;
  const rows = await RolePermissionModel.find().lean();
  const map = new Map(rows.map((r) => [`${r.role}:${r.module}`, new Set<string>(r.actions)]));
  cache = { at: Date.now(), rows: map };
  return map;
}

/** Call after any permission write so the next check sees it. */
export function invalidatePermissionCache(): void {
  cache = null;
}

/**
 * The module's base roles still gate entry (as before). On top of that, if an
 * administrator has restricted one of the caller's roles for this module, the
 * action must be in that role's allowed list. ADMIN is never restricted.
 */
export async function assertPermission(
  ctx: GraphQLContext,
  module: string,
  baseRoles: Role[],
  action: PermissionAction,
) {
  const user = assertRole(ctx, baseRoles);
  const roles = (user.roles ?? []) as Role[];
  if (roles.includes(ROLES.ADMIN)) return user;

  const map = await restrictions();
  const permitted = roles.some((role) => {
    if (!baseRoles.includes(role)) return false;
    const allowed = map.get(`${role}:${module}`);
    return allowed === undefined || allowed.has(action);
  });
  if (!permitted) forbidden(`Your role may not ${action.toLowerCase()} ${module}`);
  return user;
}
