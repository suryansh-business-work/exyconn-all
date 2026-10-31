# MCP servers (Claude custom connectors)

Every Exyconn module that Claude can work in is its own MCP server, and one **global** server
combines them all. Claude acts as the person who connected it, with that person's permissions,
inside their company. Everything about the servers lives in the MCP portal at
**mcp.exyconn.com**: the dashboard, and per server its address, tools, usage, Claude (MCP)
activity and connections.

| Server       | Address                                            | Who can connect it                 | Covers                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------ | -------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRM          | `https://portal-server.exyconn.com/mcp/crm`        | CRM role                           | leads, companies, contacts, deals with their 0-100 deal score, activities and the timeline (meeting notes filed on matching contacts and deals), meetings and the calendar, the dashboard, mail and mailboxes with their domains' health (`mailDomainHealth`, `checkMailDomainHealth`: SPF, DKIM, DMARC, MX, blocklists, Setup Score), cold emails, the lead generators (Google Business, Clutch — see docs/portal/crm/lead-generators.md), the email verifier, the website scraper |
| Marketing    | `https://portal-server.exyconn.com/mcp/marketing`  | Marketing role                     | campaigns and sends, metrics and quality checks, audiences, templates, email preferences and the footer, the suppression list, social media accounts, posts, calendar and analytics                                                                                                                                                                                                                                                                                                 |
| Admin        | `https://portal-server.exyconn.com/mcp/admin`      | Admin role                         | users and roles, organizations, permissions, the audit log, branding, localization, integrations and webhooks, system health, analytics, clients                                                                                                                                                                                                                                                                                                                                    |
| AI           | `https://portal-server.exyconn.com/mcp/ai`         | AI role                            | the AI workspace and the meeting assistant (meetings, notes, models, releases, calendar, meeting bot: `maSendBot`, `maCancelBot`, `maBotDispatches`)                                                                                                                                                                                                                                                                                                                                |
| Client Hub   | `https://portal-server.exyconn.com/mcp/clienthub`  | Admin role                         | client contacts and hub access, shared items and links, client communications, payment gateways (the company side; clients sign in to the hub itself)                                                                                                                                                                                                                                                                                                                               |
| Compliance   | `https://portal-server.exyconn.com/mcp/compliance` | Compliance role                    | the ISO registers, audits, management reviews, the dashboard                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Employee     | `https://portal-server.exyconn.com/mcp/employee`   | everyone (Employee role)           | the person's own profile, salary slips, holidays, requests, approvals, notifications                                                                                                                                                                                                                                                                                                                                                                                                |
| Finance      | `https://portal-server.exyconn.com/mcp/finance`    | Finance role                       | invoices, payments and billing, company finance settings, budgets, recurring invoices, the change log, expenses                                                                                                                                                                                                                                                                                                                                                                     |
| HR           | `https://portal-server.exyconn.com/mcp/hr`         | HR role                            | employees, attendance, HR and organization masters, recruiting, onboarding, exits, performance, goals, benefits, training, documents, payroll, salary accounts, announcements                                                                                                                                                                                                                                                                                                       |
| IT           | `https://portal-server.exyconn.com/mcp/it`         | IT role                            | IT service registers and workflows, insights, assets, licences                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Legal        | `https://portal-server.exyconn.com/mcp/legal`      | Legal role                         | legal documents and groups, policies                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Products     | `https://portal-server.exyconn.com/mcp/products`   | Products role                      | the catalogue, inventory, purchasing                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Projects     | `https://portal-server.exyconn.com/mcp/projects`   | Projects role                      | projects, boards and tickets, sprints, docs, sharing, workflows, project health, bugs                                                                                                                                                                                                                                                                                                                                                                                               |
| Social       | `https://portal-server.exyconn.com/mcp/social`     | everyone (Employee role)           | the internal feed: posts, comments, reactions, profiles                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Status       | `https://portal-server.exyconn.com/mcp/status`     | Tech role                          | monitors, incidents, maintenance, subscribers, problem reports                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Support      | `https://portal-server.exyconn.com/mcp/support`    | Support role                       | tickets from every channel (portal, email, website chat, WhatsApp) with the linked conversation, AI suggested replies, customer satisfaction (CSAT), the support library                                                                                                                                                                                                                                                                                                            |
| Tech         | `https://portal-server.exyconn.com/mcp/tech`       | Tech role                          | environment variables (never their values), provider usage and profiles, transfers, email templates, DNS, infrastructure, security, app logs, the calling bot                                                                                                                                                                                                                                                                                                                       |
| Tracker      | `https://portal-server.exyconn.com/mcp/tracker`    | Tracker role                       | workdays, time entries, activity, expected versus logged hours, reports                                                                                                                                                                                                                                                                                                                                                                                                             |
| Website      | `https://portal-server.exyconn.com/mcp/website`    | Website role                       | website content, the CMS, the website chat agent and its library, the GCC cost calculator                                                                                                                                                                                                                                                                                                                                                                                           |
| Agents       | `https://portal-server.exyconn.com/mcp/agents`     | Agents role                        | the Agents console: its overview (`agentsOverview`), the WhatsApp and website agents' bot studio, the calling bot (examples, call flows, calls), the website chat with its knowledge base and FAQs, WhatsApp demo leads                                                                                                                                                                                                                                                             |
| All (global) | `https://portal-server.exyconn.com/mcp/all`        | anyone with one of the roles above | every tool of every server the person may use, in one connection                                                                                                                                                                                                                                                                                                                                                                                                                    |

