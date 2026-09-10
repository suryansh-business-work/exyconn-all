import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import {
  AudienceSegment,
  useListAudienceListsQuery,
  useListClientsQuery,
  useDeleteAudienceListMutation,
  ListAudienceListsPagedDocument,
  type ListAudienceListsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { AudienceListForm, type AudienceRow } from './forms/audience-list';
import { AudienceMembers } from './AudienceMembers';
import { color } from '@exyconn/shell/components/ui';
import {
  AUDIENCE_COLUMNS,
  type PagedAudienceRow,
  type AudiencesGridContext,
} from './audiences-grid';

/** Marketing → Audiences: the saved lists and segment rules a campaign is sent to. */
export function AudiencesPage() {
  // Audiences are few and their sizes come from arrays, which no aggregation can sum —
  // so the tiles read the full list rather than a stats query.
  const { data, refetch } = useListAudienceListsQuery();
  const { data: clientsData } = useListClientsQuery();
  const [deleteAudienceList] = useDeleteAudienceListMutation();
  const [membersTarget, setMembersTarget] = useState<PagedAudienceRow | null>(null);
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
  const segmented = audiences.filter(
    (audience) => audience.dynamicSegment !== AudienceSegment.None,
  ).length;
  const namedContacts = new Set(audiences.flatMap((audience) => audience.contactIds));
  const statItems: StatItem[] = [
    { label: 'Audiences', value: String(audiences.length), accent: color.pink[400] },
    { label: 'Clients named', value: String(reachable.size), accent: color.blue[400] },
    { label: 'Contacts named', value: String(namedContacts.size), accent: color.violet[400] },
    { label: 'With a segment rule', value: String(segmented), accent: color.orange[500] },
  ];

  const gridContext: AudiencesGridContext = {
    actions: { members: setMembersTarget, edit: crud.openEdit, delete: crud.remove },
  };
  const closeMembers = () => setMembersTarget(null);

  const clientCount = clientsData?.listClients.length ?? 0;

  return (
    <CrudDashboard
      title="Audiences"
      subtitle={`Who a campaign goes to — ${String(clientCount)} client(s) available`}
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
      extraDialogs={
        <CrudDialog open={Boolean(membersTarget)} title="Members" onClose={closeMembers}>
          {membersTarget && (
            <AudienceMembers audienceId={membersTarget.id} audienceName={membersTarget.name} />
          )}
        </CrudDialog>
      }
    />
  );
}
