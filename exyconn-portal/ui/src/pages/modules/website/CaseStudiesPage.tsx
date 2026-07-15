import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import {
  useListCaseStudiesQuery,
  useDeleteCaseStudyMutation,
  ListCaseStudiesPagedDocument,
  type ListCaseStudiesPagedQuery,
  type ListCaseStudiesPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
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
  const dialog = useCrudDialog<CaseStudyRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listCaseStudies ?? [];
  const categoryCount = new Set(rows.map((r) => r.category).filter(Boolean)).size;
  const stats: StatItem[] = [
    { label: 'Case studies', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Featured', value: String(rows.filter((r) => r.featured).length), accent: '#f9851f' },
    { label: 'Active', value: String(rows.filter((r) => r.isActive).length), accent: '#7be37b' },
    { label: 'Categories', value: String(categoryCount), accent: '#b58cff' },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedCaseStudyRow>> => {
      const result = await client.query<
        ListCaseStudiesPagedQuery,
        ListCaseStudiesPagedQueryVariables
      >({
        query: ListCaseStudiesPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listCaseStudiesPaged.rows,
        totalCount: result.data.listCaseStudiesPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedCaseStudyRow) => {
    const ok = await confirm({ message: `Delete case study ${row.title}?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteCaseStudy({ variables: { id: row.id } });
    reload();
    notify('Case study deleted');
  };

  const gridContext: CaseStudiesGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
    formatDate,
  };

  return (
    <ModuleDashboard
      title="Case studies"
      subtitle="Website case studies"
      actionLabel="New case study"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit case study' : 'New case study'}
          onClose={dialog.close}
        >
          <CaseStudyForm
            initial={dialog.editing}
            onCancel={dialog.close}
            onDone={() => {
              reload();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <ServerDataGrid<PagedCaseStudyRow>
        columnDefs={CASE_STUDY_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search case studies…"
      />
    </ModuleDashboard>
  );
}
