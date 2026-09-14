import { useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { AppLogRow } from '../logs-grid';

/** Who, when, how often and on what — the group's own numbers, beside its occurrences. */
export function LogSummary({ row }: Readonly<{ row: AppLogRow }>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  const lines: Array<[string, string]> = [
    [t('App'), row.app],
    [t('Times'), row.count.toLocaleString()],
    [t('People'), row.userCount.toLocaleString()],
    [t('Last seen by'), row.lastUserName || row.lastUserEmail || t('Nobody signed in')],
    [t('First seen'), formatDateTime(row.firstSeenAt)],
    [t('Last seen'), formatDateTime(row.lastSeenAt)],
    [t('Screen / page'), row.route || '—'],
    [t('Platform'), row.platform || '—'],
    [t('Version'), row.appVersion || '—'],
  ];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
      <DetailRow label={t('Level')}>
        <StatusChip value={row.level} />
      </DetailRow>
      <DetailRow label={t('Status')}>
        <StatusChip value={row.status} />
      </DetailRow>
      <DetailRow label={t('Source')}>
        <StatusChip value={row.source} />
      </DetailRow>
      {lines.map(([label, value]) => (
        <DetailRow key={label} label={label}>
          <Text size="sm" sx={{ wordBreak: 'break-word' }}>
            {value}
          </Text>
        </DetailRow>
      ))}
    </Box>
  );
}
