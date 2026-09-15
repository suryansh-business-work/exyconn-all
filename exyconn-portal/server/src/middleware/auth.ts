import type { Request } from 'express';
import { verifyToken, type TokenPayload } from '../utils/jwt';
import { UserModel } from '../modules/admin/user.model';
import { recordActivity } from '../modules/admin/presence';
import type { Role } from '../constants/roles';
import { principalForApiKey } from '../modules/integrations/api-key.service';
import { organizationOf, runAsPlatform, setScopeOrganization } from '../lib/tenant';
import { OrganizationModel } from '../modules/organizations/organization.model';
import { deviceMayRun, deviceTokenIsLive } from '../modules/tracker/tracker.auth';

export interface GraphQLContext {
  user: TokenPayload | null;
  /**
   * The company every query in this request is confined to; null when the caller is a
   * platform administrator or nobody at all.
   *
   * A MIRROR of the scope the data layer enforces (see lib/tenant), for a resolver that
   * needs to name the company. Optional because a resolver can also be called directly
   * (tests, internal jobs), where the scope is set around the call instead.
   */
  organizationId?: string | null;
  /**
   * Caller's address, used only to rate-limit the unauthenticated status-page mutation.
   * Optional because a resolver can also be called directly (tests, internal jobs).
   */
  ip?: string;
  /**
   * The `Origin` header, so a password reset link can point back at the portal that asked
   * for it. Caller-supplied: check it against the CORS list before trusting it.
   */
  origin?: string;
  /** The `User-Agent` header, stored with client logs (Tech > Logs). Caller-supplied. */
  userAgent?: string;
  /**
   * Set when the caller authenticated with a tracker DEVICE token, which buildContext has
   * already matched to a live device row. Such a request can only reach tracker operations,
   * and role guards refuse it (see middleware/roleGuard).
   */
  deviceId?: string;
}

/** How long a company's ACTIVE/SUSPENDED status is trusted before it is read again. */
const WORKSPACE_STATUS_TTL_MS = 60_000;
const workspaceStatus = new Map<string, { at: number; open: boolean }>();

/**
 * Whether the caller's company is open for business. Suspending a company signs everyone in it
 * out within a minute, without a query per request. No company (a platform administrator) is
 * nothing to suspend.
 */
async function workspaceIsOpen(organizationId: string | null): Promise<boolean> {
  if (organizationId === null) {
    return true;
  }
  const hit = workspaceStatus.get(organizationId);
  if (hit && Date.now() - hit.at < WORKSPACE_STATUS_TTL_MS) {
    return hit.open;
  }
  const organization = await runAsPlatform(() =>
    OrganizationModel.findById(organizationId).select('status').lean(),
  );
  const open = organization?.status === 'ACTIVE';
  workspaceStatus.set(organizationId, { at: Date.now(), open });
  return open;
}

/** Test seam: forgets every cached company status. */
export function resetWorkspaceStatusCache(): void {
  workspaceStatus.clear();
}

/**
 * Re-reads the token's user and decides whether the token still stands: the account exists,
 * is active and unblocked, the token has not been retired (tokenVersion), the company is not
 * suspended, and — for a device token — the device is live and the request is a tracker one.
 */
async function currentHolder(decoded: TokenPayload, token: string, req: Request) {
  // Read as the platform: which company this person belongs to is the question being asked.
  const fresh = await runAsPlatform(() =>
    UserModel.findById(decoded.id)
      .select('roles isActive isBlocked organizationId tokenVersion')
      .lean(),
  );
  if (!fresh?.isActive || fresh.isBlocked) {
    return null;
  }
  if ((decoded.tv ?? 0) !== (fresh.tokenVersion ?? 0)) {
    return null;
  }
  if (!(await workspaceIsOpen(organizationOf(fresh)))) {
    return null;
  }
  if (decoded.deviceId && !(await deviceHolds(decoded, token, req))) {
    return null;
  }
  return fresh;
}

/** A device token stands only on its live device row, and only for tracker operations. */
async function deviceHolds(decoded: TokenPayload, token: string, req: Request): Promise<boolean> {
  const body = req.body as { query?: unknown } | undefined;
  const query = body?.query ?? req.query?.query;
  if (!deviceMayRun(query)) {
    return false;
  }
  return deviceTokenIsLive(decoded.id, decoded.deviceId ?? '', token);
}

/**
 * Builds the per-request GraphQL context by decoding the Bearer token and then
 * revalidating the caller against the database.
 *
 * Authorization (`assertRole`) reads `ctx.user`, but its roles/identity are baked into a
 * 7-day JWT at login. Without this refresh, a change persists to Mongo yet does not take
 * effect until the user signs in again. Re-reading from the source of truth on every request
 * makes it apply at once: role changes take effect immediately, and a token whose user has
 * been deleted, deactivated, or blocked is rejected on its very next request rather than
 * lingering until the token expires.
 */
export async function buildContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const ip = req.ip ?? 'unknown';
  const origin = req.headers.origin;
  const userAgent = req.headers['user-agent'];
  const header = req.headers.authorization ?? '';

  // A machine presents a key instead of a session. It resolves to the SAME shape a person
  // does, carrying portal roles, so every assertRole and permission check downstream applies
  // to an integration exactly as it does to a human — one authorisation model, not two.
  const apiKey = req.headers['x-api-key'];
  if (typeof apiKey === 'string' && apiKey !== '') {
    const principal = await runAsPlatform(() => principalForApiKey(apiKey));
    if (!principal) {
      return anonymous(ip, origin, userAgent);
    }
    const organizationId = organizationOf(principal);
    setScopeOrganization(organizationId, false);
    return {
      user: {
        id: principal.id,
        email: `${principal.name} (API key)`,
        roles: principal.roles,
        organizationId,
      } as TokenPayload,
      organizationId,
      ip,
      origin,
      userAgent,
    };
  }

  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) {
    return anonymous(ip, origin, userAgent);
  }

  const fresh = await currentHolder(decoded, token, req);
  if (!fresh) {
    return anonymous(ip, origin, userAgent);
  }

  const roles = fresh.roles as Role[];
  // The record is the authority on which company a person is in, not the week-old token.
  const organizationId = organizationOf(fresh);
  // Never a platform scope, not even for a platform administrator: their console asks for one
  // where it means to (organizations.service), and everything else stays confined to their own
  // company — so "list the employees" can never quietly mean every company's employees at once.
  setScopeOrganization(organizationId, false);
  // Drives "online" on profiles. Not awaited: it never slows or fails the request.
  recordActivity(decoded.id).catch(() => undefined);

  return {
    user: { ...decoded, roles, organizationId },
    organizationId,
    ip,
    origin,
    userAgent,
    deviceId: decoded.deviceId,
  };
}

/**
 * Nobody is signed in, so no company is in scope. What a caller may still read is what belongs
 * to no company anyway — the public site, the status page — which carries no organization at
 * all. Anything that IS a company's data is refused by the data layer, not merely by a guard.
 */
function anonymous(ip: string, origin?: string, userAgent?: string): GraphQLContext {
  return { user: null, organizationId: null, ip, origin, userAgent };
}
