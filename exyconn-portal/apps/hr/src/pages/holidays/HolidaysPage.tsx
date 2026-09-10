import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListHolidaysStatsQuery,
  useDeleteHolidayMutation,
  ListHolidaysPagedDocument,
  type ListHolidaysPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { HolidayForm, type HolidayRow } from './forms/holiday';
import { HOLIDAY_COLUMNS, type PagedHolidayRow, type HolidayGridContext } from './holiday-grid';
import { color } from '@exyconn/shell/components/ui';

/** Holidays — server-paged admin grid over the holiday records. */
export function HolidaysPage() {
  const { data: statsData, refetch: refetchStats } = useListHolidaysStatsQuery();
  const [deleteHoliday] = useDeleteHolidayMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<HolidayRow, PagedHolidayRow>({
    label: 'Holiday',
    onDelete: (row) => deleteHoliday({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this holiday?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListHolidaysPagedDocument,
    (data: ListHolidaysPagedQuery) => data.listHolidaysPaged,
  );

  const stats = statsData?.listHolidaysStats;
  const statItems: StatItem[] = [
    { label: 'Holidays', value: String(statTotal(stats)), accent: color.amber[500] },
    {
      label: 'Public',
      value: String(statCount(stats, 'type', 'PUBLIC')),
      accent: color.amber[500],
    },
    {
      label: 'Optional',
      value: String(statCount(stats, 'type', 'OPTIONAL')),
      accent: color.amber[500],
    },
    {
      label: 'Restricted',
      value: String(statCount(stats, 'type', 'RESTRICTED')),
      accent: color.amber[500],
    },
  ];

  const gridContext: HolidayGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Holidays"
      subtitle="Company and public holiday calendar"
      entityLabel="holiday"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <HolidayForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={HOLIDAY_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search holidays…"
    />
  );
}
