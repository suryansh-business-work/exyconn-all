# Exyconn deployment

One monorepo → five containerized web services behind host nginx + certbot on
`148.135.136.107`, deployed by GitHub Actions on push to `main`. The Tracker desktop app
is built as a downloadable Windows installer artifact by the same workflow.

| Service | Port | Domain | Image |
|---|---|---|---|
| Main website (Astro) | 4000 | exyconn.com | `exyconn-website` |
| Tools UI | 4001 | tools.exyconn.com | `exyconn-tools-ui` |
| Tools API | 4002 | tools-api.exyconn.com | `exyconn-tools-api` |
| Portal UI | 4003 | portal.exyconn.com | `exyconn-portal-ui` |
| Portal API | 4004 | portal-server.exyconn.com | `exyconn-portal-server` |
| Tracker (desktop) | — | — | Windows installer artifact |

Containers listen only on `127.0.0.1:<port>`; host nginx terminates TLS and proxies each
public domain to its port.

## 0. Rotate the leaked secrets FIRST

The credentials shared during setup must be treated as public. **Rotate every one** before
using it here — the commands below assume the *new* values:
SSH keypair, DockerHub token, OpenAI key, ImageKit private key, Google Maps key, Gmail app
password, Slack webhook.

## 1. DNS

Point A records for all five names at `148.135.136.107` (certbot needs them resolving first):

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
         DOCKERHUB_USERNAME DOCKERHUB_TOKEN NPM_TOKEN \
         MONGODB_URI JWT_SECRET \
         SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS \
         IMAGEKIT_PUBLIC_KEY IMAGEKIT_PRIVATE_KEY IMAGEKIT_URL_ENDPOINTS \
         OPENAI_API_KEY GOOGLE_MAP_API SLACK_WEBHOOK; do
  gh secret set "$s"
done
```

- **`MONGODB_URI` and `JWT_SECRET` were not in the shared list but the Portal API requires
  them** — copy them from the current `exyconn-portal/server/.env` (and rotate the JWT
  secret while you're at it, since anything derived from a leaked repo should be considered
  exposed).
- `SSH_PORT` is `22`. `IMAGEKIT_URL_ENDPOINTS` is the ImageKit `urlEndpoint`.
- The Portal API reads SMTP and ImageKit from its own DB (Tech module), not env — those
  secrets are for the **website** (form emails) and **Tools API**.

## 3. One-time server setup (nginx + TLS)

This is the only manual step on the server. It **backs up** the current nginx config first
and only re-points `sites-enabled` (it never deletes `sites-available` files):

```bash
scp -r deploy root@148.135.136.107:/opt/exyconn-deploy
ssh root@148.135.136.107 'bash /opt/exyconn-deploy/server-setup.sh'
```

Afterwards nginx serves only the five Exyconn sites, each on HTTPS, with auto-renewal.
The previous config is saved to `/root/nginx-backup-<timestamp>.tar.gz` — review before
deleting.

## 4. Deploy

Push to `main` (or run the workflow manually). `.github/workflows/deploy.yml` then:

1. builds + pushes all five images to Docker Hub (tagged `latest` and the commit SHA),
2. copies `docker-compose.prod.yml` to `/opt/exyconn` and runs `docker compose up -d`,
3. verifies every domain returns **200 OK**,
4. builds the Tracker Windows installer (download it from the run's Artifacts),
5. posts the result to Slack.

## Local development

`pnpm run:all` runs website (4000), portal UI (4003), portal API (4004). Tools runs from
its own folder (`cd exyconn-tools && npm run dev` → 4001/4002). Tracker:
`pnpm --filter exyconn-tracker-app dev`.

## Notes / caveats

- **Tools API image** depends on the private `@exyconn/common` package (hosted on **GitHub
  Packages** — `github.com/exyconn/common`, not public npm) plus native `onnxruntime`. Its
  Dockerfile reads an `NPM_TOKEN` build-arg and points the `@exyconn` scope at
  `npm.pkg.github.com`, so **`NPM_TOKEN` must be a GitHub PAT with `read:packages`** on the
  exyconn org (a plain npmjs token will 404). This is the one image I could not build-verify
  locally — I don't have that token. If `@exyconn/common` actually lives on a different
  registry, change the two `npm.pkg.github.com` lines in `exyconn-tools/server/Dockerfile`.
- The tracker installer is unsigned; macOS distribution additionally needs an Apple
  Developer ID (build the DMG on macOS). See `exyconn-tracker-app/README.md`.
