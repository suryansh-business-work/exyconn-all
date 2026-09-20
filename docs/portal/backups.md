# Backups and restore

Until recently there were none. One host, one MongoDB, and a restore story that began
"there isn't one" — for a database holding payroll, invoices, contracts, the compliance
registers and every tracker screenshot.

## Installing it

Run once on the host, as root:

```bash
scp -r deploy root@<host>:/opt/exyconn-deploy
ssh root@<host> 'bash /opt/exyconn-deploy/install-backups.sh'
```

That installs `mongodb-database-tools`, drops the two scripts into `/usr/local/sbin`,
writes a systemd service and timer, enables it and takes the first backup immediately.

systemd rather than cron, because `systemctl status exyconn-backup` answers "did it work
last night" without reading a log file, and `Persistent=true` means a host that was off at
02:30 takes the backup when it comes back instead of skipping the day.

## What a run does

|           |                                                                                             |
| --------- | ------------------------------------------------------------------------------------------- |
| Archive   | `/opt/exyconn-backups/exyconn-<timestamp>.archive.gz` — one gzipped `mongodump` archive     |
| Retention | 14 days by default (`RETAIN_DAYS`), pruned at the end of each run                           |
| Status    | `/opt/exyconn-backup-status/status.json`, rewritten **whether the run succeeded or failed** |

A run that exits zero but produced an archive under a kilobyte is treated as a failure —
that is what an empty or wrong `MONGODB_URI` looks like, and it is better to shout now than
at restore time.

The status file lives in its **own directory**, not beside the archives, because the portal
API mounts that directory to show the card. A dump of the whole company has no business
being readable inside a web-facing container.

## Seeing it from the portal

`docker-compose.prod.yml` mounts the status directory read-only into `portal-server` and
sets `BACKUP_STATUS_FILE`. **Admin › System Health** then carries a Database backup card:
when it last ran, how big the archive was, how many days are kept — and, when no status file
is mounted at all, it says so as a warning rather than staying quiet.

The record is a file rather than a row on purpose: a backup exists to survive the database,
so its own record must not live inside the thing it is insuring.

## Restoring

A backup nobody has restored is a hypothesis. `restore-mongo.sh` is the other half, and it
is deliberately awkward in exactly one direction:

```bash
# Prove the archive is readable. Changes nothing.
DRY_RUN=1 exyconn-restore-mongo /opt/exyconn-backups/<archive>

# The monthly drill: restore into a throwaway database.
TARGET_DB=exyconn-restore-test exyconn-restore-mongo /opt/exyconn-backups/<archive>

# Replace production. There is no undo.
I_MEAN_IT=replace-production exyconn-restore-mongo /opt/exyconn-backups/<archive>
```

Run the drill monthly. It costs nothing and it is the only thing that turns a directory of
archives into a backup.

## What this is not

- **Off-site.** The archives sit on the same host as the database they protect. A host lost
  is still everything lost. Shipping them to object storage is the obvious next step and is
  not done here.
- **Point-in-time.** A nightly dump means up to a day of writes can be lost. Oplog-based
  recovery is not set up.
- **Tested automatically.** The drill is a command somebody runs, not a job.
