import { Box, Link, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useMyDocumentsQuery } from '@exyconn/shell/graphql/generated';

type Row = { id: string; kind: string; title: string; url: string; issuedOn: string };

/** Employee self-service: the documents HR has issued to this employee. */
export function DocumentsPage() {
  const { data, loading } = useMyDocumentsQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const rows = (data?.myDocuments ?? []) as Row[];

  const columns: Column<Row>[] = [
    { key: 'title', label: 'Document', render: (d) => <Text weight="medium">{d.title}</Text> },
    { key: 'kind', label: 'Type', render: (d) => <StatusChip value={d.kind} /> },
    { key: 'issuedOn', label: 'Issued', render: (d) => formatDate(d.issuedOn) },
    {
      key: 'url',
      label: 'File',
      render: (d) => (
        <Link href={d.url} target="_blank" rel="noopener noreferrer">
          Open
        </Link>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="My Documents" subtitle="Letters, tax and policy documents from HR" />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? 'Loading…' : 'No documents have been issued to you yet.'}
        />
      </Box>
    </Box>
  );
}
