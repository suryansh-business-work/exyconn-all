# Exyconn deployment

One monorepo → containerized web services behind host nginx + certbot on
`148.135.136.107`, deployed by GitHub Actions on push to `main`. The Tracker desktop app
is built as a downloadable Windows installer artifact by the same workflow.

| Service | Port | Domain | Image |
|---|---|---|---|
| Main website (Astro) | 4000 | exyconn.com | `exyconn-website` |
| Tools UI | 4001 | tools.exyconn.com | `exyconn-tools-ui` |
| Tools API | 4002 | tools-api.exyconn.com | `exyconn-tools-api` |
| Portal hub (launcher, profile, settings) | 4003 | portal.exyconn.com | `exyconn-portal-hub` |
| Portal · Admin | 4020 | admin.exyconn.com | `exyconn-portal-admin` |
| Portal · My Workspace | 4021 | employee.exyconn.com | `exyconn-portal-employee` |
| Portal · Finance | 4022 | finance.exyconn.com | `exyconn-portal-finance` |
| Portal · Support | 4023 | support.exyconn.com | `exyconn-portal-support` |
| Portal · CRM | 4024 | crm.exyconn.com | `exyconn-portal-crm` |
| Portal · Products | 4025 | products.exyconn.com | `exyconn-portal-products` |
| Portal · Legal | 4026 | legal.exyconn.com | `exyconn-portal-legal` |
| Portal · HR | 4027 | hr.exyconn.com | `exyconn-portal-hr` |
| Portal · Marketing | 4028 | marketing.exyconn.com | `exyconn-portal-marketing` |
| Portal · Projects | 4029 | projects.exyconn.com | `exyconn-portal-projects` |
| Portal · AI | 4030 | ai.exyconn.com | `exyconn-portal-ai` |
| Portal · Website | 4031 | website.exyconn.com | `exyconn-portal-website` |
| Portal · Time Tracker | 4032 | tracker.exyconn.com | `exyconn-portal-tracker` |
| Portal · Tech | 4033 | tech.exyconn.com | `exyconn-portal-tech` |
| Portal · IT | 4034 | it.exyconn.com | `exyconn-portal-it` |
| Status page (public, no sign-in) | 4035 | status.exyconn.com | `exyconn-portal-status` |
| Portal API | 4004 | portal-server.exyconn.com | `exyconn-portal-server` |
| Tracker (desktop) | — | — | Windows installer artifact |

Containers listen only on `127.0.0.1:<port>`; host nginx terminates TLS and proxies each
public domain to its port. Every portal domain serves the same sign-in at `/login`, styled
per portal from Admin > Branding > Login Pages — see [docs/portal/portals.md](docs/portal/portals.md).

## 0. Rotate the leaked secrets FIRST

The credentials shared during setup must be treated as public. **Rotate every one** before
using it here — the commands below assume the *new* values:
SSH keypair, DockerHub token, OpenAI key, ImageKit private key, Google Maps key, Gmail app
password, Slack webhook.

## 1. DNS

Point A records for every name in the table at `148.135.136.107` (certbot needs them resolving first):

```
exyconn.com                 A  148.135.136.107
www.exyconn.com             A  148.135.136.107
tools.exyconn.com           A  148.135.136.107
tools-api.exyconn.com       A  148.135.136.107
portal.exyconn.com          A  148.135.136.107
portal-server.exyconn.com   A  148.135.136.107
```

## 2. Set GitHub Actions secrets

Run from the repo root, once, with your **rotated** values (do not paste the old ones).
`gh secret set NAME` prompts for the value so it never lands in your shell history:

```bash
for s in SSH_KEY SSH_USER SSH_HOST SSH_PORT \
         DOCKERHUB_USERNAME DOCKERHUB_TOKEN \
         MONGODB_URI JWT_SECRET \
         OPENAI_API_KEY GOOGLE_MAP_API SLACK_WEBHOOK \
         TINA_GITHUB_TOKEN NEXTAUTH_SECRET; do
  gh secret set "$s"
done
```

- **`MONGODB_URI` and `JWT_SECRET` were not in the shared list but the Portal API requires
  them** — copy them from the current `exyconn-portal/server/.env` (and rotate the JWT
  secret while you're at it, since anything derived from a leaked repo should be considered
  exposed).
- `SSH_PORT` is `22`.
- **`TINA_GITHUB_TOKEN` and `NEXTAUTH_SECRET` power the website's content editor**
  (`https://exyconn.com/admin`, self-hosted TinaCMS). `TINA_GITHUB_TOKEN` is a fine-grained
  GitHub personal access token for this repository with *Contents: Read and write* — every save
  in the editor is committed to `main` with it. `NEXTAUTH_SECRET` signs the editor's login
  session (`openssl rand -base64 32`). The editor's content index reuses `MONGODB_URI`
  (database `tinacms`).
- **SMTP, ImageKit, Slack and Pexels are not secrets any more.** All four are stored in
  MongoDB and managed in the portal under **Admin › Environment Variables**, where each has
  a test-connection action. Pexels is the stock-media key behind the shared upload dialog's
  photo and video tabs. The Portal API, the Tools API and the website's form notifications
  all read the active configuration from there, so rotating a credential needs no redeploy.
  `SLACK_WEBHOOK` stays a GitHub secret because CI posts deploy results before any app is up.

