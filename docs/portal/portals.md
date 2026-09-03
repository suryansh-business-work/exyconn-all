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

| Portal | App key | Production | Login | Dev port | Role |
|---|---|---|---|---|---|
| Portal Home (launcher) | `hub` | https://portal.exyconn.com | https://portal.exyconn.com/login | 4003 | any |
| Admin | `admin` | https://admin.exyconn.com | https://admin.exyconn.com/login | 4020 | `ADMIN` |
| My Workspace | `employee` | https://employee.exyconn.com | https://employee.exyconn.com/login | 4021 | `EMPLOYEE` |
| Finance | `finance` | https://finance.exyconn.com | https://finance.exyconn.com/login | 4022 | `FINANCE` |
| Support | `support` | https://support.exyconn.com | https://support.exyconn.com/login | 4023 | `SUPPORT` |
| CRM | `crm` | https://crm.exyconn.com | https://crm.exyconn.com/login | 4024 | `CRM` |
| Products | `products` | https://products.exyconn.com | https://products.exyconn.com/login | 4025 | `PRODUCTS` |
| Legal | `legal` | https://legal.exyconn.com | https://legal.exyconn.com/login | 4026 | `LEGAL` |
| HR | `hr` | https://hr.exyconn.com | https://hr.exyconn.com/login | 4027 | `HR` |
| Marketing | `marketing` | https://marketing.exyconn.com | https://marketing.exyconn.com/login | 4028 | `MARKETING` |
| Projects | `projects` | https://projects.exyconn.com | https://projects.exyconn.com/login | 4029 | `PROJECTS` |
| AI | `ai` | https://ai.exyconn.com | https://ai.exyconn.com/login | 4030 | `AI` |
| Website | `website` | https://website.exyconn.com | https://website.exyconn.com/login | 4031 | `WEBSITE` |
| Time Tracker | `tracker` | https://tracker.exyconn.com | https://tracker.exyconn.com/login | 4032 | `TRACKER` |
| Tech | `tech` | https://tech.exyconn.com | https://tech.exyconn.com/login | 4033 | `TECH` |
| IT | `it` | https://it.exyconn.com | https://it.exyconn.com/login | 4034 | `IT` |

Not portal apps, but part of the same deployment:

| Service | Production | Dev port |
|---|---|---|
| Marketing website (Astro) | https://exyconn.com | 4000 |
| Tools UI | https://tools.exyconn.com | 4001 |
| Tools API | https://tools-api.exyconn.com | 4002 |
| Portal GraphQL API | https://portal-server.exyconn.com/graphql | 1002 |
| Status page (public, no sign-in) | https://status.exyconn.com | 4035 |

The status page is built from the same packages but is deliberately **not** a portal app:
it has no login, no role and no portal chrome, because an outage is exactly when nobody can
sign in. Its catalogue and the problems reported on it are managed from the Tech portal
(**Status Monitors** and **Problem Reports**).

`ADMIN` opens every portal; any other role opens the launcher plus the portals its role
covers. A user who reaches a portal their roles do not cover is redirected to the launcher.

In development each app is a `localhost:<dev port>` origin instead of a subdomain — the
`appOrigin` helper in `packages/shell/src/config/apps.ts` picks between the two.
