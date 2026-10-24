# CRM MCP server (Claude custom connector)

One MCP server gives Claude every CRM feature as a tool: leads, companies, contacts and deals,
activities and the timeline, meetings and the calendar, the dashboard, mail and mailboxes, cold
emails, the lead generator (Google Maps), the email verifier and the website scraper. Claude acts
as the person who connected it, with that person's permissions, inside their company.

## Connect Claude

1. In the AI portal open **AI > MCP Servers > Connect** and copy the MCP server URL:

   ```
   https://portal-server.exyconn.com/mcp
   ```

2. In Claude (claude.ai or the desktop app): **Settings > Connectors > Add custom connector**.
3. **Name:** `Exyconn CRM`. **MCP server URL:** the address above. Choose **Add**.
4. Choose **Connect**. Claude checks the server, reads its sign-in settings
   (`/.well-known/oauth-protected-resource/mcp`, `/.well-known/oauth-authorization-server`),
   registers itself and opens the AI portal's consent page (`/ai/mcp/connect`). Sign in to the
   portal if asked, then choose **Allow**.
5. The connector shows as connected; every CRM tool is available in chats.

Only people with CRM access can allow a connection. If Claude says *No server responded at this
URL*, the address has a typo or does not end in `/mcp`.

## How it works

| Piece | Where |
| --- | --- |
| MCP endpoint (Streamable HTTP, stateless, JSON responses) | `POST /mcp` — `server/src/modules/mcp/mcp.router.ts` |
| OAuth 2.1: discovery, dynamic client registration, `/authorize`, `/token`, `/revoke` | MCP SDK `mcpAuthRouter` + `mcp.oauth.ts` |
| Consent (Allow / Cancel) | AI portal `/ai/mcp/connect` → `approveMcpAuthorization` |
| Tools | built from the live GraphQL schema at boot — `mcp.tools.ts`, `mcp.crm.ts` |
| Running a tool | the CRM operation through the same schema, guards and permissions as the portal — `mcp.server.ts` |
| Activity log | every call in `McpCall` (180 days): CRM > Claude (MCP) activity; changes also in the audit log |
| Usage, connections | AI > MCP Servers > Usage & billing, Connections |

The open endpoints (`/.well-known/*`, `/authorize`, `/token`, `/register`, `/revoke`, `/mcp`)
answer every origin (CORS `*`) and are mounted before the portals' CORS, so a connector's
preflight is never refused. Tokens: a one-hour access token and a 30-day refresh token that
rotates on every use (`MCP_ACCESS_TOKEN_TTL_SECONDS`, `MCP_REFRESH_TOKEN_TTL_DAYS`); only their
hashes are stored. Signing a connection out (Connections tab) revokes it at once.

## Keeping the tools current — read this when changing the CRM

Tools are generated, never written by hand:

- **A new query or mutation in an existing CRM typeDefs file is a tool on the next deploy.** Its
  arguments become the tool's input schema (required where the GraphQL argument is non-null
  without a default) and its GraphQL description becomes the tool's description — so write a
  real description on every CRM field.
- **A new CRM module** adds its typeDefs to `CRM_TYPE_DEFS` in `server/src/modules/mcp/mcp.crm.ts`.
- Fields whose name contains `Config`, `Secret` or `Token` are credentials and settings, not CRM
  work, and are never offered.
- `mcp.tools.test.ts` validates every generated tool's operation against the real schema; a CRM
  change that breaks one fails CI.
- A tool's answer selects every scalar and enum field, nested objects two levels deep, and is cut
  at 60,000 characters with a note to narrow the request.
