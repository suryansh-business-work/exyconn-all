import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListItIncidentsPagedDocument,
  useDeleteItIncidentMutation,
  useGetItIncidentLazyQuery,
  useListItIncidentsStatsQuery,
  type ListItIncidentsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { IncidentForm, type IncidentRow } from './forms/incident';
import { IncidentTimeline } from './IncidentTimeline';
import {
  INCIDENT_COLUMNS,
  type IncidentsGridContext,
  type PagedIncidentRow,
} from './incidents-grid';

/** IT › Incident Management: outages and breaches, their timeline, RCA and follow-ups. */
export function IncidentsPage() {
  const { formatDate } = useSettings();
  const [viewing, setViewing] = useState<PagedIncidentRow | null>(null);
  const [reload] = useGetItIncidentLazyQuery({ fetchPolicy: 'network-only' });
  const { data: statsData, refetch: refetchStats } = useListItIncidentsStatsQuery();
  const [remove] = useDeleteItIncidentMutation();
  const crud = useCrudResource<IncidentRow, PagedIncidentRow>({
    label: 'Incident',
    onDelete: (row) => remove({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete incident "{title}"?',
      values: { title: row.title },
    }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListItIncidentsPagedDocument,
    (data: ListItIncidentsPagedQuery) => data.listItIncidentsPaged,
  );

  /** After an update the drawer shows the new timeline, and the grid and tiles catch up. */
  const refreshViewing = async () => {
    if (viewing) {
      const { data } = await reload({ variables: { id: viewing.id } });
      setViewing(data?.getItIncident ?? null);
    }
    crud.reload();
  };

  const stats = statsData?.listItIncidentsStats;
  const open =
    statTotal(stats) -
    statCount(stats, 'status', 'RESOLVED') -
    statCount(stats, 'status', 'CLOSED');
  const statItems: StatItem[] = [
    { label: 'Incidents', value: String(statTotal(stats)), accent: color.cyan[600] },
    { label: 'Open', value: String(open), accent: color.red[500] },
    {
      label: 'SEV1',
      value: String(statCount(stats, 'severity', 'SEV1')),
      accent: color.amber[500],
    },
    {
      label: 'Outages',
      value: String(statCount(stats, 'category', 'OUTAGE')),
      accent: color.violet[400],
    },
  ];

  const gridContext: IncidentsGridContext = {
    actions: { timeline: setViewing, edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Incident Management"
      subtitle="Major incidents and outages: timeline, impact, root cause and follow-up actions"
      entityLabel="incident"
      exportFileName="incidents"
      permissionModule="ItIncident"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <IncidentForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={INCIDENT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by title, impact, commander or root cause…"
      onRowClick={setViewing}
      extraDialogs={
        <IncidentTimeline
          incident={viewing}
          onClose={() => setViewing(null)}
          onChanged={() => {
            refreshViewing().catch((error: unknown) =>
              console.error('Could not refresh the incident', error),
            );
          }}
        />
      }
    />
  );
}
