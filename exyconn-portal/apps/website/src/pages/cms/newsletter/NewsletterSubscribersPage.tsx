import type { ColDef } from 'ag-grid-community';
import UnsubscribeIcon from '@mui/icons-material/Unsubscribe';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import {
  CrudDashboard,
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
  NewsletterSubscribersDocument,
  NewsletterSubscriberStatus,
  useDeleteNewsletterSubscriberMutation,
  type NewsletterSubscribersQuery,
} from '@exyconn/shell/graphql/generated';
import {
  NewsletterSubscriberForm,
  type NewsletterSubscriberRow,
} from '../../website/forms/newsletter-subscriber';
import { useCurrentSite, useSitePagedFetcher } from '../site';
import { useSubscriberStatus } from './useSubscriberStatus';

const subscribed = (row: NewsletterSubscriberRow) =>
  row.status === NewsletterSubscriberStatus.Subscribed;

const COLUMNS: ColDef<NewsletterSubscriberRow>[] = [
  derivedColumn('email', 'Email', (row) => row.email),
  derivedColumn('name', 'Name', (row) => row.name || '—'),
  derivedStatusColumn('status', 'Status', (row) => row.status),
  derivedColumn('source', 'Source', (row) => row.source || '—'),
  dateColumn('consentAt', 'Agreed on'),
  actionsColumn([
    {
      key: 'unsubscribe',
      label: 'unsubscribe',
      icon: UnsubscribeIcon,
      color: 'warning',
      hidden: (row: NewsletterSubscriberRow) => !subscribed(row),
    },
    {
      key: 'resubscribe',
      label: 'subscribe again',
      icon: MarkEmailReadIcon,
      color: 'success',
      hidden: subscribed,
    },
    DELETE_ACTION,
  ]),
];
const NO_STATS: StatItem[] = [];

/** Website › Newsletter › Subscribers: who signed up on the current site. */
export function NewsletterSubscribersPage() {
  const { site } = useCurrentSite();
  const { formatDate } = useSettings();
  const [deleteSubscriber] = useDeleteNewsletterSubscriberMutation();
  const crud = useCrudResource<NewsletterSubscriberRow>({
    label: 'Subscriber',
    onDelete: (row) => deleteSubscriber({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete {email} from the list? Their consent record goes with it.',
      values: { email: row.email },
    }),
  });
  const setStatus = useSubscriberStatus(crud.reload);
  const fetchRows = useSitePagedFetcher(
    NewsletterSubscribersDocument,
    (data: NewsletterSubscribersQuery) => data.newsletterSubscribers,
    site.id,
  );
  const context: DatedCrudGridContext<NewsletterSubscriberRow> = {
    actions: {
      unsubscribe: (row) => setStatus(row, NewsletterSubscriberStatus.Unsubscribed),
      resubscribe: (row) => setStatus(row, NewsletterSubscriberStatus.Subscribed),
      delete: crud.remove,
    },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Newsletter subscribers"
      subtitle="People who signed up on {site}"
      subtitleValues={{ site: site.name }}
      entityLabel="subscriber"
      actionLabel="Add subscriber"
      stats={NO_STATS}
      crud={crud}
      renderForm={() => (
        <NewsletterSubscriberForm siteId={site.id} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={COLUMNS}
      fetchRows={fetchRows}
      context={context}
      searchPlaceholder="Search by email or name…"
      exportFileName="newsletter-subscribers"
    />
  );
}
