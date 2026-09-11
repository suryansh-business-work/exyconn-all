import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListBlogPostsStatsQuery,
  useListJobsStatsQuery,
  useListWebsiteSubmissionsPagedQuery,
  useListWebsiteSubmissionsStatsQuery,
  type ListWebsiteSubmissionsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/shell/components/ui';

/** How many of the newest enquiries the overview lists before sending you to the inbox. */
const RECENT_SUBMISSIONS = 8;

/** An enquiry nobody has picked up yet. Mirrors the server's default submission status. */
const UNTRIAGED = 'new';

type SubmissionRow =
  ListWebsiteSubmissionsPagedQuery['listWebsiteSubmissionsPaged']['rows'][number];

/** Where the enquiry went: to sales as a lead, to HR as an applicant, or nowhere yet. */
function filedAs(row: SubmissionRow): string {
  if (row.leadId) {
    return 'Lead';
  }
  return row.applicantId ? 'Applicant' : '—';
}

/** Website → Overview: what exyconn.com is publishing, and who it brought in. */
export function WebsiteOverviewPage() {
  const { data: submissionStatsData } = useListWebsiteSubmissionsStatsQuery();
  const { data: blogStatsData } = useListBlogPostsStatsQuery();
  const { data: jobStatsData } = useListJobsStatsQuery();
  const {
    data: submissionsData,
    loading,
    refetch,
  } = useListWebsiteSubmissionsPagedQuery({
    // No sort: the inbox's own default is newest-first, which is what an overview wants.
    variables: { input: { page: 1, pageSize: RECENT_SUBMISSIONS } },
  });
  const { formatDateTime } = useSettings();

  const submissionStats = submissionStatsData?.listWebsiteSubmissionsStats;
  const blogStats = blogStatsData?.listBlogPostsStats;
  const jobStats = jobStatsData?.listJobsStats;
  const submissions = submissionsData?.listWebsiteSubmissionsPaged.rows ?? [];

  const statItems: StatItem[] = [
    { label: 'Enquiries', value: String(statTotal(submissionStats)), accent: color.blue[400] },
    {
      label: 'Untriaged',
      value: String(statCount(submissionStats, 'status', UNTRIAGED)),
      accent: color.amber[500],
    },
    { label: 'Blog posts', value: String(statTotal(blogStats)), accent: color.violet[400] },
    {
      // The aggregation groups on a boolean, so the bucket is the string "true".
      label: 'Live jobs',
      value: String(statCount(jobStats, 'isActive', 'true')),
      accent: color.green[500],
    },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'Enquiries by form',
      buckets: submissionStats?.counts.find((c) => c.field === 'formType')?.buckets ?? [],
      accent: color.blue[400],
    },
    {
      title: 'Enquiries by status',
      buckets: submissionStats?.counts.find((c) => c.field === 'status')?.buckets ?? [],
      accent: color.amber[500],
    },
  ];

  const columns: Column<SubmissionRow>[] = [
    { key: 'formType', label: 'Form' },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'filedAs', label: 'Filed as', render: filedAs },
    { key: 'createdAt', label: 'Received', render: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <ModuleOverview
      title="Website"
      subtitle="What exyconn.com publishes, and who it brings in"
      stats={statItems}
      breakdowns={breakdowns}
      links={[
        { label: 'Open enquiry inbox', to: '/website/submissions' },
        { label: 'Open blog', to: '/website/blog' },
        { label: 'Open jobs', to: '/website/jobs' },
      ]}
      recentTitle="Latest enquiries"
    >
      <DataTable
        columns={columns}
        rows={submissions}
        emptyMessage="No enquiries yet."
        loading={loading}
        onRefresh={refetch}
      />
    </ModuleOverview>
  );
}
