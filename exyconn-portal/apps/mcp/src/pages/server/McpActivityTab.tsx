import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useFormatters, useT } from '@exyconn/i18n';
import { Alert, MenuItem, Stack, TextField } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useDebouncedValue } from '@exyconn/shell/hooks/useDebouncedValue';
import { McpEndpoint, useMcpActivityQuery } from '@exyconn/shell/graphql/generated';
import { McpCallDrawer, type McpCallRow } from './McpCallDrawer';
import { McpPeriodSelect } from './McpPeriodSelect';
import { useCopyTraceId } from './useCopyTraceId';

type Formatters = ReturnType<typeof useFormatters>;
type CallRow = McpCallRow;
type Outcome = 'all' | 'ok' | 'failed';

const WINDOWS = [1, 7, 30, 90] as const;
/** The most calls shown at once. */
const LIMIT = 300;
/** The query string a link to one call carries, e.g. from the error log. */
export const TRACE_PARAM = 'trace';

const OUTCOME_FILTER: Readonly<Record<Outcome, boolean | null>> = {
  all: null,
  ok: true,
  failed: false,
};

/** The columns of the log; the module only on the global server, where calls span them. */
function columnsOf(
  endpoint: McpEndpoint,
  { formatDateTime, formatNumber }: Readonly<Pick<Formatters, 'formatDateTime' | 'formatNumber'>>,
) {
  const columns: Column<CallRow>[] = [
    { key: 'at', label: 'When', render: (row) => formatDateTime(row.at) },
    { key: 'userName', label: 'Acted for' },
    { key: 'clientName', label: 'Client' },
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
    { key: 'errorCode', label: 'Failure kind', render: (row) => row.errorCode || '—' },
    { key: 'error', label: 'Reason', render: (row) => row.error || '—' },
    { key: 'durationMs', label: 'Time (ms)', render: (row) => formatNumber(row.durationMs) },
    { key: 'traceId', label: 'Trace id', render: (row) => row.traceId || '—' },
  ];
  return columns;
}

/**
 * Claude (MCP) activity: everything Claude did through one server — who it acted for, from which
 * client, which tool, whether it worked and why not — newest first, each call with the trace id
 * Claude was handed. Narrow it to failures, or find a call by trace id, tool or person. On the
 * global server, every module the person may use. Changes are also in the audit log.
 */
export function McpActivityTab({ endpoint }: Readonly<{ endpoint: McpEndpoint }>) {
  const t = useT();
  const formatters = useFormatters();
  const copyTraceId = useCopyTraceId();
  const [params] = useSearchParams();
  const [days, setDays] = useState<number>(7);
  const [outcome, setOutcome] = useState<Outcome>('all');
  const [search, setSearch] = useState(params.get(TRACE_PARAM) ?? '');
  const [open, setOpen] = useState<CallRow | null>(null);
  const query = useDebouncedValue(search, 300);
  const { data, loading, error, refetch } = useMcpActivityQuery({
    variables: {
      endpoint,
      days,
      limit: LIMIT,
      ok: OUTCOME_FILTER[outcome],
      search: query.trim() || null,
    },
    fetchPolicy: 'cache-and-network',
  });

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <McpPeriodSelect days={days} windows={WINDOWS} onChange={setDays} />
        <TextField
          select
          size="small"
          label={t('Outcome')}
          value={outcome}
          onChange={(event) => setOutcome(event.target.value as Outcome)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">{t('Every call')}</MenuItem>
          <MenuItem value="ok">{t('Worked')}</MenuItem>
          <MenuItem value="failed">{t('Failed')}</MenuItem>
        </TextField>
        <TextField
          size="small"
          label={t('Find a call')}
          helperText={t('A trace id, or part of a tool or person name')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: 280 }}
        />
      </Stack>
      {error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : (
        <DataTable
          columns={columnsOf(endpoint, formatters)}
          rows={data?.mcpActivity ?? []}
          loading={loading}
          onRefresh={refetch}
          onRowClick={setOpen}
          actions={[
            {
              icon: <ContentCopyIcon fontSize="small" />,
              tooltip: 'Copy trace id',
              ariaLabel: 'Copy trace id',
              onClick: (row) => copyTraceId(row.traceId),
              hidden: (row) => !row.traceId,
            },
          ]}
          emptyMessage="No calls match in this period."
        />
      )}
      <McpCallDrawer row={open} onClose={() => setOpen(null)} />
    </Stack>
  );
}
