#!/usr/bin/env bash
# =============================================================================
# Exyconn — nightly MongoDB backup. Run ON the server, as root, from a timer.
#
#   bash /opt/exyconn-deploy/install-backups.sh     # installs the timer
#   bash /opt/exyconn-deploy/backup-mongo.sh        # or run one by hand
#
# Until this existed the deployment had no backup of any kind: one host, one
# database, and a restore story that began "there isn't one". Everything the
# company keeps — payroll, invoices, contracts, the compliance registers — lives
# in that database.
#
# One compressed archive per run, pruned after RETAIN_DAYS, plus a small status
# file the portal reads so that "when did this last work" is answerable from a
# screen rather than from an SSH session.
# =============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/exyconn-backups}"
# The status file lives in its own directory, NOT beside the archives: the portal API
# mounts this directory to read it, and a dump of the whole company has no business
# being visible inside a web-facing container.
STATUS_DIR="${STATUS_DIR:-/opt/exyconn-backup-status}"
STATUS_FILE="${STATUS_FILE:-${STATUS_DIR}/status.json}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"
ENV_FILE="${ENV_FILE:-/opt/exyconn/server.env}"

# Read from the API's own env file so there is one place the connection string lives.
# It is then passed as --uri, which `ps` shows to anybody with a shell on the box: this
# host is root-only, and mongodump has no way to take a full URI any other way.
if [[ -z "${MONGODB_URI:-}" && -r "${ENV_FILE}" ]]; then
  MONGODB_URI="$(grep -E '^MONGODB_URI=' "${ENV_FILE}" | head -1 | cut -d= -f2-)"
fi
if [[ -z "${MONGODB_URI:-}" ]]; then
  echo "MONGODB_URI is not set and ${ENV_FILE} does not carry one" >&2
  exit 2
fi

started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
stamp="$(date -u +%Y%m%d-%H%M%S)"
archive="${BACKUP_DIR}/exyconn-${stamp}.archive.gz"
mkdir -p "${BACKUP_DIR}" "${STATUS_DIR}"
chmod 700 "${BACKUP_DIR}"
chmod 755 "${STATUS_DIR}"

# Written whatever happens, so a failed run is as visible as a successful one —
# a backup that silently stopped a month ago is the classic way to discover you
# have no backups on the day you need one.
write_status() {
  local ok="$1" bytes="$2" seconds="$3" message="$4"
  cat >"${STATUS_FILE}" <<JSON
{
  "ok": ${ok},
  "startedAt": "${started_at}",
  "finishedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "archive": "$(basename "${archive}")",
  "bytes": ${bytes},
  "seconds": ${seconds},
  "retainDays": ${RETAIN_DAYS},
  "message": "${message}"
}
JSON
  # World-readable: the container reads it as a non-root user, and it says only when
  # the backup ran and how big it was.
  chmod 644 "${STATUS_FILE}"
}

start_seconds="$(date +%s)"
if ! mongodump \
  --uri="${MONGODB_URI}" \
  --archive="${archive}" \
  --gzip \
  --quiet; then
  rm -f "${archive}"
  write_status false 0 "$(($(date +%s) - start_seconds))" "mongodump failed"
  echo "mongodump failed" >&2
  exit 1
fi

bytes="$(stat -c %s "${archive}" 2>/dev/null || stat -f %z "${archive}")"
# An archive far too small to be the whole database is a failure that exited
# zero — usually an empty or wrong URI. Better to shout now than at restore time.
if [[ "${bytes}" -lt 1024 ]]; then
  write_status false "${bytes}" "$(($(date +%s) - start_seconds))" "archive is implausibly small"
  echo "archive is only ${bytes} bytes; refusing to call that a backup" >&2
  exit 1
fi

chmod 600 "${archive}"
find "${BACKUP_DIR}" -name 'exyconn-*.archive.gz' -mtime "+${RETAIN_DAYS}" -delete
write_status true "${bytes}" "$(($(date +%s) - start_seconds))" "ok"
echo "Backed up ${bytes} bytes to ${archive}"
