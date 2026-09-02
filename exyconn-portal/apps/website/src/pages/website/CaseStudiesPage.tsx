import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListCaseStudiesQuery,
  useDeleteCaseStudyMutation,
  ListCaseStudiesPagedDocument,
  type ListCaseStudiesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { CaseStudyForm, type CaseStudyRow } from './forms/case-study';
import {
  CASE_STUDY_COLUMNS,
  type PagedCaseStudyRow,
  type CaseStudiesGridContext,
} from './case-studies-grid';

/** Website CMS — case studies with a server-side grid. */
export function CaseStudiesPage() {
  // Stat cards still summarise all case studies; the grid itself is server-paged.
  const { data } = useListCaseStudiesQuery();
  const [deleteCaseStudy] = useDeleteCaseStudyMutation();
  const { formatDate } = useSettings();
  const crud = useCrudResource<CaseStudyRow, PagedCaseStudyRow>({
    label: 'Case study',
    onDelete: (row) => deleteCaseStudy({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete case study ${row.title}?`,
  });
  const fetchRows = usePagedFetcher(
    ListCaseStudiesPagedDocument,
    (result: ListCaseStudiesPagedQuery) => result.listCaseStudiesPaged,
  );

  const rows = data?.listCaseStudies ?? [];
  const categoryCount = new Set(rows.map((r) => r.category).filter(Boolean)).size;
  const stats: StatItem[] = [
    { label: 'Case studies', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Featured', value: String(rows.filter((r) => r.featured).length), accent: '#f9851f' },
    { label: 'Active', value: String(rows.filter((r) => r.isActive).length), accent: '#7be37b' },
    { label: 'Categories', value: String(categoryCount), accent: '#b58cff' },
  ];

  const gridContext: CaseStudiesGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Case studies"
      subtitle="Website case studies"
      entityLabel="case study"
      stats={stats}
      crud={crud}
      renderForm={(initial) => (
        <CaseStudyForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={CASE_STUDY_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search case studies…"
    />
  );
}
