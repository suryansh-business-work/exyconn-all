import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import { useFormatters } from '@exyconn/i18n';
import { Alert, Stack } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  McpEndpoint,
  useMcpErrorsQuery,
  type McpErrorsQuery,
} from '@exyconn/shell/graphql/generated';
import { serverPath } from '../mcp.paths';
import { TRACE_PARAM } from './McpActivityTab';
import { McpPeriodSelect } from './McpPeriodSelect';
import { useCopyTraceId } from './useCopyTraceId';

type ErrorRow = McpErrorsQuery['mcpErrors'][number] & { id: string };

const WINDOWS = [1, 7, 30, 90, 180] as const;

/**
 * The error log: every way Claude's calls through this server failed in the period, grouped by
 * tool, kind and message, the most frequent first — how often, how many people it hit, when it
 * started and last happened. The latest call's trace id opens it in the activity log.
 */
export function McpErrorsTab({ endpoint }: Readonly<{ endpoint: McpEndpoint }>) {
  const { formatDateTime, formatNumber } = useFormatters();
  const navigate = useNavigate();
  const copyTraceId = useCopyTraceId();
  const [days, setDays] = useState<number>(7);
  const { data, loading, error, refetch } = useMcpErrorsQuery({
    variables: { endpoint, days },
    fetchPolicy: 'cache-and-network',
  });
  const rows = useMemo<ErrorRow[]>(
    () =>
      (data?.mcpErrors ?? []).map((group) => ({
        ...group,
        id: `${group.server}:${group.tool}:${group.errorCode}:${group.error}`,
      })),
    [data],
  );
  const columns: Column<ErrorRow>[] = [
    ...(endpoint === McpEndpoint.All
      ? [{ key: 'server', label: 'Module', render: (row: ErrorRow) => row.server }]
      : []),
    { key: 'tool', label: 'Tool' },
    {
      key: 'errorCode',
      label: 'Failure kind',
      render: (row) => <StatusChip value={row.errorCode} />,
    },
    { key: 'error', label: 'Reason' },
    { key: 'count', label: 'Times', render: (row) => formatNumber(row.count) },
    { key: 'people', label: 'People', render: (row) => formatNumber(row.people) },
    { key: 'firstAt', label: 'First', render: (row) => formatDateTime(row.firstAt) },
    { key: 'lastAt', label: 'Latest', render: (row) => formatDateTime(row.lastAt) },
    { key: 'lastTraceId', label: 'Latest trace id', render: (row) => row.lastTraceId || '—' },
  ];
  const openInActivity = (row: ErrorRow) =>
    navigate(`${serverPath(endpoint, 'activity')}?${TRACE_PARAM}=${row.lastTraceId}`);

  return (
    <Stack spacing={1.5}>
      <McpPeriodSelect days={days} windows={WINDOWS} onChange={setDays} />
      {error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          onRefresh={refetch}
          actions={[
            {
              icon: <ManageSearchIcon fontSize="small" />,
              tooltip: 'Open the latest call in the activity log',
              ariaLabel: 'Open the latest call in the activity log',
              onClick: openInActivity,
              hidden: (row) => !row.lastTraceId,
            },
            {
              icon: <ContentCopyIcon fontSize="small" />,
              tooltip: 'Copy trace id',
              ariaLabel: 'Copy trace id',
              onClick: (row) => copyTraceId(row.lastTraceId),
              hidden: (row) => !row.lastTraceId,
            },
          ]}
          emptyMessage="No calls failed in this period."
        />
      )}
    </Stack>
  );
}
