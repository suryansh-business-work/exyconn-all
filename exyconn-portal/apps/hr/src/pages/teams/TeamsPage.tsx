import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListTeamsStatsQuery,
  useDeleteTeamMutation,
  ListTeamsPagedDocument,
  type ListTeamsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { TeamForm, type TeamRow } from './forms/team';
import { TEAM_COLUMNS, type PagedTeamRow, type TeamGridContext } from './team-grid';

/** Teams — server-paged admin grid over the team records. */
export function TeamsPage() {
  const { data: statsData, refetch: refetchStats } = useListTeamsStatsQuery();
  const [deleteTeam] = useDeleteTeamMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<TeamRow, PagedTeamRow>({
    label: 'Team',
    onDelete: (row) => deleteTeam({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this team?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListTeamsPagedDocument,
    (data: ListTeamsPagedQuery) => data.listTeamsPaged,
  );

  const stats = statsData?.listTeamsStats;
  const statItems: StatItem[] = [
    { label: 'Teams', value: String(statTotal(stats)), accent: '#7c3aed' },
    { label: 'Active', value: String(statCount(stats, 'active', 'true')), accent: '#7c3aed' },
    { label: 'Inactive', value: String(statCount(stats, 'active', 'false')), accent: '#7c3aed' },
    { label: 'Teams', value: String(statTotal(stats)), accent: '#7c3aed' },
  ];

  const gridContext: TeamGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Teams"
      subtitle="Teams inside each department"
      entityLabel="team"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <TeamForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={TEAM_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search teams…"
    />
  );
}
