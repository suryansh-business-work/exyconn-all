import { Stack, Text } from '@exyconn/shell/components/ui';
import type { Column } from '@exyconn/shell/components/data/DataTable';
import type { SslCertificateRow } from './ssl.types';
import { DaysLeft, SslStatusChip } from './SslStatusChip';

/** Host first, with the monitors it came from beneath it. */
function HostCell({ row }: Readonly<{ row: SslCertificateRow }>) {
  return (
    <Stack>
      <Text size="sm" weight="medium">
        {row.host}
      </Text>
      <Text size="caption" color="text.secondary">
        {row.monitors.join(', ')}
      </Text>
    </Stack>
  );
}

/** The certificate table's columns; dates are formatted by the caller's settings. */
export function sslColumns(
  warningDays: number,
  formatDate: (value: string) => string,
): Column<SslCertificateRow>[] {
  return [
    { key: 'host', label: 'Host', render: (row) => <HostCell row={row} /> },
    { key: 'status', label: 'Status', render: (row) => <SslStatusChip status={row.status} /> },
    {
      key: 'daysLeft',
      label: 'Days left',
      render: (row) => <DaysLeft daysLeft={row.daysLeft} warningDays={warningDays} />,
    },
    {
      key: 'validTo',
      label: 'Expires',
      render: (row) => (row.validTo ? formatDate(row.validTo) : '—'),
    },
    { key: 'issuer', label: 'Issuer', render: (row) => row.issuer || '—' },
    { key: 'protocol', label: 'Protocol', render: (row) => row.protocol || '—' },
    {
      key: 'error',
      label: 'Problem',
      render: (row) => (
        <Text size="sm" sx={{ overflowWrap: 'anywhere' }}>
          {row.error || '—'}
        </Text>
      ),
    },
  ];
}
