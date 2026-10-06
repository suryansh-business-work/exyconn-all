import { useState } from 'react';
import DnsIcon from '@mui/icons-material/Dns';
import { useT } from '@exyconn/i18n';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { Alert, Chip, Paper, Text } from '@exyconn/shell/components/ui';
import { useCmsSiteDnsQuery } from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { ARecordForm, type CmsDomainDnsRow } from '../../website/forms/cms-a-record';
import { DnsStatusChip } from './DnsStatusChip';

type DomainRow = CmsDomainDnsRow & { id: string };

const PROVIDER_COLORS: Record<string, 'primary' | 'warning' | 'default'> = {
  GODADDY: 'primary',
  CLOUDFLARE: 'warning',
};

/**
 * Website › Settings › Domains & DNS: for each saved domain, who serves its DNS, its A records
 * and whether they point at the websites' server — and a way to set them.
 */
export function DomainsDnsPanel({ siteId }: Readonly<{ siteId: string }>) {
  const t = useT();
  const notify = useNotify();
  const { data, loading, error, refetch } = useCmsSiteDnsQuery({
    variables: { siteId },
    fetchPolicy: 'network-only',
  });
  const [editing, setEditing] = useState<CmsDomainDnsRow | null>(null);
  const serverIp = data?.cmsSiteDns.serverIp ?? '';
  const rows: DomainRow[] = (data?.cmsSiteDns.domains ?? []).map((row) => ({
    ...row,
    id: row.domain,
  }));

  const columns: Column<DomainRow>[] = [
    { key: 'domain', label: 'Domain' },
    {
      key: 'authority',
      label: 'DNS provider',
      render: (row) => (
        <Chip
          size="small"
          variant="outlined"
          label={row.authority}
          color={PROVIDER_COLORS[row.authority] ?? 'default'}
        />
      ),
    },
    {
      key: 'records',
      label: 'A records',
      render: (row) =>
        row.records.map((record) => `${record.ip} (TTL ${record.ttl})`).join(', ') || '—',
    },
    { key: 'status', label: 'Status', render: (row) => <DnsStatusChip row={row} /> },
  ];

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mt: 3 }}>
      <Text weight="bold" size="lg" component="h2">
        {t('Domains & DNS')}
      </Text>
      <Text size="sm" color="text.secondary" component="p" sx={{ mb: 2 }}>
        {serverIp
          ? t('The websites are served from {ip}. Domains are added in the settings above.', {
              ip: serverIp,
            })
          : t(
              'Domains are added in the settings above; their DNS is read from GoDaddy or Cloudflare.',
            )}
      </Text>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('Could not read the DNS: {reason}', { reason: error.message })}
        </Alert>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading && !data}
        onRefresh={refetch}
        emptyMessage="This site has no domains yet."
        actions={[
          {
            icon: <DnsIcon fontSize="small" />,
            tooltip: 'Add / update A record',
            ariaLabel: 'Add or update the A record',
            onClick: setEditing,
          },
        ]}
      />
      <ARecordForm
        siteId={siteId}
        domain={editing}
        serverIp={serverIp}
        onClose={() => setEditing(null)}
        onDone={() => {
          setEditing(null);
          refetch().catch((reason: unknown) =>
            notify(errorMessage(reason, 'Could not reload the DNS'), 'error'),
          );
        }}
      />
    </Paper>
  );
}
