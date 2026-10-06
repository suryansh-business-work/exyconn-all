import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrudDashboard, useCrudResource } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useDeleteCmsPageMutation } from '@exyconn/shell/graphql/generated';
import { DuplicatePageForm, type DuplicateSource } from '../../website/forms/cms-page-duplicate';
import { useCurrentSite, useSitePath } from '../site';
import { PAGES_COLUMNS, type CmsPageRow, type PagesGridContext } from './pages-grid';
import { PagesToolbar } from './PagesToolbar';
import { PageRevisionsDrawer } from './PageRevisionsDrawer';
import { PageSettingsEditor } from './PageSettingsEditor';
import { useCmsPagesFetcher, type PageFilters } from './useCmsPagesFetcher';
import { usePagePublishing } from './usePagePublishing';
import { usePreviewPage } from './usePreviewPage';

const NO_STATS: StatItem[] = [];

/** Website › Pages: the current site's pages and templates, opened in the page builder. */
export function PagesPage() {
  const navigate = useNavigate();
  const to = useSitePath();
  const { site } = useCurrentSite();
  const { formatDate } = useSettings();
  const [filters, setFilters] = useState<PageFilters>({ status: '', kind: '' });
  const [duplicating, setDuplicating] = useState<DuplicateSource | null>(null);
  const [revisionsOf, setRevisionsOf] = useState<string | null>(null);
  const [deletePage] = useDeleteCmsPageMutation();
  const crud = useCrudResource<CmsPageRow>({
    label: 'Page',
    onDelete: (row) => deletePage({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete the page {path}? Its revisions go with it.',
      values: { path: row.path },
    }),
  });
  const fetchRows = useCmsPagesFetcher(site.id, filters);
  const publishing = usePagePublishing(crud.reload);
  const preview = usePreviewPage();
  const build = (id: string) => navigate(to(`pages/${id}/edit`));

  const context: PagesGridContext = {
    actions: {
      build: (row) => build(row.id),
      settings: crud.openEdit,
      preview: (row) => preview(row.id),
      publish: publishing.publish,
      unpublish: publishing.unpublish,
      duplicate: (row) => setDuplicating(row),
      revisions: (row) => setRevisionsOf(row.id),
      delete: crud.remove,
    },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Pages"
      subtitle="Pages and templates of {site}"
      subtitleValues={{ site: site.name }}
      entityLabel="page"
      actionLabel="New page"
      stats={NO_STATS}
      crud={crud}
      renderForm={(initial) => (
        <PageSettingsEditor
          siteId={site.id}
          pageId={initial?.id ?? null}
          onCancel={crud.close}
          onDone={crud.onDone}
          onCreated={build}
        />
      )}
      columnDefs={PAGES_COLUMNS}
      fetchRows={fetchRows}
      context={context}
      onRowClick={(row) => build(row.id)}
      searchPlaceholder="Search by title or path…"
      toolbar={
        <PagesToolbar
          filters={filters}
          onChange={(next) => {
            setFilters(next);
            crud.reload();
          }}
        />
      }
      extraDialogs={
        <>
          <DuplicatePageForm
            source={duplicating}
            onClose={() => setDuplicating(null)}
            onDone={() => {
              setDuplicating(null);
              crud.reload();
            }}
          />
          <PageRevisionsDrawer
            pageId={revisionsOf}
            onClose={() => setRevisionsOf(null)}
            onRestored={crud.reload}
          />
        </>
      }
    />
  );
}
