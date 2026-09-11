import { Box, Text } from '@exyconn/shell/components/ui';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { AppLogRow } from '../logs-grid';

/** Who, when, how often and on what — the group's own numbers, beside its occurrences. */
export function LogSummary({ row }: Readonly<{ row: AppLogRow }>) {
  const { formatDateTime } = useSettings();
  const lines: Array<[string, string]> = [
    ['App', row.app],
    ['Times', row.count.toLocaleString()],
    ['People', row.userCount.toLocaleString()],
    ['Last seen by', row.lastUserName || row.lastUserEmail || 'Nobody signed in'],
    ['First seen', formatDateTime(row.firstSeenAt)],
    ['Last seen', formatDateTime(row.lastSeenAt)],
    ['Screen / page', row.route || '—'],
    ['Platform', row.platform || '—'],
    ['Version', row.appVersion || '—'],
  ];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
      <DetailRow label="Level">
        <StatusChip value={row.level} />
      </DetailRow>
      <DetailRow label="Status">
        <StatusChip value={row.status} />
      </DetailRow>
      <DetailRow label="Source">
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
