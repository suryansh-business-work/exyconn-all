import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { WebsiteOverviewPage } from '../../../../src/pages/overview';
import { renderWithProviders } from '../../test-utils';
import { pendingQuery, tableStats } from '../website/content-page-helpers';
import { submissionRow } from '../website/content-fixtures';

interface OverviewProps {
  title: string;
  stats: { label: string; value: string }[];
  statsLoading: boolean;
  breakdowns: { title: string; buckets: { value: string; count: number }[] }[];
  links: { label: string; to: string }[];
  recentTitle: string;
  children: ReactNode;
}

interface TableColumn {
  key: string;
  render?: (row: Record<string, unknown>) => ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  emptyMessage: string;
  loading: boolean;
  onRefresh: () => unknown;
}

const recorded = vi.hoisted(() => ({
  overview: null as unknown,
  table: null as unknown,
  hooks: {} as Record<string, (options?: unknown) => unknown>,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListWebsiteSubmissionsStatsQuery: () => recorded.hooks.submissionStats(),
  useListBlogPostsStatsQuery: () => recorded.hooks.blogStats(),
  useListJobsStatsQuery: () => recorded.hooks.jobStats(),
  useListWebsiteSubmissionsPagedQuery: (options: unknown) => recorded.hooks.submissions(options),
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `at ${value}` }),
}));

vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', () => ({
  ModuleOverview: (props: Readonly<OverviewProps>) => {
    recorded.overview = props;
    return <section aria-label="overview">{props.children}</section>;
  },
}));

/** Renders each row cell by cell, as the shared table does: a column's render, else the value. */
vi.mock('@exyconn/shell/components/data/DataTable', () => ({
  DataTable: (props: Readonly<TableProps>) => {
    recorded.table = props;
    return (
      <table>
        <tbody>
          {props.rows.map((row) => (
            <tr key={String(row.id)}>
              {props.columns.map((column) => (
                <td key={column.key}>{column.render?.(row) ?? String(row[column.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

const overview = () => recorded.overview as OverviewProps;
const table = () => recorded.table as TableProps;
const stat = (label: string) => overview().stats.find((item) => item.label === label)?.value;

const refetch = vi.fn(() => Promise.resolve({}));
const answered = (data: unknown) => ({ data, loading: false, refetch });

const loadedHooks = () => ({
  submissionStats: () =>
    answered({
      listWebsiteSubmissionsStats: tableStats(30, {
        status: { new: 7, resolved: 20 },
        formType: { contact: 18, careers: 12 },
      }),
    }),
  blogStats: () => answered({ listBlogPostsStats: tableStats(14) }),
  jobStats: () => answered({ listJobsStats: tableStats(9, { isActive: { true: 5, false: 4 } }) }),
  submissions: () =>
    answered({ listWebsiteSubmissionsPaged: { totalCount: 1, rows: [submissionRow()] } }),
});

describe('WebsiteOverviewPage', () => {
  beforeEach(() => {
    recorded.hooks = loadedHooks();
  });

  it('counts enquiries, untriaged ones, blog posts and live jobs, and links onwards', () => {
    renderWithProviders(<WebsiteOverviewPage />);

    expect(overview().title).toBe('Website');
    expect(overview().statsLoading).toBe(false);
    expect(stat('Enquiries')).toBe('30');
    expect(stat('Untriaged')).toBe('7');
    expect(stat('Blog posts')).toBe('14');
    expect(stat('Live jobs')).toBe('5');
    expect(overview().links.map((link) => link.to)).toEqual([
      '/website/submissions',
      '/website/blog',
      '/website/jobs',
    ]);
    expect(overview().recentTitle).toBe('Latest enquiries');
  });

  it('breaks the enquiries down by form and by status', () => {
    renderWithProviders(<WebsiteOverviewPage />);

    const [byForm, byStatus] = overview().breakdowns;
    expect(byForm.title).toBe('Enquiries by form');
    expect(byForm.buckets.map((bucket) => bucket.value)).toEqual(['contact', 'careers']);
    expect(byStatus.title).toBe('Enquiries by status');
    expect(byStatus.buckets.map((bucket) => bucket.count)).toEqual([7, 20]);
  });

  it('asks for the eight newest enquiries', () => {
    const submissions = vi.fn(loadedHooks().submissions);
    recorded.hooks.submissions = submissions;
    renderWithProviders(<WebsiteOverviewPage />);

    expect(submissions).toHaveBeenCalledWith({
      variables: { input: { page: 0, pageSize: 8 } },
    });
    expect(table().onRefresh).toBe(refetch);
  });

  it.each(['submissionStats', 'blogStats', 'jobStats'])(
    'marks the tiles loading while %s has not answered',
    (hook) => {
      recorded.hooks = { ...loadedHooks(), [hook]: pendingQuery };
      renderWithProviders(<WebsiteOverviewPage />);

      expect(overview().statsLoading).toBe(true);
    },
  );

  it('shows zeros and empty breakdowns before any stats exist', () => {
    recorded.hooks = {
      ...loadedHooks(),
      submissionStats: pendingQuery,
      blogStats: pendingQuery,
      jobStats: pendingQuery,
    };
    renderWithProviders(<WebsiteOverviewPage />);

    expect(overview().stats.map((item) => item.value)).toEqual(['0', '0', '0', '0']);
    expect(overview().breakdowns.map((breakdown) => breakdown.buckets)).toEqual([[], []]);
  });

  it('lists each enquiry with its status, where it was filed and when it came in', () => {
    recorded.hooks.submissions = () =>
      answered({
        listWebsiteSubmissionsPaged: {
          totalCount: 3,
          rows: [
            submissionRow({ id: 'a', leadId: 'lead-1' }),
            submissionRow({ id: 'b', applicantId: 'app-1', status: 'resolved' }),
            submissionRow({ id: 'c' }),
          ],
        },
      });
    renderWithProviders(<WebsiteOverviewPage />);

    const [lead, applicant, unfiled] = screen.getAllByRole('row').map((row) => within(row));
    expect(lead.getByText('Lead')).toBeInTheDocument();
    expect(applicant.getByText('Applicant')).toBeInTheDocument();
    expect(applicant.getByText('resolved')).toBeInTheDocument();
    expect(unfiled.getByText('—')).toBeInTheDocument();
    expect(unfiled.getByText('at 2026-05-01T10:00:00.000Z')).toBeInTheDocument();
    expect(table().emptyMessage).toBe('No enquiries yet.');
  });

  it('shows an empty, loading list until the enquiries arrive', () => {
    recorded.hooks.submissions = pendingQuery;
    renderWithProviders(<WebsiteOverviewPage />);

    expect(table().rows).toEqual([]);
    expect(table().loading).toBe(true);
  });
});
