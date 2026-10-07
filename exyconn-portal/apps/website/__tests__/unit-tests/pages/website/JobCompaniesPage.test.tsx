import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListJobCompaniesPagedDocument } from '@exyconn/shell/graphql/generated';
import { JobCompaniesPage } from '../../../../src/pages/website/JobCompaniesPage';
import { JOB_COMPANY_COLUMNS } from '../../../../src/pages/website/job-companies-grid';
import { renderInSite } from '../cms/cms-helpers';
import { dashboardProps, paged, statValues } from './content-dashboard-stub';
import { confirmRowDelete, pendingQuery, runRowAction } from './content-page-helpers';
import { jobCompanyRow } from './content-fixtures';

const gql = vi.hoisted(() => ({ list: vi.fn(), deleteCompany: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListJobCompaniesQuery: () => gql.list(),
  useDeleteJobCompanyMutation: () => [gql.deleteCompany],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('./content-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/website/forms/job-company', async () => ({
  JobCompanyForm: (await import('./content-form-stub')).ContentFormStub,
}));

const benefit = (title: string) => ({ icon: 'star', title, description: '' });

describe('JobCompaniesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.deleteCompany.mockResolvedValue({ data: { deleteJobCompany: true } });
    gql.list.mockReturnValue({
      data: {
        listJobCompanies: [
          jobCompanyRow({ id: 'a', benefits: [benefit('Remote'), benefit('Health')] }),
          jobCompanyRow({ id: 'b', industry: '', isActive: false, benefits: [benefit('Gym')] }),
          jobCompanyRow({ id: 'c', siteId: 'site-2', benefits: [benefit('Lunch')] }),
        ],
      },
      loading: false,
    });
  });

  it('counts the site’s companies, the active ones, their benefits and industries', () => {
    renderInSite(<JobCompaniesPage />);

    expect(statValues()).toEqual({ Companies: '2', Active: '1', Benefits: '3', Industries: '1' });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the companies arrive', () => {
    gql.list.mockReturnValue(pendingQuery());
    renderInSite(<JobCompaniesPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()).toEqual({ Companies: '0', Active: '0', Benefits: '0', Industries: '0' });
  });

  it('drives the server grid with the paged companies query, scoped to the site', () => {
    renderInSite(<JobCompaniesPage />);
    const page = { totalCount: 1, rows: [jobCompanyRow()] };

    expect(paged.document).toBe(ListJobCompaniesPagedDocument);
    expect(paged.select?.({ listJobCompaniesPaged: page } as never)).toBe(page);
    expect(paged.extraFilters).toEqual([{ field: 'siteId', op: 'EQUALS', value: 'site-1' }]);
    expect(dashboardProps().columnDefs).toBe(JOB_COMPANY_COLUMNS);
    expect(dashboardProps()).toMatchObject({
      title: 'Job Companies',
      exportFileName: 'job-companies',
    });
  });

  it('opens the form for a new and an existing company', async () => {
    renderInSite(<JobCompaniesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', jobCompanyRow({ name: 'Edited company' }));
    expect(screen.getByText(/"name":"Edited company"/)).toBeInTheDocument();
  });

  it('deletes a company after confirming, by its id', async () => {
    renderInSite(<JobCompaniesPage />);

    await confirmRowDelete(jobCompanyRow({ id: 'company-4' }), 'Delete company Exyconn?');

    expect(gql.deleteCompany).toHaveBeenCalledWith({ variables: { id: 'company-4' } });
    expect(await screen.findByText('Company deleted')).toBeInTheDocument();
  });
});
