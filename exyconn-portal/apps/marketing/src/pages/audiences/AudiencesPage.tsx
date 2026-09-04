import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import {
  useListAudienceListsQuery,
  useListClientsQuery,
  useDeleteAudienceListMutation,
  ListAudienceListsPagedDocument,
  type ListAudienceListsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { AudienceListForm, type AudienceRow } from './forms/audience-list';
import {
  AUDIENCE_COLUMNS,
  type PagedAudienceRow,
  type AudiencesGridContext,
} from './audiences-grid';

/** Marketing → Audiences: the saved client lists a campaign is sent to. */
export function AudiencesPage() {
  // Audiences are few and their sizes come from an array, which no aggregation can sum —
  // so the tiles read the full list rather than a stats query.
  const { data, refetch } = useListAudienceListsQuery();
  const { data: clientsData } = useListClientsQuery();
  const [deleteAudienceList] = useDeleteAudienceListMutation();
  const crud = useCrudResource<AudienceRow, PagedAudienceRow>({
    label: 'Audience',
    onDelete: (row) => deleteAudienceList({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete audience "${row.name}"?`,
    refetch,
  });
  const fetchRows = usePagedFetcher(
    ListAudienceListsPagedDocument,
    (result: ListAudienceListsPagedQuery) => result.listAudienceListsPaged,
  );

  const audiences = data?.listAudienceLists ?? [];
  const reachable = new Set(audiences.flatMap((audience) => audience.clientIds));
  const clientCount = clientsData?.listClients.length ?? 0;
  const statItems: StatItem[] = [
    { label: 'Audiences', value: String(audiences.length), accent: '#ec4899' },
    { label: 'Clients reached', value: String(reachable.size), accent: '#4f8cff' },
    { label: 'Clients total', value: String(clientCount), accent: '#8b5cf6' },
    {
      label: 'Not in any list',
      value: String(Math.max(clientCount - reachable.size, 0)),
      accent: '#f9851f',
    },
  ];

  const gridContext: AudiencesGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Audiences"
      subtitle="Saved client lists a campaign can be sent to"
      entityLabel="audience"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <AudienceListForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={AUDIENCE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search audiences…"
    />
  );
}
