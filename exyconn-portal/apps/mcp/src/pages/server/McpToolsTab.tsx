import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Stack, TextField } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  useMcpToolsQuery,
  type McpEndpoint,
  type McpToolsQuery,
} from '@exyconn/shell/graphql/generated';

type ToolRow = McpToolsQuery['mcpTools'][number] & { id: string };

/** A tool's arguments in one line: required ones marked with an asterisk. */
const argumentsOf = (row: ToolRow) =>
  row.arguments.map((arg) => `${arg.name}${arg.required ? '*' : ''}: ${arg.type}`).join(', ') ||
  '—';

const COLUMNS: Column<ToolRow>[] = [
  { key: 'name', label: 'Tool' },
  { key: 'server', label: 'Module' },
  { key: 'kind', label: 'Kind', render: (row) => <StatusChip value={row.kind} /> },
  { key: 'arguments', label: 'Arguments', render: argumentsOf },
  { key: 'description', label: 'What it does', render: (row) => row.description.split('\n')[0] },
];

/** Every tool of one server Claude can call, searchable by name or description. */
export function McpToolsTab({ endpoint }: Readonly<{ endpoint: McpEndpoint }>) {
  const t = useT();
  const [search, setSearch] = useState('');
  const { data, loading, error, refetch } = useMcpToolsQuery({ variables: { endpoint } });
  const rows = useMemo<ToolRow[]>(() => {
    const words = search.trim().toLowerCase();
    return (data?.mcpTools ?? [])
      .filter((tool) => `${tool.name} ${tool.description}`.toLowerCase().includes(words))
      .map((tool) => ({ ...tool, id: tool.name }));
  }, [data, search]);

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  return (
    <Stack spacing={1.5}>
      <TextField
        size="small"
        label={t('Search tools')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        onRefresh={refetch}
        emptyMessage="No tool matches."
      />
    </Stack>
  );
}
