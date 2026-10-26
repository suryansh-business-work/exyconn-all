import { Types } from 'mongoose';
import type { GraphQLContext } from '../../middleware/auth';
import { organizationOf, runAsPlatform } from '../../lib/tenant';
import { UserModel } from '../admin/user.model';
import { badRequest, notFound } from '../../utils/errors';
import { recordAudit } from '../audit';
import { McpAuthCodeModel, McpAuthRequestModel, McpClientModel } from './mcp.models';
import { codeHashOf, newAuthorizationCode } from './mcp.oauth';
import { assertEndpointAccess } from './mcp.access';
import { endpointMeta, type McpEndpointKey } from './servers';

const CODE_TTL_MS = 10 * 60 * 1000;

/** What the consent page shows about a sign-in waiting to be allowed. */
export interface McpAuthorizationRequest {
  id: string;
  endpoint: McpEndpointKey;
  /** The server as people say it: "CRM", "Marketing", "All Exyconn tools". */
  serverLabel: string;
  clientName: string;
  redirectHost: string;
  scopes: string[];
}

/**
 * The company a person belongs to — what a connection acts in when they allow it from the
 * platform view (a platform administrator with no company open). Null for an account in none.
 */
async function homeOrganization(userId: string): Promise<string | null> {
  const user = await runAsPlatform(() =>
    UserModel.findById(userId).select('organizationId').lean(),
  );
  return user ? organizationOf(user) : null;
}

/** The redirect address with the outcome added, as OAuth returns it to the client. */
function withParams(redirectUri: string, params: Record<string, string>): string {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

async function openRequest(id: string) {
  if (!Types.ObjectId.isValid(id)) notFound('Sign-in request');
  const request = await runAsPlatform(() =>
    McpAuthRequestModel.findOne({ _id: id, expiresAt: { $gt: new Date() } }).lean(),
  );
  if (!request) notFound('Sign-in request');
  return request;
}

/**
 * The sign-in a client asked for, for the consent page to name. Only people who may use that
 * server (its module's role; any module's for the global one) may see one.
 */
export async function describeAuthorization(
  ctx: GraphQLContext,
  id: string,
): Promise<McpAuthorizationRequest> {
  const request = await openRequest(id);
  assertEndpointAccess(ctx, request.endpoint);
  const client = await runAsPlatform(() =>
    McpClientModel.findOne({ clientId: request.clientId }).lean(),
  );
  return {
    id,
    endpoint: request.endpoint,
    serverLabel: endpointMeta(request.endpoint).label,
    clientName: client?.clientName || 'An MCP client',
    redirectHost: new URL(request.redirectUri).host,
    scopes: request.scopes,
  };
}

/**
 * The signed-in person allows the client: a one-time code for them, in their company, bound to
 * the client's PKCE challenge and redirect. Answers where to send the browser.
 */
export async function approveAuthorization(ctx: GraphQLContext, id: string): Promise<string> {
  const request = await openRequest(id);
  const user = assertEndpointAccess(ctx, request.endpoint);
  const organizationId = ctx.organizationId ?? (await homeOrganization(user.id));
  if (!organizationId) {
    badRequest('Open the portal in a company before connecting Claude to it.');
  }
  const meta = endpointMeta(request.endpoint);
  const code = newAuthorizationCode();
  await runAsPlatform(async () => {
    await McpAuthCodeModel.create({
      codeHash: codeHashOf(code),
      clientId: request.clientId,
      endpoint: request.endpoint,
      userId: user.id,
      organizationId,
      redirectUri: request.redirectUri,
      codeChallenge: request.codeChallenge,
      scopes: request.scopes,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });
    await McpAuthRequestModel.deleteOne({ _id: id });
  });
  await recordAudit(ctx, {
    action: 'LOGIN',
    module: meta.auditModule,
    entityId: id,
    entityLabel: new URL(request.redirectUri).host,
    summary: `Connected Claude to ${meta.label} through MCP`,
  });
  return withParams(request.redirectUri, { code, state: request.state });
}

/** The person declines: the client hears access_denied, and the request is gone. */
export async function denyAuthorization(ctx: GraphQLContext, id: string): Promise<string> {
  const request = await openRequest(id);
  assertEndpointAccess(ctx, request.endpoint);
  await runAsPlatform(() => McpAuthRequestModel.deleteOne({ _id: id }));
  return withParams(request.redirectUri, { error: 'access_denied', state: request.state });
}
