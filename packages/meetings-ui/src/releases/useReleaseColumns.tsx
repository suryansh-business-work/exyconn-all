import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Link, Tooltip } from '@exyconn/shell/components/ui';
import type { Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { formatBytes } from '@exyconn/shell/utils/file';
import type { ReleaseRow } from '../forms/release-status';

/** Characters of a hash shown in the table; the whole value is in the tooltip. */
const SHORT_HASH = 12;

/** An address opened in a new tab, or a dash when there is none. */
function ExternalLink({ href, label }: Readonly<{ href: string; label: string }>) {
  if (!href) {
    return <>—</>;
  }
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </Link>
  );
}

/** A hash cut short, with the whole value a hover away and selectable. */
function ShortHash({ value }: Readonly<{ value: string }>) {
  return (
    <Tooltip title={value}>
      <Box component="code" sx={{ userSelect: 'all' }}>
        {value.slice(0, SHORT_HASH)}
      </Box>
    </Tooltip>
  );
}

/** Every field of a release as a table column. */
export function useReleaseColumns(): Column<ReleaseRow>[] {
  const t = useT();
  const { formatDateTime, formatNumber } = useFormatters();
  return [
    { key: 'version', label: 'Version' },
    { key: 'channel', label: 'Channel', render: (row) => <StatusChip value={row.channel} /> },
    { key: 'buildNumber', label: 'Build', render: (row) => String(row.buildNumber) },
    { key: 'commitSha', label: 'Commit', render: (row) => <ShortHash value={row.commitSha} /> },
    { key: 'builtAt', label: 'Built at', render: (row) => formatDateTime(row.builtAt) },
    { key: 'artifactName', label: 'Artifact' },
    { key: 'artifactSize', label: 'Size', render: (row) => formatBytes(row.artifactSize) },
    { key: 'sha256', label: 'SHA-256', render: (row) => <ShortHash value={row.sha256} /> },
    { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
    { key: 'publisherName', label: 'Published by', render: (row) => row.publisherName || '—' },
    { key: 'downloadCount', label: 'Downloads', render: (row) => formatNumber(row.downloadCount) },
    {
      key: 'storeUrl',
      label: 'Store',
      render: (row) => <ExternalLink href={row.storeUrl} label={t('Store listing')} />,
    },
    {
      key: 'buildRunUrl',
      label: 'Build log',
      render: (row) => <ExternalLink href={row.buildRunUrl} label={t('Open build log')} />,
    },
  ];
}
