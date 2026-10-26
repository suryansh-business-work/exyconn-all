import express, { Router, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import {
  createOAuthMetadata,
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthMetadataRouter,
  mcpAuthRouter,
} from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';
import { MCP_SCOPE, mcpOAuthProvider } from '../auth/mcp.oauth';
import { callerOf, createMcpServer, rolesOf } from './mcp.server';
import {
  endpointMeta,
  LEGACY_CRM_PATH,
  MCP_ENDPOINT_PATHS,
  MCP_ENDPOINTS,
  serversOf,
  type McpEndpointKey,
} from '../servers';

/**
 * Where Claude's custom connectors point: `https://portal-server.exyconn.com/mcp/<server>` for
 * one module, `/mcp/all` for every module at once, and `/mcp` — the CRM's first address.
 */
export const MCP_PATH = LEGACY_CRM_PATH;

/**
 * The paths a connector reaches from outside the portals — OAuth discovery, the sign-in and
 * token endpoints, and the MCP endpoints themselves (all below `/mcp`). Only these answer every
 * origin.
 */
const OPEN_PATHS = ['/.well-known', '/authorize', '/token', '/register', '/revoke', MCP_PATH];

/** Every address an endpoint answers at: its own, and `/mcp` as well for the CRM. */
const ADDRESSES: ReadonlyArray<{ path: string; endpoint: McpEndpointKey }> = [
  { path: LEGACY_CRM_PATH, endpoint: 'crm' },
  ...MCP_ENDPOINTS.map((endpoint) => ({ path: MCP_ENDPOINT_PATHS[endpoint], endpoint })),
];

/** The connector's own body limit: tool arguments, never files. */
const BODY_LIMIT = '1mb';

/**
 * Logs every refused or failed answer on the connector's paths — the step, the status and the
 * OAuth error code, never a token or code — so a failed "Connect" in Claude can be traced in
 * Tech > Logs. The SDK's OAuth handlers answer their errors without logging them.
 */
function logRefusals(req: Request, res: Response, next: NextFunction): void {
  const json = res.json.bind(res);
  res.json = (body: unknown) => {
    if (res.statusCode >= 400) {
      const error = (body ?? {}) as { error?: unknown; error_description?: unknown };
      logger.warn(
        {
          path: req.originalUrl.split('?')[0],
          status: res.statusCode,
          error: typeof error.error === 'string' ? error.error : undefined,
          description:
            typeof error.error_description === 'string' ? error.error_description : undefined,
          clientId: typeof req.body?.client_id === 'string' ? req.body.client_id : undefined,
        },
        'MCP connector request refused',
      );
    }
    return json(body);
  };
  next();
}

const jsonRpcError = (res: Response, status: number, message: string) =>
  res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null });

/**
 * One MCP request, stateless: a server for this caller, answered as plain JSON (no stream). A
 * connection is only good at the endpoint it was allowed for, and only while its person may
 * still use that server.
 */
async function handle(req: Request, res: Response, endpoint: McpEndpointKey): Promise<void> {
  const caller = req.auth ? await callerOf(req.auth) : null;
  if (!caller) {
    jsonRpcError(res, 401, 'This connection no longer has access. Connect Claude again.');
    return;
  }
  const label = endpointMeta(endpoint).label;
  if (caller.endpoint !== endpoint) {
    jsonRpcError(res, 403, `This connection is not for ${label}. Connect Claude to this address.`);
    return;
  }
  if (serversOf(endpoint, rolesOf(caller)).length === 0) {
    jsonRpcError(res, 403, `You do not have access to ${label} any more.`);
    return;
  }
  const server = createMcpServer(caller);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on('close', () => {
    transport.close().catch((error: unknown) => logger.warn({ err: error }, 'MCP transport close'));
    server.close().catch((error: unknown) => logger.warn({ err: error }, 'MCP server close'));
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

/**
 * Every MCP server and their one OAuth 2.1 sign-in (discovery, dynamic client registration,
 * authorize, token, revoke), as Claude's custom connector expects them. Each address publishes
 * its own protected-resource metadata, so a connection is made for — and bound to — the server
 * it was added at. Mounted before the portals' CORS so a connector's browser preflight is
 * answered for any origin.
 */
export function mcpRouter(): Router {
  const router = Router();
  const resource = new URL(`${env.apiPublicUrl}${MCP_PATH}`);
  const issuerUrl = new URL(env.apiPublicUrl);
  router.use(
    OPEN_PATHS,
    cors({
      origin: '*',
      exposedHeaders: ['Mcp-Session-Id', 'Mcp-Protocol-Version', 'WWW-Authenticate'],
    }),
    logRefusals,
  );
  router.use(
    mcpAuthRouter({
      provider: mcpOAuthProvider,
      issuerUrl,
      resourceServerUrl: resource,
      scopesSupported: [MCP_SCOPE],
      resourceName: 'Exyconn CRM',
    }),
  );
  const oauthMetadata = createOAuthMetadata({ provider: mcpOAuthProvider, issuerUrl });
  for (const { path, endpoint } of ADDRESSES) {
    mountEndpoint(router, path, endpoint, oauthMetadata);
  }
  return router;
}

/** One address of one endpoint: its resource metadata, and the MCP endpoint behind a token. */
function mountEndpoint(
  router: Router,
  path: string,
  endpoint: McpEndpointKey,
  oauthMetadata: ReturnType<typeof createOAuthMetadata>,
): void {
  const resource = new URL(`${env.apiPublicUrl}${path}`);
  const label = endpointMeta(endpoint).label;
  if (path !== MCP_PATH) {
    router.use(
      mcpAuthMetadataRouter({
        oauthMetadata,
        resourceServerUrl: resource,
        scopesSupported: [MCP_SCOPE],
        resourceName: `Exyconn ${label}`,
      }),
    );
  }
  const bearer = requireBearerAuth({
    verifier: mcpOAuthProvider,
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(resource),
  });
  router.post(path, express.json({ limit: BODY_LIMIT }), bearer, (req, res) => {
    handle(req, res, endpoint).catch((error: unknown) => {
      logger.error({ err: error, endpoint }, 'MCP request failed');
      if (!res.headersSent) {
        jsonRpcError(res, 500, `${label} could not answer. Try again.`);
      }
    });
  });
  // Stateless: there is no session to stream to or to end.
  router.get(path, (_req, res) => jsonRpcError(res.set('Allow', 'POST'), 405, 'Use POST.'));
  router.delete(path, (_req, res) => jsonRpcError(res.set('Allow', 'POST'), 405, 'Use POST.'));
}
