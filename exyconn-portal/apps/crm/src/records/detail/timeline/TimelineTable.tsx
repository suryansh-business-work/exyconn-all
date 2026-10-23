import { useT, useFormatters } from '@exyconn/i18n';
import { Chip, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { KIND_STYLES } from './timeline.kinds';
import type { TimelineRow } from './TimelineEntry';
import { TimelineTitle } from './TimelineTitle';
import { TimelineDetailsButton } from './TimelineDetailsButton';

interface TimelineTableProps {
  rows: TimelineRow[];
  loading: boolean;
  onRefresh: () => Promise<unknown>;
  onViewDetails: (row: TimelineRow) => void;
}

/** The same touchpoints as the timeline, one row each, for scanning many at once. */
export function TimelineTable({
  rows,
  loading,
  onRefresh,
  onViewDetails,
}: Readonly<TimelineTableProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const columns: Column<TimelineRow>[] = [
    {
      key: 'kind',
      label: 'Type',
      render: (row) => <Chip size="small" label={t(KIND_STYLES[row.kind].label)} />,
    },
    {
      key: 'title',
      label: 'Activity',
      render: (row) => <TimelineTitle row={row} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => row.status && <Chip size="small" variant="outlined" label={row.status} />,
    },
    {
      key: 'summary',
      label: 'Details',
      render: (row) => (
        <Text
          size="sm"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            overflowWrap: 'anywhere',
          }}
        >
          {row.summary}
        </Text>
      ),
    },
    {
      key: 'at',
      label: 'When',
      render: (row) => <time dateTime={row.at}>{formatDateTime(row.at)}</time>,
    },
    { key: 'actor', label: 'By' },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => <TimelineDetailsButton row={row} onOpen={onViewDetails} />,
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      onRefresh={onRefresh}
      emptyMessage="Nothing has happened with this record yet."
    />
  );
}
