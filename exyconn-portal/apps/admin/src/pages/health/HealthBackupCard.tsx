import { useT } from '@exyconn/i18n';
import { Alert, Box, Stack, Typography } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import type { SystemHealthQuery } from '@exyconn/shell/graphql/generated';

type Backup = SystemHealthQuery['systemHealth']['backup'];

interface HealthBackupCardProps {
  backup: Backup;
  formatDateTime: (value: string | null | undefined) => string;
}

/** What the card says, and how loudly, for each of the three states a backup can be in. */
function severityOf(backup: Backup): 'success' | 'warning' | 'error' {
  if (!backup.configured) {
    return 'warning';
  }
  return backup.ok ? 'success' : 'error';
}

/**
 * Admin › System Health: the nightly database backup.
 *
 * Read from a file the host writes, not from a row in the database — a backup exists to
 * survive the database, so its own record must not live inside it. "Not installed" is a
 * warning rather than a silence: a deployment with no backup should say so on the screen
 * somebody checks, not on the day it is needed.
 */
export function HealthBackupCard({ backup, formatDateTime }: Readonly<HealthBackupCardProps>) {
  const t = useT();
  const severity = severityOf(backup);

  const headline = () => {
    if (!backup.configured) {
      return t('No backup is installed on this host.');
    }
    return backup.ok ? t('Last backup succeeded.') : t('The last backup failed.');
  };

  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {t('Database backup')}
      </Typography>
      <Alert severity={severity} sx={{ mb: 1 }}>
        {headline()}
      </Alert>
      {backup.configured && (
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('Last run: {when}', {
              when: backup.lastRunAt ? formatDateTime(backup.lastRunAt) : t('never'),
            })}
          </Typography>
          {backup.archive && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('{archive} — {size} MB', { archive: backup.archive, size: backup.sizeMb })}
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('Archives kept for {days} days', { days: backup.retainDays })}
          </Typography>
          {!backup.ok && backup.message && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              {backup.message}
            </Typography>
          )}
        </Stack>
      )}
      {!backup.configured && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('Run deploy/install-backups.sh on the host to take one every night.')}
        </Typography>
      )}
    </Box>
  );
}
