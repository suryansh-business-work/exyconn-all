import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListLocationsStatsQuery,
  useDeleteLocationMutation,
  ListLocationsPagedDocument,
  type ListLocationsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { LocationForm, type LocationRow } from './forms/location';
import { LOCATION_COLUMNS, type PagedLocationRow, type LocationGridContext } from './location-grid';

/** Locations — server-paged admin grid over the location records. */
export function LocationsPage() {
  const { data: statsData, refetch: refetchStats } = useListLocationsStatsQuery();
  const [deleteLocation] = useDeleteLocationMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<LocationRow, PagedLocationRow>({
    label: 'Location',
    onDelete: (row) => deleteLocation({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this location?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListLocationsPagedDocument,
    (data: ListLocationsPagedQuery) => data.listLocationsPaged,
  );

  const stats = statsData?.listLocationsStats;
  const statItems: StatItem[] = [
    { label: 'Locations', value: String(statTotal(stats)), accent: '#0891b2' },
    { label: 'Active', value: String(statCount(stats, 'active', 'true')), accent: '#0891b2' },
    { label: 'Inactive', value: String(statCount(stats, 'active', 'false')), accent: '#0891b2' },
    { label: 'Locations', value: String(statTotal(stats)), accent: '#0891b2' },
  ];

  const gridContext: LocationGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Locations"
      subtitle="Offices and work sites"
      entityLabel="location"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <LocationForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={LOCATION_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search locations…"
    />
  );
}
