import express, { Router, type Request, type Response } from 'express';
import cors from 'cors';
import {
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthRouter,
} from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { MCP_SCOPE, mcpOAuthProvider } from './mcp.oauth';
import { callerOf, createMcpServer } from './mcp.server';

/** Where Claude's custom connector points: `https://portal-server.exyconn.com/mcp`. */
export const MCP_PATH = '/mcp';

/**
 * The paths a connector reaches from outside the portals — OAuth discovery, the sign-in and
 * token endpoints, and the MCP endpoint itself. Only these answer every origin.
 */
const OPEN_PATHS = ['/.well-known', '/authorize', '/token', '/register', '/revoke', MCP_PATH];

/** The connector's own body limit: tool arguments, never files. */
const BODY_LIMIT = '1mb';

const jsonRpcError = (res: Response, status: number, message: string) =>
  res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null });

/** One MCP request, stateless: a server for this caller, answered as plain JSON (no stream). */
async function handle(req: Request, res: Response): Promise<void> {
  const caller = req.auth ? await callerOf(req.auth) : null;
  if (!caller) {
    jsonRpcError(res, 401, 'This connection no longer has access. Connect Claude again.');
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
 * The CRM MCP server and its OAuth 2.1 sign-in (discovery, dynamic client registration,
 * authorize, token, revoke), as Claude's custom connector expects them. Mounted before the
 * portals' CORS so a connector's browser preflight is answered for any origin.
 */
export function mcpRouter(): Router {
  const router = Router();
  const resource = new URL(`${env.apiPublicUrl}${MCP_PATH}`);
  router.use(
    OPEN_PATHS,
    cors({
      origin: '*',
      exposedHeaders: ['Mcp-Session-Id', 'Mcp-Protocol-Version', 'WWW-Authenticate'],
    }),
  );
  router.use(
    mcpAuthRouter({
      provider: mcpOAuthProvider,
      issuerUrl: new URL(env.apiPublicUrl),
      resourceServerUrl: resource,
      scopesSupported: [MCP_SCOPE],
      resourceName: 'Exyconn CRM',
    }),
  );
  const bearer = requireBearerAuth({
    verifier: mcpOAuthProvider,
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(resource),
  });
  router.post(MCP_PATH, express.json({ limit: BODY_LIMIT }), bearer, (req, res) => {
    handle(req, res).catch((error: unknown) => {
      logger.error({ err: error }, 'MCP request failed');
      if (!res.headersSent) {
        jsonRpcError(res, 500, 'The CRM could not answer. Try again.');
      }
    });
  });
  // Stateless: there is no session to stream to or to end.
  router.get(MCP_PATH, (_req, res) => jsonRpcError(res.set('Allow', 'POST'), 405, 'Use POST.'));
  router.delete(MCP_PATH, (_req, res) => jsonRpcError(res.set('Allow', 'POST'), 405, 'Use POST.'));
  return router;
}
