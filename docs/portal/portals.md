# Portal apps and their links

Every module of the portal is its own Vite build on its own subdomain, all talking to the
one GraphQL API. The registry that drives this table lives in
[`packages/config/apps.json`](../../packages/config/apps.json) — adding a portal means
adding it there (and to `MODULES` in `packages/shell/src/config/modules.ts`).

Sign-in is shared: one account, one JWT in a cookie scoped to `.exyconn.com`, so signing in
on any portal signs you in everywhere. Each portal still serves **its own** `/login` page,
styled from **Admin > Branding > Login Pages** — the portal name, the strapline, the
background artwork and the accent are per-app values on the branding record, so
`finance.exyconn.com/login` and `hr.exyconn.com/login` look like their own front doors while
running identical code.

| Portal                 | App key         | Production                               | Login                                         | Dev port | Role                         |
| ---------------------- | --------------- | ---------------------------------------- | --------------------------------------------- | -------- | ---------------------------- |
| Portal Home (launcher) | `hub`           | https://portal.exyconn.com               | https://portal.exyconn.com/login              | 4003     | any                          |
| Admin                  | `admin`         | https://admin.exyconn.com                | https://admin.exyconn.com/login               | 4020     | `ADMIN`                      |
| My Workspace           | `employee`      | https://employee.exyconn.com             | https://employee.exyconn.com/login            | 4021     | `EMPLOYEE`                   |
| Finance                | `finance`       | https://finance.exyconn.com              | https://finance.exyconn.com/login             | 4022     | `FINANCE`                    |
| Support                | `support`       | https://support.exyconn.com              | https://support.exyconn.com/login             | 4023     | `SUPPORT`                    |
| CRM                    | `crm`           | https://crm.exyconn.com                  | https://crm.exyconn.com/login                 | 4024     | `CRM`                        |
| Products               | `products`      | https://products.exyconn.com             | https://products.exyconn.com/login            | 4025     | `PRODUCTS`                   |
| Legal                  | `legal`         | https://legal.exyconn.com                | https://legal.exyconn.com/login               | 4026     | `LEGAL`                      |
| HR                     | `hr`            | https://hr.exyconn.com                   | https://hr.exyconn.com/login                  | 4027     | `HR`                         |
| Marketing              | `marketing`     | https://marketing.exyconn.com            | https://marketing.exyconn.com/login           | 4028     | `MARKETING`                  |
| Projects               | `projects`      | https://projects.exyconn.com             | https://projects.exyconn.com/login            | 4029     | `PROJECTS`                   |
| AI                     | `ai`            | https://ai.exyconn.com                   | https://ai.exyconn.com/login                  | 4030     | `AI`                         |
| Website                | `website`       | https://website.exyconn.com              | https://website.exyconn.com/login             | 4031     | `WEBSITE`                    |
| Time Tracker           | `tracker`       | https://tracker.exyconn.com              | https://tracker.exyconn.com/login             | 4032     | `TRACKER`                    |
| Tech                   | `tech`          | https://tech.exyconn.com                 | https://tech.exyconn.com/login                | 4033     | `TECH`                       |
| IT                     | `it`            | https://it.exyconn.com                   | https://it.exyconn.com/login                  | 4034     | `IT`                         |
| Compliance             | `compliance`    | https://compliance.exyconn.com           | https://compliance.exyconn.com/login          | 4037     | `COMPLIANCE`                 |
| Social                 | `social`        | https://social.exyconn.com               | https://social.exyconn.com/login              | 4036     | `EMPLOYEE`                   |
| WhatsApp Demo          | `whatsapp-demo` | https://demos.exyconn.com/whatsapp-demo/ | https://demos.exyconn.com/whatsapp-demo/login | 4038     | `EMPLOYEE`                   |
| Meeting Bot Demo | `meeting-bot-demo` | https://demos.exyconn.com/meeting-bot-demo/ | https://demos.exyconn.com/meeting-bot-demo/login | 4048     | demo visitor (email code) |
| MCP Sandbox Demo | `mcp-sandbox-demo` | https://demos.exyconn.com/mcp-sandbox-demo/ | https://demos.exyconn.com/mcp-sandbox-demo/login | 4049     | demo visitor (email code) |
| Client Hub             | `clienthub`     | https://clienthub.exyconn.com            | https://clienthub.exyconn.com/login           | 4039     | client contacts (email code) |
| Agents                 | `agents`        | https://agents.exyconn.com               | https://agents.exyconn.com/login              | 4045     | `AGENTS`                     |
| Developers             | `developers`    | https://developers.exyconn.com           | https://developers.exyconn.com/login          | 4046     | `ADMIN`                      |
| Vendor Portal          | `vendors`       | https://vendors.exyconn.com              | https://vendors.exyconn.com/login             | 4047     | supplier contacts (email code) |

