import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListJobsPagedDocument } from '@exyconn/shell/graphql/generated';
import { JobsPage } from '../../../../src/pages/website/JobsPage';
import { JOB_COLUMNS } from '../../../../src/pages/website/jobs-grid';
import { renderInSite } from '../cms/cms-helpers';
import { dashboardProps, paged, statValues } from './content-dashboard-stub';
import { confirmRowDelete, pendingQuery, runRowAction } from './content-page-helpers';
import { jobRow } from './content-fixtures';

const gql = vi.hoisted(() => ({ list: vi.fn(), deleteJob: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListJobsQuery: () => gql.list(),
  useDeleteJobMutation: () => [gql.deleteJob],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('./content-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/website/forms/job', async () => ({
  JobForm: (await import('./content-form-stub')).ContentFormStub,
}));

describe('JobsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.deleteJob.mockResolvedValue({ data: { deleteJob: true } });
    gql.list.mockReturnValue({
      data: {
        listJobs: [
          jobRow({ id: 'a', isFeatured: true }),
          jobRow({ id: 'b', companySlug: '', isActive: false }),
          jobRow({ id: 'c', siteId: '', companySlug: 'acme' }),
          jobRow({ id: 'd', siteId: 'site-2', companySlug: 'other' }),
        ],
      },
      loading: false,
    });
  });

  it('counts the site’s openings, the active and featured ones and the companies hiring', () => {
    renderInSite(<JobsPage />);

    expect(statValues()).toEqual({ Jobs: '3', Active: '2', Featured: '1', Companies: '2' });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the jobs arrive', () => {
    gql.list.mockReturnValue(pendingQuery());
    renderInSite(<JobsPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues().Jobs).toBe('0');
  });

  it('drives the server grid with the paged jobs query, scoped to the site', () => {
    renderInSite(<JobsPage />);
    const page = { totalCount: 1, rows: [jobRow()] };

    expect(paged.document).toBe(ListJobsPagedDocument);
    expect(paged.select?.({ listJobsPaged: page } as never)).toBe(page);
    expect(paged.extraFilters).toEqual([{ field: 'siteId', op: 'EQUALS', value: 'site-1' }]);
    expect(dashboardProps().columnDefs).toBe(JOB_COLUMNS);
    expect(dashboardProps()).toMatchObject({ title: 'Jobs', exportFileName: 'jobs' });
  });

  it('opens the form for a new and an existing job', async () => {
    renderInSite(<JobsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', jobRow({ title: 'Edited job' }));
    expect(screen.getByText(/"title":"Edited job"/)).toBeInTheDocument();
  });

  it('deletes a job after confirming, by its id', async () => {
    renderInSite(<JobsPage />);

    await confirmRowDelete(jobRow({ id: 'job-4' }), 'Delete job Frontend engineer?');

    expect(gql.deleteJob).toHaveBeenCalledWith({ variables: { id: 'job-4' } });
    expect(await screen.findByText('Job deleted')).toBeInTheDocument();
  });
});
