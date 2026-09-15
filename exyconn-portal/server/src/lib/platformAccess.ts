import { OrganizationModel } from '../modules/organizations/organization.model';
import type { PermissionAction } from '../modules/permissions/permission.model';
import { assertAuthenticated } from '../middleware/roleGuard';
import { forbidden } from '../utils/errors';
import { ROLES, type Role } from '../constants/roles';
import type { GraphQLContext } from '../middleware/auth';
import type { TokenPayload } from '../utils/jwt';
import { assertPermission } from './permissions';
import { currentOrganizationId, runAsPlatform } from './tenant';

/**
 * Who may touch what the whole platform shares: the install's credentials (SMTP, ImageKit,
 * GitHub, Slack, OpenAI), exyconn.com's content, the public status page, client logs, the
 * translation catalogue and AI prices (see PLATFORM_MODELS).
 *
 * Those records carry no organization, so the tenant layer cannot confine them — a TECH user
 * in ANY customer company would otherwise read the platform's SMTP password. Exyconn's own
 * staff, though, work inside an ordinary organization (the one the legacy migration created),
 * so "SUPER_ADMIN only" would lock them out of their daily work. The line is drawn instead at
 * the platform OPERATOR organization: the one company flagged `isPlatformOperator`.
 */

/** How long the operator organization's id is trusted before it is read again. */
const OPERATOR_CACHE_TTL_MS = 60_000;

let operatorCache: { at: number; id: string | null } | null = null;

/** Call after the operator flag changes (and between tests) so the next check re-reads it. */
export function invalidatePlatformOperatorCache(): void {
  operatorCache = null;
}

/** The id of the organization that operates the platform, or null when none is flagged. */
export async function platformOperatorOrganizationId(): Promise<string | null> {
  if (operatorCache && Date.now() - operatorCache.at < OPERATOR_CACHE_TTL_MS) {
    return operatorCache.id;
  }
  const row = await runAsPlatform(() =>
    OrganizationModel.findOne({ isPlatformOperator: true }).select('_id').lean(),
  );
  const id = row ? String(row._id) : null;
  operatorCache = { at: Date.now(), id };
  return id;
}

/** The company the caller acts in: the context's mirror first, then the token, then the scope. */
export function callerOrganization(ctx: GraphQLContext, user: TokenPayload): string | null {
  return ctx.organizationId ?? user.organizationId ?? currentOrganizationId();
}

/** A platform administrator standing above the companies — the one caller with no organization. */
function isPlatformAdministrator(ctx: GraphQLContext, user: TokenPayload): boolean {
  return (user.roles ?? []).includes(ROLES.SUPER_ADMIN) && callerOrganization(ctx, user) === null;
}

/**
 * Asserts the caller acts for the platform: a SUPER_ADMIN with no organization, or anyone
 * signed in to the operator organization. It says nothing about roles — pair it with a role
 * or permission guard (see assertPlatformStaff).
 */
export async function assertPlatformOrganization(ctx: GraphQLContext): Promise<TokenPayload> {
  const user = assertAuthenticated(ctx);
  if (isPlatformAdministrator(ctx, user)) {
    return user;
  }
  const organizationId = callerOrganization(ctx, user);
  const operatorId = await platformOperatorOrganizationId();
  if (organizationId === null || operatorId === null || organizationId !== operatorId) {
    forbidden('Only the platform operator may manage this.');
  }
  return user;
}

/**
 * The guard for a platform-wide feature: a SUPER_ADMIN with no organization passes; anybody
 * else must be in the operator organization AND pass the module's ordinary permission check.
 */
export async function assertPlatformStaff(
  ctx: GraphQLContext,
  module: string,
  roles: Role[],
  action: PermissionAction,
): Promise<TokenPayload> {
  const user = assertAuthenticated(ctx);
  if (isPlatformAdministrator(ctx, user)) {
    return user;
  }
  await assertPlatformOrganization(ctx);
  return assertPermission(ctx, module, roles, action);
}

type AnyResolver = (parent: never, args: never, ctx: GraphQLContext) => unknown;

/**
 * Wraps resolvers whose own guard already checks roles and permissions (the generated CRUD
 * maps) so each one first requires the platform operator organization.
 */
export function restrictToPlatform<T extends Record<string, AnyResolver>>(resolvers: T): T {
  const wrapped: Record<string, AnyResolver> = {};
  for (const [name, resolve] of Object.entries(resolvers)) {
    wrapped[name] = async (parent, args, ctx) => {
      await assertPlatformOrganization(ctx);
      return resolve(parent, args, ctx);
    };
  }
  return wrapped as T;
}