Not portal apps, but part of the same deployment:

| Service                          | Production                                | Dev port |
| -------------------------------- | ----------------------------------------- | -------- |
| Marketing website (Astro)        | https://exyconn.com                       | 4000     |
| Tools UI                         | https://tools.exyconn.com                 | 4001     |
| Tools API                        | https://tools-api.exyconn.com             | 4002     |
| Portal GraphQL API               | https://portal-server.exyconn.com/graphql | 1002     |
| Status page (public, no sign-in) | https://status.exyconn.com                | 4035     |

Social is the one module keyed to `EMPLOYEE` rather than a role of its own. That is
deliberate: every colleague holds that role, and a company feed only part of the company
can open is a noticeboard. Two modules sharing one role is fine — `accessibleModules`
filters by role membership, and `APP_BY_SEGMENT` routes on the first path segment, so
`/me` and `/social` reach different apps. The WhatsApp demo is keyed to `EMPLOYEE` for the
same reason, and is the one app with no portal chrome (`PortalApp chrome={false}`): it
renders a full-screen WhatsApp-style client, and its `/admin` analytics are ADMIN-only on the server.

Agents is the single console for the AI agents: the WhatsApp agent's workflows (the bot studio,
previewed in the plain chat widget; the full WhatsApp look-alike stays in the demo), the calling
bot's settings, examples, call flows and calls, the website chat agent, the live website chat
with its knowledge base, FAQs and settings, WhatsApp Leads and an overview built from what those
agents already record (`agentsOverview`). These screens used to live in Tech > Demos and
Website > Chatbot; the old addresses redirect to the same screen on agents.exyconn.com. Its
`AGENTS` role was granted once, at boot, to everyone who held `TECH` or `WEBSITE`. The bots'
credentials (calling bot keys, the WhatsApp number's Meta token) stay behind the Tech vault, so
changing one still needs the vault unlocked in Tech > Environment Variables.

Developers is where integrations live: API keys (with per-key daily usage), webhooks and their
paged delivery log, the webhook event catalogue, an API reference built from the same schema
descriptions as the MCP tools, and the MCP server addresses with a link into mcp.exyconn.com.
Admin › Integrations redirects there. The Vendor Portal mirrors the client hub for suppliers: a
supplier's people, given access in Products › Suppliers (key icon), sign in with an emailed code
(`x-vendor-pass`), see their purchase orders, acknowledge them and send invoices against them;
Products › Vendor invoices approves one into a Finance bill whose paid status is what the supplier
sees as paid. See [vendor-portal.md](./vendor-portal.md).

The status page is built from the same packages but is deliberately **not** a portal app:
it has no login, no role and no portal chrome, because an outage is exactly when nobody can
sign in. Its catalogue and the problems reported on it are managed from the Tech portal
(**Status Monitors** and **Problem Reports**).

Which portal query and which portal screen owns each part of the Astro website is recorded
in [website-content.md](./website-content.md).

`ADMIN` opens every portal; any other role opens the launcher plus the portals its role
covers. A user who reaches a portal their roles do not cover is redirected to the launcher.

In development each app is a `localhost:<dev port>` origin instead of a subdomain — the
`appOrigin` helper in `packages/shell/src/config/apps.ts` picks between the two.