`https://portal-server.exyconn.com/mcp` is the CRM's first address. Connectors already added
with it keep working as the CRM server; new connectors use `/mcp/crm`.

## Connect Claude

1. Open **mcp.exyconn.com**, pick the server in the sidebar, open **Connect** and copy its
   MCP server URL.
2. In Claude (claude.ai or the desktop app): **Settings > Connectors > Add custom connector**.
3. **Name:** `Exyconn CRM` (or HR, Finance, any other module, or All). **MCP server URL:** the address. **Add**.
4. Choose **Connect**. Claude checks the server, reads its sign-in settings
   (`/.well-known/oauth-protected-resource/mcp/<server>`, `/.well-known/oauth-authorization-server`),
   registers itself and opens the MCP portal's consent page (`mcp.exyconn.com/mcp/connect`).
   Sign in if asked, then choose **Allow**.
5. The connector shows as connected; the server's tools are available in chats.

A connection is bound to the server it was added at (the OAuth `resource`, RFC 8707): a CRM
connection is refused at `/mcp/marketing`, and a connection stops working when its person loses
the server's role. If Claude says _No server responded at this URL_, the address has a typo.

## How it works

`server/src/modules/mcp/` keeps its GraphQL surface (`index.ts`, `mcp.typeDefs.ts`,
`mcp.resolvers.ts`) at the top and the rest in four folders: `core/` (router, MCP server, tools,
catalogue), `auth/` (OAuth, consent, endpoint access), `data/` (models, legacy migration, usage
reports) and `servers/` (one spec per module).

| Piece                                                                                | Where                                                                                                                                                        |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Server registry: key, role, label, audit module, typeDefs                            | `server/src/modules/mcp/servers/` (one `<module>.server.ts` per module, `index.ts`)                                                                          |
| MCP endpoints (Streamable HTTP, stateless, JSON responses)                           | `POST /mcp/<server>`, `POST /mcp/all`, legacy `POST /mcp` — `core/mcp.router.ts`                                                                             |
| OAuth 2.1: discovery, dynamic client registration, `/authorize`, `/token`, `/revoke` | MCP SDK `mcpAuthRouter` + `auth/mcp.oauth.ts` (one sign-in for every server)                                                                                 |
| Consent (Allow / Cancel)                                                             | MCP portal `/mcp/connect` → `approveMcpAuthorization` (`auth/mcp.connect.ts`)                                                                                |
| Tools                                                                                | built from the live GraphQL schema at boot, per server — `core/mcp.tools.ts`, `core/mcp.catalogue.ts`                                                        |
| Running a tool                                                                       | the module's operation through the same schema, guards and permissions as the portal — `core/mcp.server.ts`                                                  |
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
  real description on every field. The standard record operations are the one exception: a field
  named `list<X>Paged`, `list<X>Stats`, `list<X>`, `get<X>`, `create<X>`, `update<X>` or
  `delete<X>` whose answer and arguments fit that shape (a page of rows, `TableStats`, a list, the
  record, `Boolean` for a delete) is described by `core/mcp.describe.ts`. Anything else without
  a description reaches Claude as only "Reads/Changes <Module> data (name)".
- **A new typeDefs file in a module** is added to that module's `typeDefs` list in
  `servers/<module>.server.ts`, or its operations never reach Claude.
- **A new module offered to Claude** gets its own `servers/<module>.server.ts` (key, MCP name,
  label, role, audit module, instructions, typeDefs), an entry in `MCP_SERVERS` and
  `MCP_ENDPOINT_PATHS`, the key in the `McpServerKey` type and the GraphQL `McpEndpoint` enum,
  and a `mcpServerNav(...)` entry under the `mcp` module in `packages/shell/src/config/modules.ts`.
  The global server picks it up by itself.
- Renaming or removing a field renames or removes the tool; check prompts or docs that name it.
- Fields whose name contains `Config`, `Secret`, `Token`, `Password`, `ApiKey` or `Vault` are
  credentials, settings or the Tech vault that guards them, never offered (`EXCLUDED` in
  `core/mcp.tools.ts`). Creating an API key or resetting a password stays in the portal.
- **Shared tools** every portal offers — global `search` and the table tools (`tableExport`,
  `importTableRows`, `startTableBulkJob` and their helpers) — are added to every server by
  `servers/shared.ts`; `/mcp/all` lists each once. They run with the caller's roles through the
  module's own operations, and export still needs the EXPORT permission.
