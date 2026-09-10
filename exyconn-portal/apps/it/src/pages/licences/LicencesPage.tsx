import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListLicencesQuery,
  useListLicencesStatsQuery,
  useDeleteLicenceMutation,
  ListLicencesPagedDocument,
  type ListLicencesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { LicenceForm, type LicenceRow } from './forms/licence';
import { renewalsDueWithin, seatsInUse } from './licences.summary';
import { RENEWAL_WINDOW_DAYS } from './licences.constants';
import { LICENCE_COLUMNS, type PagedLicenceRow, type LicencesGridContext } from './licences-grid';
import { color } from '@exyconn/shell/components/ui';

/** IT module — the software licences the company pays for, their seats and renewals. */
export function LicencesPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListLicencesStatsQuery();
  // Seats used and renewals due are per-row questions no aggregation answers, so the
  // (small) full list backs those two tiles.
  const { data: listData, refetch: refetchList } = useListLicencesQuery();
  const [deleteLicence] = useDeleteLicenceMutation();
  const { formatDate } = useSettings();
  const crud = useCrudResource<LicenceRow, PagedLicenceRow>({
    label: 'Licence',
    onDelete: (row) => deleteLicence({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete licence "${row.name}"?`,
    refetch: () => Promise.all([refetchStats(), refetchList()]),
  });
  const fetchRows = usePagedFetcher(
    ListLicencesPagedDocument,
    (data: ListLicencesPagedQuery) => data.listLicencesPaged,
  );

  const stats = statsData?.listLicencesStats;
  const licences = listData?.listLicences ?? [];
  const statItems: StatItem[] = [
    { label: 'Licences', value: String(statTotal(stats)), accent: color.cyan[600] },
    {
      label: 'Active',
      value: String(statCount(stats, 'status', 'ACTIVE')),
      accent: color.green[300],
    },
    {
      label: 'Seats used',
      value: `${seatsInUse(licences)} / ${statSum(stats, 'seatsTotal')}`,
      accent: color.blue[400],
    },
    {
      label: `Renews in ${RENEWAL_WINDOW_DAYS}d`,
      value: String(renewalsDueWithin(licences, RENEWAL_WINDOW_DAYS).length),
      accent: color.orange[500],
    },
  ];

  const gridContext: LicencesGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Licences"
      subtitle="Software the company subscribes to, and who holds a seat"
      entityLabel="licence"
      exportFileName="licences"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <LicenceForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={LICENCE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by licence, vendor or note…"
    />
  );
}
