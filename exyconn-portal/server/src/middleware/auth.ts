import type { Request } from 'express';
import { verifyToken, type TokenPayload } from '../utils/jwt';
import { UserModel } from '../modules/admin/user.model';
import { recordActivity } from '../modules/admin/presence';
import type { Role } from '../constants/roles';
import { principalForApiKey } from '../modules/integrations/api-key.service';
import { organizationOf, runAsPlatform, setScopeOrganization, setScopeSelf } from '../lib/tenant';
import { actingOrganization } from './actingOrganization';
import { VISITOR_HEADER, visitorForPass, type DemoVisitor } from '../modules/whatsapp-demo/visitor';
import { CLIENT_PASS_HEADER, contactForPass, type ClientHubContact } from '../modules/clienthub';
import { OrganizationModel } from '../modules/organizations/organization.model';
import { deviceMayRun, deviceTokenIsLive } from '../modules/tracker/tracker.auth';
import { sessionIsLive } from '../modules/auth/session.service';

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
  /**
   * Set when the caller is a WhatsApp demo visitor (email-and-code sign-in, see
   * modules/whatsapp-demo/visitor) rather than a portal user. Such a request has no `user`,
   * so every role guard refuses it; only the demo's chat operations accept it.
   */
  demoVisitor?: DemoVisitor;
  /**
   * Set when the caller is a client hub contact (email-and-code sign-in, see
   * modules/clienthub). Like a demo visitor, no `user` and no company in scope: only the
   * client hub's own operations accept it, and they enter the client's company themselves.
   */
  clientContact?: ClientHubContact;
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
  // A portal token stands only while its session does, so signing one device out does not
  // have to retire every token the person holds. Tokens issued before sessions existed carry
  // no `sid` and keep working until they expire, seven days at the outside.
  if (decoded.sid && !(await sessionIsLive(decoded.sid))) {
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

  // The client hub speaks only for its contact. A browser that is also signed in to a portal
  // (the shared .exyconn.com cookie) must not turn a client hub request into a staff one — the
  // hub's operations would refuse it and sign the contact straight back out.
  if (headerValue(req, CLIENT_PASS_HEADER) !== '') {
    return passHolderOrAnonymous(req, ip, origin, userAgent);
  }

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
    return passHolderOrAnonymous(req, ip, origin, userAgent);
  }

  const fresh = await currentHolder(decoded, token, req);
  if (!fresh) {
    return passHolderOrAnonymous(req, ip, origin, userAgent);
  }

  const roles = fresh.roles as Role[];
  // The record is the authority on which company a person is in, not the week-old token.
  const home = organizationOf(fresh);
  // A platform administrator may work inside the company the portal's address names; anyone
  // else always works in their own (see actingOrganization).
  const organizationId = await actingOrganization(req, roles, home);
  // Never a platform scope, not even for a platform administrator: their console asks for one
  // where it means to (organizations.service), and everything else stays confined to ONE
  // company — so "list the employees" can never quietly mean every company's employees at once.
  setScopeOrganization(organizationId, false);
  // Inside another company their own account is still theirs to read and edit (profile, me).
  setScopeSelf(
    home !== null && home !== organizationId ? { userId: decoded.id, organizationId: home } : null,
  );
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

/** A request header's single string value, or ''. */
const headerValue = (req: Request, name: string): string => {
  const value = req.headers[name];
  return typeof value === 'string' ? value : '';
};

/**
 * No portal session: a client hub contact or a WhatsApp demo visitor when the request carries
 * a live pass, and otherwise nobody. Either way NO company is put in scope — the data layer
 * keeps refusing company data to this request, and the client hub's and the demo's own
 * resolvers enter the right company themselves.
 */
async function passHolderOrAnonymous(
  req: Request,
  ip: string,
  origin?: string,
  userAgent?: string,
): Promise<GraphQLContext> {
  const base = anonymous(ip, origin, userAgent);
  const clientPass = headerValue(req, CLIENT_PASS_HEADER);
  if (clientPass !== '') {
    const clientContact = await contactForPass(clientPass);
    return clientContact ? { ...base, clientContact } : base;
  }
  const visitorPass = headerValue(req, VISITOR_HEADER);
  const demoVisitor = visitorPass === '' ? null : await visitorForPass(visitorPass);
  return demoVisitor ? { ...base, demoVisitor } : base;
}

/**
 * Nobody is signed in, so no company is in scope. What a caller may still read is what belongs
 * to no company anyway — the public site, the status page — which carries no organization at
 * all. Anything that IS a company's data is refused by the data layer, not merely by a guard.
 */
function anonymous(ip: string, origin?: string, userAgent?: string): GraphQLContext {
  return { user: null, organizationId: null, ip, origin, userAgent };
}
