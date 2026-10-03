import { useMemo } from 'react';
import { Box, Grid, Typography } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useT } from '@exyconn/i18n';
import { DnsRecordStatus } from '@exyconn/shell/graphql/generated';
import type { DnsRecordRow } from './dns.types';

type Side = 'godaddy' | 'cloudflare';

/** A record as one side's table shows it; the id is the record's identity across both sides. */
type SideRow = DnsRecordRow & { id: string; ttl: number | null };

const valueOf = (row: DnsRecordRow) =>
  row.priority === null || row.priority === undefined
    ? row.content
    : `${row.priority} ${row.content}`;

const columnsFor = (side: Side): Column<SideRow>[] => [
  { key: 'type', label: 'Type' },
  { key: 'name', label: 'Name' },
  { key: 'content', label: 'Value', render: (row) => valueOf(row) },
  { key: 'ttl', label: 'TTL', render: (row) => (row.ttl === 1 ? 'Auto' : String(row.ttl ?? '—')) },
  ...(side === 'cloudflare'
    ? [
        {
          key: 'cloudflareProxied',
          label: 'Proxied',
          render: (row: SideRow) => (row.cloudflareProxied ? 'Yes' : 'No'),
        },
      ]
    : []),
  { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
];

/** The records one side holds: everything except what only the other side has. */
const rowsFor = (records: readonly DnsRecordRow[], side: Side): SideRow[] => {
  const absent =
    side === 'godaddy' ? DnsRecordStatus.OnlyOnCloudflare : DnsRecordStatus.MissingOnCloudflare;
  return records
    .filter((record) => record.status !== absent)
    .map((record) => ({
      ...record,
      id: record.key,
      ttl: side === 'godaddy' ? (record.godaddyTtl ?? null) : (record.cloudflareTtl ?? null),
    }));
};

interface RecordsCompareProps {
  records: readonly DnsRecordRow[];
  hasZone: boolean;
  loading: boolean;
  onRefresh: () => Promise<unknown>;
}

/** GoDaddy's records on one side and Cloudflare's on the other, each marked with where it exists. */
export function RecordsCompare({
  records,
  hasZone,
  loading,
  onRefresh,
}: Readonly<RecordsCompareProps>) {
  const t = useT();
  const godaddy = useMemo(() => rowsFor(records, 'godaddy'), [records]);
  const cloudflare = useMemo(() => rowsFor(records, 'cloudflare'), [records]);
  const cloudflareEmpty = hasZone
    ? 'No records on Cloudflare yet.'
    : 'This domain has no Cloudflare zone yet — shift the DNS to create it.';

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Box component="section" aria-labelledby="dns-godaddy-title">
          <Typography id="dns-godaddy-title" variant="subtitle1" sx={{ mb: 1 }}>
            {t('GoDaddy')} · {godaddy.length}
          </Typography>
          <DataTable
            columns={columnsFor('godaddy')}
            rows={godaddy}
            emptyMessage="No records on GoDaddy."
            loading={loading}
            onRefresh={onRefresh}
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Box component="section" aria-labelledby="dns-cloudflare-title">
          <Typography id="dns-cloudflare-title" variant="subtitle1" sx={{ mb: 1 }}>
            {t('Cloudflare')} · {cloudflare.length}
          </Typography>
          <DataTable
            columns={columnsFor('cloudflare')}
            rows={cloudflare}
            emptyMessage={cloudflareEmpty}
            loading={loading}
            onRefresh={onRefresh}
          />
        </Box>
      </Grid>
    </Grid>
  );
}
