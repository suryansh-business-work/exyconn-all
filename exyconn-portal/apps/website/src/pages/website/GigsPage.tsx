import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListGigsQuery,
  useDeleteGigMutation,
  ListGigsPagedDocument,
  type ListGigsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { GigForm, type GigRow } from './forms/gig';
import { GIG_COLUMNS, type PagedGigRow, type GigsGridContext } from './gigs-grid';

/** Website CMS — freelance gigs published on the public site (server-side grid). */
export function GigsPage() {
  // Stat cards still summarise all gigs; the grid itself is server-paged.
  const { data } = useListGigsQuery();
  const [deleteGig] = useDeleteGigMutation();
  const { formatDate } = useSettings();
  const crud = useCrudResource<GigRow, PagedGigRow>({
    label: 'Gig',
    onDelete: (row) => deleteGig({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete gig ${row.title}?`,
  });
  const fetchRows = usePagedFetcher(
    ListGigsPagedDocument,
    (result: ListGigsPagedQuery) => result.listGigsPaged,
  );

  const rows = data?.listGigs ?? [];
  const categories = new Set(rows.map((r) => r.category));
  const stats: StatItem[] = [
    { label: 'Gigs', value: String(rows.length), accent: '#4f8cff' },
    {
      label: 'Open',
      value: String(rows.filter((r) => r.status === 'open').length),
      accent: '#7be37b',
    },
    {
      label: 'Urgent',
      value: String(rows.filter((r) => r.isUrgent).length),
      accent: '#ff6b6b',
    },
    { label: 'Categories', value: String(categories.size), accent: '#f9851f' },
  ];

  const gridContext: GigsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Gigs"
      subtitle="Freelance gigs on the public site"
      entityLabel="gig"
      stats={stats}
      crud={crud}
      renderForm={(initial) => (
        <GigForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={GIG_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search gigs…"
    />
  );
}
