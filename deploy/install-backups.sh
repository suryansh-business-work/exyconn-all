#!/usr/bin/env bash
# =============================================================================
# Exyconn — install the nightly MongoDB backup timer. Run ON the server (root).
#
#   scp -r deploy root@<host>:/opt/exyconn-deploy
#   ssh root@<host> 'bash /opt/exyconn-deploy/install-backups.sh'
#
# systemd rather than cron: a timer records whether the last run succeeded and
# `systemctl status exyconn-backup` answers "did it work last night" without
# reading a log file. Persistent=true so a host that was off at 02:30 takes the
# backup when it comes back rather than skipping the day.
#
# Idempotent — re-running it just rewrites the unit files.
# =============================================================================
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/opt/exyconn-backups}"
STATUS_DIR="${STATUS_DIR:-/opt/exyconn-backup-status}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"

echo "==> 1/4  mongodb-database-tools (mongodump/mongorestore)"
command -v mongodump >/dev/null || {
  apt-get update
  apt-get install -y mongodb-database-tools
}

echo "==> 2/4  ${BACKUP_DIR}, ${STATUS_DIR} and the scripts"
mkdir -p "${BACKUP_DIR}" "${STATUS_DIR}"
chmod 700 "${BACKUP_DIR}"
chmod 755 "${STATUS_DIR}"
install -m 700 "${SRC_DIR}/backup-mongo.sh" /usr/local/sbin/exyconn-backup-mongo
install -m 700 "${SRC_DIR}/restore-mongo.sh" /usr/local/sbin/exyconn-restore-mongo

echo "==> 3/4  systemd unit and timer"
cat >/etc/systemd/system/exyconn-backup.service <<UNIT
[Unit]
Description=Exyconn MongoDB backup
After=network-online.target

[Service]
Type=oneshot
Environment=BACKUP_DIR=${BACKUP_DIR}
Environment=STATUS_DIR=${STATUS_DIR}
Environment=RETAIN_DAYS=${RETAIN_DAYS}
ExecStart=/usr/local/sbin/exyconn-backup-mongo
UNIT

cat >/etc/systemd/system/exyconn-backup.timer <<'UNIT'
[Unit]
Description=Nightly Exyconn MongoDB backup

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
UNIT

echo "==> 4/4  Enabling and taking the first backup now"
systemctl daemon-reload
systemctl enable --now exyconn-backup.timer
systemctl start exyconn-backup.service

echo
systemctl --no-pager status exyconn-backup.service | tail -5
echo
cat "${STATUS_DIR}/status.json"
echo
cat <<MSG

Mount the status file into the portal API so Admin > System Health can show it:

  volumes:
    - ${STATUS_DIR}:/var/lib/exyconn/backup:ro

docker-compose.prod.yml already carries it, along with
BACKUP_STATUS_FILE=/var/lib/exyconn/backup/status.json. The archives themselves
stay out of the container.

Prove a restore every month — a backup nobody has restored is a hypothesis:

  TARGET_DB=exyconn-restore-test exyconn-restore-mongo ${BACKUP_DIR}/<newest>.archive.gz
MSG
