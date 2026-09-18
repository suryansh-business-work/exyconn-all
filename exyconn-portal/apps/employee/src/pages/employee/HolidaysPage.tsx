import { format } from 'date-fns';
import { Box, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';

import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useMyHolidaysQuery } from '@exyconn/shell/graphql/generated';
import { densePanel } from '@exyconn/shell/components/glass/glass';

type HolidayRow = {
  id: string;
  name: string;
  date: string;
  type: string;
  description: string | null;
};

/** Employee self-service: the holidays observed in the country they work in. */
export function HolidaysPage() {
  const { data, loading, refetch } = useMyHolidaysQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();

  const rows = (data?.myHolidays ?? []) as HolidayRow[];

  const columns: Column<HolidayRow>[] = [
    { key: 'name', label: 'Holiday', render: (h) => <Text weight="medium">{h.name}</Text> },
    { key: 'date', label: 'Date', render: (h) => formatDate(h.date) },
    { key: 'day', label: 'Day', render: (h) => format(new Date(h.date), 'EEEE') },
    { key: 'type', label: 'Type', render: (h) => <StatusChip value={h.type} /> },
    { key: 'description', label: 'Description', render: (h) => h.description ?? '—' },
  ];

  return (
    <Box>
      <PageHeader title="Holidays" subtitle="Holidays observed where you work" />
      <Box sx={densePanel}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage="No holidays published yet."
          loading={loading}
          onRefresh={refetch}
        />
      </Box>
    </Box>
  );
}
