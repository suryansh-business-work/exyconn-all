import { format } from 'date-fns';
import { Box, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useListHolidaysQuery } from '@exyconn/shell/graphql/generated';

type HolidayRow = {
  id: string;
  name: string;
  date: string;
  type: string;
  description: string | null;
};

/** Employee self-service: read-only company holiday calendar. */
export function HolidaysPage() {
  const { data, loading } = useListHolidaysQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();

  const rows = (data?.listHolidays ?? []) as HolidayRow[];

  const columns: Column<HolidayRow>[] = [
    { key: 'name', label: 'Holiday', render: (h) => <Text weight="medium">{h.name}</Text> },
    { key: 'date', label: 'Date', render: (h) => formatDate(h.date) },
    { key: 'day', label: 'Day', render: (h) => format(new Date(h.date), 'EEEE') },
    { key: 'type', label: 'Type', render: (h) => <StatusChip value={h.type} /> },
    { key: 'description', label: 'Description', render: (h) => h.description ?? '—' },
  ];

  return (
    <Box>
      <PageHeader title="Holidays" subtitle="Company holiday calendar" />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? 'Loading…' : 'No holidays published yet.'}
        />
      </Box>
    </Box>
  );
}