## 3. Server setup (nginx + TLS)

Run the **Provision nginx & TLS** workflow from the Actions tab and type `provision`
in the confirm box. It copies `deploy/` to the server, runs `server-setup.sh`, then
health-checks every portal domain.

Run it whenever a new subdomain is added: the deploy workflow starts the new
container but only ever copies the compose file, so nginx has no vhost for the new
host and the domain answers nothing until this runs. It is kept manual because it
rewrites nginx config and talks to Let's Encrypt, which rate-limits.

The same thing by hand, if you have SSH:

```bash
scp -r deploy root@148.135.136.107:/opt/exyconn-deploy
ssh root@148.135.136.107 'bash /opt/exyconn-deploy/server-setup.sh'
```

It backs up nginx, installs the vhosts, and runs certbot. It is **additive and
idempotent** — safe to re-run, and certbot skips any certificate still valid.

> ⚠️ **This box also hosts duncit** (`duncit.com` + ~10 `duncit-staging-*` containers).
> The script deliberately does **not** wipe `sites-enabled`; doing so would take duncit
> offline. Never "clear out" nginx on this server.

## 4. Deploy

Push to `main` (or run the workflow manually). `.github/workflows/deploy.yml` then:

1. builds + pushes every image to Docker Hub (tagged `latest` and the commit SHA),
2. copies `docker-compose.prod.yml` to `/opt/exyconn` and runs `docker compose up -d`,
3. verifies every domain returns **200 OK**,
4. builds the Tracker Windows installer (download it from the run's Artifacts),
5. posts the result to Slack.

## Branch flow

Two long-lived branches. All work lands on `staging` first — push there and CI
(`.github/workflows/ci.yml`) typechecks, lints and tests the workspace and the tools
project. When staging is green and verified, merge `staging → main`; a push to `main` is
what runs `deploy.yml` (build every image, push to Docker Hub, roll the server, verify every
domain). Nothing is pushed straight to `main`.

## Local development

`pnpm run:all` runs website (4000), portal hub (4003), portal API (4004). A module app is
started on its own port with `pnpm --filter @exyconn/portal-app-<module> dev` (hr, ai,
website, …) — in dev they are plain `localhost:<port>` origins, and because cookies ignore
ports the session is shared across them just as it is across subdomains in production.
Tools runs from its own folder (`cd exyconn-tools && npm run dev` → 4001/4002). Tracker:
`pnpm --filter exyconn-tracker-app dev`.

## Portal architecture

The portal is a set of micro-frontends: `packages/shell` (design system, layout, Apollo
client, auth context, module registry) and `packages/login` (the sign-in screen) are shared
as source by the hub and by each module app under `exyconn-portal/apps/*`. Every app is its
own Vite build on its own subdomain, and all of them call the single portal API. The JWT
lives in a cookie scoped to `.exyconn.com`, so signing in on any one app signs you in
everywhere; ADMIN passes every module's role guard. Old `/portal/<module>/...` URLs are
redirected from the hub to the app that now owns them.

## Exposed ports

Every exyconn domain and subdomain resolves to the same host, so the firewall is the
whole story — there is nothing per-subdomain to configure. The host is already
default-deny (an unlisted port times out rather than refusing), and the only ports
that answer from the internet are:

| Port | Service |
| --- | --- |
| 22 | SSH |
| 80, 443 | nginx — every domain, including the Infinity Home app on `iot.exyconn.com` |
| 1883 | MQTT, **plaintext** |
| 8883 | MQTT over TLS (certificate `CN=iot.exyconn.com`) |

Nothing else leaks: `docker-compose.prod.yml` binds every container to `127.0.0.1`, so
the 4000–4035 app ports, MongoDB and the Docker API are all unreachable.

The MQTT broker belongs to the Infinity Home stack, not this repo. It does require
credentials (an anonymous CONNECT is refused with CONNACK `0x05`), but 1883 carries
them in clear text. To take both ports off the internet, run the **Close the MQTT
ports** workflow and type `close-mqtt` in the confirm box; it runs
`deploy/close-mqtt-ports.sh`, then checks from outside that the ports stopped
answering and that 443 still serves.

> ⚠️ The broker keeps listening on localhost, so the Infinity Home web app (which uses
> its own `/api/mqtt` and `/ws` on 443) is unaffected. **Physical devices connecting
> from outside are cut off** — re-home them before running it. If the broker turns out
> to be a published Docker port, ufw cannot close it: the script says so and fails, and
> the port has to be bound to `127.0.0.1` in that stack instead.

## Notes / caveats

- **Tools API image** uses native `onnxruntime` (hence the `node:20-slim` Debian base). The
  formerly-required private `@exyconn/common` package was an unused dependency and has been
  removed, so the image now builds with no registry token.
- The tracker installer is unsigned; macOS distribution additionally needs an Apple
  Developer ID (build the DMG on macOS). See `exyconn-tracker-app/README.md`.
