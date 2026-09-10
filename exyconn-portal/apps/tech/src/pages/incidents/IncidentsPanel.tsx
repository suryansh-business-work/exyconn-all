import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  IncidentImpact,
  IncidentSource,
  ListStatusIncidentsPagedDocument,
  useDeleteStatusIncidentMutation,
  useListStatusIncidentsStatsQuery,
  type ListStatusIncidentsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { IncidentForm, type IncidentRow } from './forms/incident';
import { IncidentUpdateForm } from './forms/incident-update';
import { color } from '@exyconn/shell/components/ui';
import {
  INCIDENT_COLUMNS,
  type IncidentsGridContext,
  type PagedIncidentRow,
} from './incidents-grid';

/**
 * Every incident the status page has shown — opened by the probe loop or by a person —
 * with a timeline update posted from the row. There is no edit: an incident's story is
 * told through its updates, never rewritten.
 */
export function IncidentsPanel() {
  const { formatDate } = useSettings();
  const { data: statsData, refetch: refetchStats } = useListStatusIncidentsStatsQuery();
  const [deleteIncident] = useDeleteStatusIncidentMutation();
  const [updating, setUpdating] = useState<PagedIncidentRow | null>(null);

  const crud = useCrudResource<IncidentRow, PagedIncidentRow>({
    label: 'Incident',
    onDelete: (row) => deleteIncident({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete incident "${row.title}" from the public history?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListStatusIncidentsPagedDocument,
    (data: ListStatusIncidentsPagedQuery) => data.listStatusIncidentsPaged,
  );

  const stats = statsData?.listStatusIncidentsStats;
  const statItems: StatItem[] = [
    { label: 'Incidents', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Critical',
      value: String(statCount(stats, 'impact', IncidentImpact.Critical)),
      accent: color.red[200],
    },
    {
      label: 'Major',
      value: String(statCount(stats, 'impact', IncidentImpact.Major)),
      accent: color.orange[500],
    },
    {
      label: 'Posted by hand',
      value: String(statCount(stats, 'source', IncidentSource.Manual)),
      accent: color.violet[400],
    },
  ];

  const gridContext: IncidentsGridContext = {
    actions: { update: setUpdating, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Incidents"
      subtitle="What the public status page reports, and the updates posted on it"
      entityLabel="incident"
      stats={statItems}
      crud={crud}
      renderForm={() => <IncidentForm onCancel={crud.close} onDone={crud.onDone} />}
      columnDefs={INCIDENT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by title or service…"
      extraDialogs={
        <CrudDialog
          open={Boolean(updating)}
          title="Post an update"
          onClose={() => setUpdating(null)}
        >
          {updating && (
            <IncidentUpdateForm
              incident={updating}
              onCancel={() => setUpdating(null)}
              onDone={() => {
                setUpdating(null);
                crud.reload();
              }}
            />
          )}
        </CrudDialog>
      }
    />
  );
}