- **Never offered by any server** (listed in `servers/shared.ts`): sign-in, MFA, sessions and the
  profile (a connection is already signed in), MCP's own consent and connections (Claude never
  approves itself), and the WhatsApp channel (it holds
  the Meta access token). Every other Query and Mutation field belongs to some server.
- The bots, the website chat and WhatsApp Leads belong to **Agents** (agents.exyconn.com). **Tech** still
  declares the bot studio and the calling bot, and **Website** the chat and its leads, so connectors
  already pointed at those servers keep their tools; `/mcp/all` lists each field once.
- `mcp.tools.test.ts` validates every generated tool's operation against the real schema, for
  every server in `MCP_SERVERS`; a module change that breaks one fails CI.
- The MCP portal routes each server explicitly in `apps/mcp/src/App.tsx` (the shell's nav coverage
  test reads those `path="…"` lines), so a new server also adds its `<Route>` there.
- A tool's answer selects every scalar and enum field, nested objects two levels deep, and is cut
  at 60,000 characters with a note to narrow the request.
- Each tool's operation is parsed and validated once when the schema loads (`useSchema` in
  `core/mcp.catalogue.ts`); one the schema refuses is logged as "MCP tool left out" and not
  offered. An endpoint's tool list is built once per role set and reused by every list and call.
- Tools carry MCP annotations: a readable `title`, `readOnlyHint` for queries, `destructiveHint`
  for delete/remove/archive, and `idempotentHint` for both.

## MCP settings (admins)

`/mcp/settings` on the MCP portal (ADMIN; `mcpSettings` / `updateMcpSettings`, audited) holds
one record per company (`data/mcp.settings.ts`, read with a 15-second cache that a save clears).
The server enforces every rule (`core/mcp.policy.ts`); the portal only edits them.

- **Rate limits**, per hour, 0 = no limit: calls per person (every connection), calls per
  connection (one client for one person, keyed by OAuth client id), and changes per person.
  Counted from `McpCall`; a refused call is recorded as `RATE_LIMITED` and does not count.
- **Switched-off tools**: an admin turns a tool off or on from a server's Tools tab. It disappears
  from the tool list and a call is refused as `TOOL_DISABLED`.
- **Read-only servers**: their mutations are not offered, and are refused as `READ_ONLY`. A
  connection can also be read only: the consent page offers the choice, which is stored on
  the code and the token, carried over on refresh, shown on the Connections tab and in the
  audit entry.
- **Alerts** (`data/mcp.alerts.ts`, job `mcpAlerts`, every five minutes per company): when the
  last hour has at least the minimum calls and its error rate or p95 time passes the thresholds,
  admins get a notification (and the chosen Slack channel a post) linking to the error log, at
  most once an hour. The **daily digest** sends yesterday's numbers once. Refusals by these
  settings are not counted as failures. Slack channels come from `mcpSlackChannels`.

## Tracing, error log and analytics

- **Every call has a trace id** (`runTool` in `core/mcp.server.ts`). Claude gets it in the
  result's `_meta.traceId`, and a failed call's text ends `(<CODE>; trace <id>)`, so whatever the
  person saw in Claude can be found in the portal. Changes made through Claude name it in the audit
  log too.
- **Every call is recorded**, worked or failed, even when the operation throws
  (`core/mcp.record.ts`). `McpCall` keeps the trace id, the endpoint it came through, the
  error code, the argument _names_ (never their values), the answer's length and whether rows were
  cut. Calls kept before tracing read as empty for those fields.
- **Error codes**: the GraphQL code (`FORBIDDEN`, `NOT_FOUND`, `BAD_USER_INPUT`…),
  `INVALID_ARGUMENTS` when GraphQL refused the arguments before any resolver ran, and `INTERNAL`
  for anything a resolver threw without a code. Anything other than the expected codes is also
  logged at error level with its trace id, so it shows in Tech > Logs.
- **Long answers stay valid JSON** (`core/mcp.answer.ts`): a list, or a page's `rows`, longer than
  60,000 characters is cut by whole rows with a note of how many were shown; anything else is cut
  by characters and says so.
- **Unknown tools**: a call to a tool the endpoint does not offer is refused and logged as a warning.
- **Portal**, on each server's page:
  - **Usage & billing**: calls, success rate, changes made, median and p95 time, people; per-day
    calls and failures; calls by person, client, module (on All) and failure kind; per tool, the
    p95 time and when it was last called (`mcpUsage`, `data/mcp.analytics.ts`).
  - **Claude (MCP) activity**: newest calls (click one for its full detail), filtered by outcome or by a trace id, tool or person
    (`mcpActivity(ok, search)`), with the failure kind and the copyable trace id. A link
    `…/activity?trace=<id>` opens one call.
  - **Errors**: failures grouped by tool, kind and message, most frequent first, with the count,
    people hit, first and latest time and the latest trace id, which opens in the activity log
    (`mcpErrors`).
  - The **Dashboard** shows the success rate and p95 time across every server the person may use.
