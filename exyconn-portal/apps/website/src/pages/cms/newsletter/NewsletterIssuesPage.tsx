import type { ColDef } from 'ag-grid-community';
import {
  CrudDashboard,
  EDIT_ACTION,
  DELETE_ACTION,
  actionsColumn,
  dateColumn,
  derivedColumn,
  derivedStatusColumn,
  useCrudResource,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  NewsletterIssuesDocument,
  useDeleteNewsletterIssueMutation,
  type NewsletterIssuesQuery,
} from '@exyconn/shell/graphql/generated';
import { NewsletterIssueForm, type NewsletterIssueRow } from '../../website/forms/newsletter-issue';
import { activeStatus } from '../../website/active-status';
import { useCurrentSite, useSitePagedFetcher } from '../site';

const COLUMNS: ColDef<NewsletterIssueRow>[] = [
  derivedColumn('title', 'Title', (row) => row.title),
  derivedColumn('slug', 'Slug', (row) => row.slug),
  derivedStatusColumn<NewsletterIssueRow>('isActive', 'Status', (row) => activeStatus(row)),
  dateColumn('publishedAt', 'Published'),
  actionsColumn([EDIT_ACTION, DELETE_ACTION]),
];
const NO_STATS: StatItem[] = [];

/** Website › Newsletter › Issues: issues published on the current site. */
export function NewsletterIssuesPage() {
  const { site } = useCurrentSite();
  const { formatDate } = useSettings();
  const [deleteIssue] = useDeleteNewsletterIssueMutation();
  const crud = useCrudResource<NewsletterIssueRow>({
    label: 'Newsletter issue',
    onDelete: (row) => deleteIssue({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete the issue {title}?',
      values: { title: row.title },
    }),
  });
  const fetchRows = useSitePagedFetcher(
    NewsletterIssuesDocument,
    (data: NewsletterIssuesQuery) => data.newsletterIssues,
    site.id,
  );
  const context: DatedCrudGridContext<NewsletterIssueRow> = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Newsletter issues"
      subtitle="Issues published on {site}"
      subtitleValues={{ site: site.name }}
      entityLabel="issue"
      actionLabel="New issue"
      stats={NO_STATS}
      crud={crud}
      renderForm={(initial) => (
        <NewsletterIssueForm
          siteId={site.id}
          initial={initial}
          onCancel={crud.close}
          onDone={crud.onDone}
        />
      )}
      columnDefs={COLUMNS}
      fetchRows={fetchRows}
      context={context}
      searchPlaceholder="Search issues…"
      exportFileName="newsletter-issues"
    />
  );
}
