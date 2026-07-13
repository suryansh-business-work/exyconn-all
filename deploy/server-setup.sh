#!/usr/bin/env bash
# =============================================================================
# Exyconn — one-time server nginx + certbot setup. Run ON the server (root).
#
#   scp -r deploy root@148.135.136.107:/opt/exyconn-deploy
#   ssh root@148.135.136.107 'bash /opt/exyconn-deploy/server-setup.sh'
#
# This SAFELY reconfigures nginx to serve ONLY the five Exyconn sites:
#   exyconn.com(4000) tools(4001) tools-api(4002) portal(4003) portal-server(4004)
# It backs up the current nginx config first, and it never deletes sites-available
# files — it only re-points sites-enabled. Review the backup before deleting it.
# =============================================================================
set -euo pipefail

EMAIL="${CERTBOT_EMAIL:-suryansh@exyconn.com}"
NGINX_AVAILABLE=/etc/nginx/sites-available
NGINX_ENABLED=/etc/nginx/sites-enabled
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/nginx"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="/root/nginx-backup-${STAMP}.tar.gz"

DOMAINS=(
  "exyconn.com|www.exyconn.com"
  "tools.exyconn.com"
  "tools-api.exyconn.com"
  "portal.exyconn.com"
  "portal-server.exyconn.com"
)

echo "==> 1/5  Backing up current nginx config to ${BACKUP}"
tar -czf "${BACKUP}" -C /etc/nginx sites-available sites-enabled 2>/dev/null || true

echo "==> 2/5  Ensuring nginx + certbot are installed"
if ! command -v nginx >/dev/null; then apt-get update && apt-get install -y nginx; fi
if ! command -v certbot >/dev/null; then apt-get update && apt-get install -y certbot python3-certbot-nginx; fi

echo "==> 3/5  Disabling all currently-enabled sites (backed up above)"
# Only removes symlinks in sites-enabled; the underlying files in sites-available stay.
find "${NGINX_ENABLED}" -maxdepth 1 -type l -delete

echo "==> 4/5  Installing the five Exyconn vhosts (HTTP; certbot adds TLS next)"
for conf in "${SRC_DIR}"/*.conf; do
  name="$(basename "${conf}")"
  cp "${conf}" "${NGINX_AVAILABLE}/${name}"
  ln -sf "${NGINX_AVAILABLE}/${name}" "${NGINX_ENABLED}/${name}"
  echo "    enabled ${name}"
done
nginx -t
systemctl reload nginx

echo "==> 5/5  Obtaining/renewing TLS certificates via certbot"
for entry in "${DOMAINS[@]}"; do
  args=()
  IFS='|' read -ra names <<< "${entry}"
  for n in "${names[@]}"; do args+=("-d" "${n}"); done
  echo "    certbot for ${entry}"
  certbot --nginx --non-interactive --agree-tos -m "${EMAIL}" --redirect "${args[@]}"
done

echo "==> Done. nginx now serves only the five Exyconn sites, all on HTTPS."
echo "    Backup of the previous config: ${BACKUP}"
echo "    certbot auto-renewal is handled by the packaged systemd timer."
