# MCP servers (Claude custom connectors)

Every Exyconn module that Claude can work in is its own MCP server, and one **global** server
combines them all. Claude acts as the person who connected it, with that person's permissions,
inside their company. Everything about the servers lives in the MCP portal at
**mcp.exyconn.com**: the dashboard, and per server its address, tools, usage, Claude (MCP)
activity and connections.

| Server       | Address                                           | Who can connect it     | Covers                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CRM          | `https://portal-server.exyconn.com/mcp/crm`       | CRM role               | leads, companies, contacts, deals, activities and the timeline, meetings and the calendar, the dashboard, mail and mailboxes, cold emails, the lead generators (Google Business, Clutch — see docs/portal/crm/lead-generators.md), the email verifier, the website scraper |
| Marketing    | `https://portal-server.exyconn.com/mcp/marketing` | Marketing role         | campaigns and sends, metrics and quality checks, audiences, templates, email preferences and the footer, the suppression list, social media accounts, posts, calendar and analytics                    |
| All (global) | `https://portal-server.exyconn.com/mcp/all`       | any of the roles above | every tool of every server the person may use, in one connection                                                                                                                                       |

`https://portal-server.exyconn.com/mcp` is the CRM's first address. Connectors already added
with it keep working as the CRM server; new connectors use `/mcp/crm`.

## Connect Claude

1. Open **mcp.exyconn.com**, pick the server in the sidebar, open **Connect** and copy its
   MCP server URL.
2. In Claude (claude.ai or the desktop app): **Settings > Connectors > Add custom connector**.
3. **Name:** `Exyconn CRM` (or Marketing, or All). **MCP server URL:** the address. **Add**.
4. Choose **Connect**. Claude checks the server, reads its sign-in settings
   (`/.well-known/oauth-protected-resource/mcp/<server>`, `/.well-known/oauth-authorization-server`),
   registers itself and opens the MCP portal's consent page (`mcp.exyconn.com/mcp/connect`).
   Sign in if asked, then choose **Allow**.
5. The connector shows as connected; the server's tools are available in chats.

A connection is bound to the server it was added at (the OAuth `resource`, RFC 8707): a CRM
connection is refused at `/mcp/marketing`, and a connection stops working when its person loses
the server's role. If Claude says _No server responded at this URL_, the address has a typo.

## How it works

| Piece                                                                                | Where                                                                                                                                                        |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Server registry: key, role, label, audit module, typeDefs                            | `server/src/modules/mcp/servers/` (`crm.server.ts`, `marketing.server.ts`, `index.ts`)                                                                       |
| MCP endpoints (Streamable HTTP, stateless, JSON responses)                           | `POST /mcp/<server>`, `POST /mcp/all`, legacy `POST /mcp` — `mcp.router.ts`                                                                                  |
| OAuth 2.1: discovery, dynamic client registration, `/authorize`, `/token`, `/revoke` | MCP SDK `mcpAuthRouter` + `mcp.oauth.ts` (one sign-in for every server)                                                                                      |
| Consent (Allow / Cancel)                                                             | MCP portal `/mcp/connect` → `approveMcpAuthorization` (`mcp.connect.ts`)                                                                                     |
| Tools                                                                                | built from the live GraphQL schema at boot, per server — `mcp.tools.ts`, `mcp.catalogue.ts`                                                                  |
| Running a tool                                                                       | the module's operation through the same schema, guards and permissions as the portal — `mcp.server.ts`                                                       |
| Activity log                                                                         | every call in `McpCall` (180 days) with its server: MCP portal > server > Claude (MCP) activity; changes also in the audit log under `<Module> (Claude MCP)` |
| Dashboard, usage, connections                                                        | MCP portal: Dashboard, and per server Usage & billing and Connections                                                                                        |
| Portal app                                                                           | `exyconn-portal/apps/mcp` (port 4044)                                                                                                                        |

The open endpoints (`/.well-known/*`, `/authorize`, `/token`, `/register`, `/revoke`, `/mcp*`)
answer every origin (CORS `*`) and are mounted before the portals' CORS, so a connector's
preflight is never refused. Tokens: a one-hour access token and a 30-day refresh token that
rotates on every use (`MCP_ACCESS_TOKEN_TTL_SECONDS`, `MCP_REFRESH_TOKEN_TTL_DAYS`); only their
hashes are stored. Signing a connection out (Connections tab) revokes it at once.
`MCP_CONSENT_URL` (default `https://mcp.exyconn.com/mcp/connect`) is where `/authorize` sends
the browser.

## Keeping the MCP servers current — read this when changing any module

Tools are generated, never written by hand, so a module's MCP server follows its typeDefs:

- **A new query or mutation in a module's existing typeDefs file is a tool on the next deploy.**
  Its arguments become the tool's input schema (required where the GraphQL argument is non-null
  without a default) and its GraphQL description becomes the tool's description — so write a
  real description on every field.
- **A new typeDefs file in a module** is added to that module's `typeDefs` list in
  `servers/<module>.server.ts`, or its operations never reach Claude.
- **A new module offered to Claude** gets its own `servers/<module>.server.ts` (key, MCP name,
  label, role, audit module, instructions, typeDefs), an entry in `MCP_SERVERS` and
  `MCP_ENDPOINT_PATHS`, the key in the `McpServerKey` type and the GraphQL `McpEndpoint` enum,
  and a `mcpServerNav(...)` entry under the `mcp` module in `packages/shell/src/config/modules.ts`.
  The global server picks it up by itself.
- Renaming or removing a field renames or removes the tool; check prompts or docs that name it.
- Fields whose name contains `Config`, `Secret` or `Token` are credentials and settings, never
  offered.
- `mcp.tools.test.ts` validates every generated tool's operation against the real schema, for
  every server; a module change that breaks one fails CI.
- A tool's answer selects every scalar and enum field, nested objects two levels deep, and is cut
  at 60,000 characters with a note to narrow the request.
