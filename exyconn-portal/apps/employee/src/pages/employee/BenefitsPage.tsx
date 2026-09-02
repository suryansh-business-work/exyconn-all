import { Box, Link, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useMyBenefitsQuery } from '@exyconn/shell/graphql/generated';

type Row = {
  id: string;
  kind: string;
  name: string;
  provider: string;
  reference: string;
  coverage: string;
  validTo?: string | null;
  documentUrl?: string | null;
};

/** Employee self-service: insurance, PF, gratuity and other company benefits. */
export function BenefitsPage() {
  const { data, loading } = useMyBenefitsQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const rows = (data?.myBenefits ?? []) as Row[];

  const columns: Column<Row>[] = [
    { key: 'name', label: 'Benefit', render: (b) => <Text weight="medium">{b.name}</Text> },
    { key: 'kind', label: 'Type', render: (b) => <StatusChip value={b.kind} /> },
    { key: 'provider', label: 'Provider', render: (b) => b.provider || '—' },
    { key: 'reference', label: 'Reference', render: (b) => b.reference || '—' },
    { key: 'coverage', label: 'Coverage', render: (b) => b.coverage || '—' },
    {
      key: 'validTo',
      label: 'Valid till',
      render: (b) => (b.validTo ? formatDate(b.validTo) : '—'),
    },
    {
      key: 'documentUrl',
      label: 'Document',
      render: (b) =>
        b.documentUrl ? (
          <Link href={b.documentUrl} target="_blank" rel="noopener noreferrer">
            Open
          </Link>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Benefits" subtitle="Insurance, PF and other company benefits" />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? 'Loading…' : 'No benefits recorded for you yet.'}
        />
      </Box>
    </Box>
  );
}
