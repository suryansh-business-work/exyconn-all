#!/usr/bin/env bash
# =============================================================================
# Exyconn — restore MongoDB from one of the nightly archives. Run ON the server.
#
#   bash /opt/exyconn-deploy/restore-mongo.sh /opt/exyconn-backups/exyconn-….archive.gz
#   DRY_RUN=1 bash …/restore-mongo.sh <archive>     # check the archive, change nothing
#   TARGET_DB=exyconn-restore-test bash …/restore-mongo.sh <archive>   # the drill
#
# A backup nobody has restored is a hypothesis. This is the other half, and it is
# written to be run monthly against TARGET_DB — restoring into a throwaway
# database proves the archive is readable without touching production.
#
# Restoring OVER the live database is deliberately awkward: it needs
# I_MEAN_IT=replace-production, because there is no undo.
# =============================================================================
set -euo pipefail

archive="${1:-}"
ENV_FILE="${ENV_FILE:-/opt/exyconn/server.env}"

if [[ -z "${archive}" ]]; then
  echo "usage: restore-mongo.sh <archive.gz>" >&2
  exit 2
fi
if [[ ! -r "${archive}" ]]; then
  echo "cannot read ${archive}" >&2
  exit 2
fi

if [[ -z "${MONGODB_URI:-}" && -r "${ENV_FILE}" ]]; then
  MONGODB_URI="$(grep -E '^MONGODB_URI=' "${ENV_FILE}" | head -1 | cut -d= -f2-)"
fi
if [[ -z "${MONGODB_URI:-}" ]]; then
  echo "MONGODB_URI is not set and ${ENV_FILE} does not carry one" >&2
  exit 2
fi

if [[ -n "${DRY_RUN:-}" ]]; then
  echo "==> Reading ${archive} without writing anything"
  mongorestore --uri="${MONGODB_URI}" --archive="${archive}" --gzip --dryRun
  echo "Archive is readable."
  exit 0
fi

if [[ -n "${TARGET_DB:-}" ]]; then
  # The drill: everything lands in a database nobody serves, so a bad archive
  # costs nothing and a good one has been proved.
  echo "==> Restoring ${archive} into ${TARGET_DB}"
  mongorestore --uri="${MONGODB_URI}" --archive="${archive}" --gzip \
    --nsFrom='$prefix$.$suffix$' --nsTo="${TARGET_DB}.\$suffix\$"
  echo "Restored into ${TARGET_DB}. Drop it when you are done looking."
  exit 0
fi

if [[ "${I_MEAN_IT:-}" != "replace-production" ]]; then
  cat >&2 <<'MSG'
Refusing to restore over the live database.

  Prove the archive first:   DRY_RUN=1 restore-mongo.sh <archive>
  Or practise the restore:   TARGET_DB=exyconn-restore-test restore-mongo.sh <archive>
  Only if you really mean to replace production:
                             I_MEAN_IT=replace-production restore-mongo.sh <archive>
MSG
  exit 3
fi

echo "==> Restoring ${archive} OVER the live database, dropping collections first"
mongorestore --uri="${MONGODB_URI}" --archive="${archive}" --gzip --drop
echo "Restored. Restart the portal API so it reopens its connections."
