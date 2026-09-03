#!/usr/bin/env bash
# =============================================================================
# Exyconn — nginx + certbot setup. Run ON the server (root).
#
#   scp -r deploy root@148.135.136.107:/opt/exyconn-deploy
#   ssh root@148.135.136.107 'bash /opt/exyconn-deploy/server-setup.sh'
#
# Adds/updates ONLY the Exyconn vhosts and their TLS certs:
#   exyconn.com(4000) tools(4001) tools-api(4002) portal(4003) portal-server(4004)
#   plus one portal micro-frontend per module: admin(4020) employee(4021)
#   finance(4022) support(4023) crm(4024) products(4025) legal(4026) hr(4027)
#   marketing(4028) projects(4029) ai(4030) website(4031) tracker(4032)
#
# SAFETY: this script is ADDITIVE. It never disables or deletes other sites.
# This box also hosts duncit (duncit.com + duncit-staging-*); wiping sites-enabled
# would take those offline, so we deliberately do NOT do that. It is idempotent —
# safe to re-run.
# =============================================================================
set -euo pipefail

EMAIL="${CERTBOT_EMAIL:-suryansh@exyconn.com}"
NGINX_AVAILABLE=/etc/nginx/sites-available
NGINX_ENABLED=/etc/nginx/sites-enabled
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/nginx"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="/root/nginx-backup-${STAMP}.tar.gz"

# certbot -d args per certificate
DOMAINS=(
  "exyconn.com|www.exyconn.com"
  "tools.exyconn.com"
  "tools-api.exyconn.com"
  "portal.exyconn.com"
  "portal-server.exyconn.com"
  "admin.exyconn.com"
  "employee.exyconn.com"
  "finance.exyconn.com"
  "support.exyconn.com"
  "crm.exyconn.com"
  "products.exyconn.com"
  "legal.exyconn.com"
  "hr.exyconn.com"
  "marketing.exyconn.com"
  "projects.exyconn.com"
  "ai.exyconn.com"
  "website.exyconn.com"
  "tracker.exyconn.com"
  "tech.exyconn.com"
  "it.exyconn.com"
  "status.exyconn.com"
)

echo "==> 1/4  Backing up current nginx config to ${BACKUP}"
tar -czf "${BACKUP}" -C /etc/nginx sites-available sites-enabled 2>/dev/null || true

echo "==> 2/4  Ensuring nginx + certbot are installed"
command -v nginx   >/dev/null || { apt-get update && apt-get install -y nginx; }
command -v certbot >/dev/null || { apt-get update && apt-get install -y certbot python3-certbot-nginx; }

echo "==> 3/4  Installing the Exyconn vhosts (other sites are left untouched)"
for conf in "${SRC_DIR}"/*.conf; do
  name="$(basename "${conf}")"
  installed="${NGINX_AVAILABLE}/${name}"
  # certbot rewrites these files in place to add the 443 block. Don't clobber a vhost
  # that already has TLS wired up, or we'd strip its cert config on every re-run.
  if grep -q "listen 443" "${installed}" 2>/dev/null; then
    # ...but a new app added to this repo's conf would then never land on the server.
    # That is how tech/it/status stayed unrouted for weeks. Append only the server
    # blocks whose server_name is missing, leaving certbot's existing blocks alone.
    missing=""
    while read -r host; do
      grep -qE "^[[:space:]]*server_name[[:space:]]+.*\b${host//./\\.}\b" "${installed}" || missing="${missing} ${host}"
    done < <(grep -hoE "^[[:space:]]*server_name[[:space:]]+[^;]+;" "${conf}" | sed -E 's/^[[:space:]]*server_name[[:space:]]+//; s/;$//' | tr ' ' '\n' | grep -v '^$' | sort -u)

    if [ -z "${missing}" ]; then
      echo "    ${name} already has TLS and every host — leaving as-is"
    else
      echo "    ${name} already has TLS but is missing:${missing} — appending those blocks"
      for host in ${missing}; do
        awk -v want="${host}" '
          /^server[[:space:]]*\{/ && depth == 0 { inblock = 1; buf = "" }
          inblock {
            buf = buf $0 "\n"
            depth += gsub(/\{/, "{")
            depth -= gsub(/\}/, "}")
            if (depth == 0) {
              if (buf ~ "server_name[ \t]+[^;]*[ \t]*" want "[ \t]*;") { printf "\n%s", buf }
              inblock = 0
            }
          }
        ' "${conf}" >> "${installed}"
      done
    fi
  else
    cp "${conf}" "${installed}"
    echo "    installed ${name}"
  fi
  ln -sf "${installed}" "${NGINX_ENABLED}/${name}"
done
nginx -t
systemctl reload nginx

echo "==> 4/4  Obtaining/renewing TLS certificates (certbot skips ones already valid)"
# One certificate per domain, and a failure on one (e.g. DNS not propagated yet)
# must not abort the rest — report them together at the end instead.
FAILED=()
for entry in "${DOMAINS[@]}"; do
  args=()
  IFS='|' read -ra names <<< "${entry}"
  for n in "${names[@]}"; do args+=("-d" "${n}"); done
  echo "    certbot: ${entry}"
  if ! certbot --nginx --non-interactive --agree-tos -m "${EMAIL}" --redirect --keep-until-expiring "${args[@]}"; then
    FAILED+=("${entry}")
  fi
done

nginx -t && systemctl reload nginx
echo "==> Done. The Exyconn sites are served over HTTPS; all other sites untouched."
echo "    Backup of the previous config: ${BACKUP}"
if [ ${#FAILED[@]} -gt 0 ]; then
  echo "    TLS still missing for: ${FAILED[*]}"
  echo "    Check each one's DNS A record points at this host, then re-run this script."
  exit 1
fi
