import { useState } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import { Alert, MenuItem, Stack, TextField } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  McpEndpoint,
  useMcpActivityQuery,
  type McpActivityQuery,
} from '@exyconn/shell/graphql/generated';

type CallRow = McpActivityQuery['mcpActivity'][number];

const WINDOWS = [1, 7, 30, 90] as const;
/** The most calls shown at once. */
const LIMIT = 300;

/**
 * Claude (MCP) activity: everything Claude did through one server — who it acted for, which
 * tool, whether it worked — newest first. On the global server, every module the person may
 * use, each row naming its module. Changes are also in the audit log.
 */
export function McpActivityTab({ endpoint }: Readonly<{ endpoint: McpEndpoint }>) {
  const t = useT();
  const { formatDateTime, formatNumber } = useFormatters();
  const [days, setDays] = useState<number>(7);
  const { data, loading, error, refetch } = useMcpActivityQuery({
    variables: { endpoint, days, limit: LIMIT },
    fetchPolicy: 'cache-and-network',
  });
  const columns: Column<CallRow>[] = [
    { key: 'at', label: 'When', render: (row) => formatDateTime(row.at) },
    { key: 'userName', label: 'Acted for' },
    ...(endpoint === McpEndpoint.All
      ? [{ key: 'server', label: 'Module', render: (row: CallRow) => row.server }]
      : []),
    { key: 'tool', label: 'Tool' },
    { key: 'kind', label: 'Kind', render: (row) => <StatusChip value={row.kind} /> },
    {
      key: 'ok',
      label: 'Outcome',
      render: (row) => <StatusChip value={row.ok ? 'DONE' : 'FAILED'} />,
    },
    { key: 'error', label: 'Reason', render: (row) => row.error || '—' },
    { key: 'durationMs', label: 'Time (ms)', render: (row) => formatNumber(row.durationMs) },
  ];

  return (
    <Stack spacing={1.5}>
      <TextField
        select
        size="small"
        label={t('Period')}
        value={days}
        onChange={(event) => setDays(Number(event.target.value))}
        sx={{ maxWidth: 200 }}
      >
        {WINDOWS.map((value) => (
          <MenuItem key={value} value={value}>
            {t('Last {count} days', { count: value })}
          </MenuItem>
        ))}
      </TextField>
      {error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : (
        <DataTable
          columns={columns}
          rows={data?.mcpActivity ?? []}
          loading={loading}
          onRefresh={refetch}
          emptyMessage="Claude has not done anything through this server in this period."
        />
      )}
    </Stack>
  );
}
