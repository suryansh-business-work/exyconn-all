import { format } from 'date-fns';
import { Box, Text } from '@/components/ui';
import { DataTable, type Column } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';
import { PageHeader } from '@/components/layout/PageHeader';
import { glass } from '@/components/glass/glass';
import { useSettings } from '@/hooks/useSettings';
import { useListHolidaysQuery } from '@/graphql/generated';

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
