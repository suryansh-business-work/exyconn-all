import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListCompaniesPagedDocument } from '@exyconn/shell/graphql/generated';
import { CompaniesPage } from '../../../../src/pages/companies';
import { COMPANY_COLUMNS } from '../../../../src/pages/companies/companies-grid';
import { renderWithProviders } from '../../test-utils';
import { companyRow, pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  refetch: vi.fn(),
  deleteCompany: vi.fn(),
  promote: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCompaniesStatsQuery: () => gql.stats(),
  useDeleteCompanyMutation: () => [gql.deleteCompany],
  usePromoteCompanyToClientMutation: () => [gql.promote],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/companies/forms/company', async () => ({
  CompanyForm: (await import('../../form-stub')).FormStub,
}));

describe('CompaniesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteCompany.mockResolvedValue({ data: { deleteCompany: true } });
    gql.promote.mockResolvedValue({ data: { promoteCompanyToClient: { id: 'company-1' } } });
    gql.stats.mockReturnValue({
      data: { listCompaniesStats: tableStats(8, { status: { CUSTOMER: 3, PROSPECT: 4 } }) },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the companies by status from the stats query', () => {
    renderWithProviders(<CompaniesPage />);

    expect(statLines()).toEqual(['Companies: 8', 'Customers: 3', 'Prospects: 4', 'Churned: 0']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<CompaniesPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()[0]).toBe('Companies: 0');
  });

  it('drives the server grid with the paged companies query and the company columns', () => {
    renderWithProviders(<CompaniesPage />);
    const page = { totalCount: 1, rows: [companyRow()] };

    expect(paged.document).toBe(ListCompaniesPagedDocument);
    expect(paged.select?.({ listCompaniesPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(COMPANY_COLUMNS);
    expect(dashboardProps()).toMatchObject({ title: 'Companies', exportFileName: 'companies' });
  });

  it('opens the form blank for a new company and with the row for an edit', async () => {
    renderWithProviders(<CompaniesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', companyRow({ name: 'Globex' }));
    expect(screen.getByText(/"name":"Globex"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/Globex/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a company after confirming, by its id', async () => {
    renderWithProviders(<CompaniesPage />);

    await confirmRowDelete(companyRow({ id: 'company-4' }), 'Delete company "Acme"?');

    expect(gql.deleteCompany).toHaveBeenCalledWith({ variables: { id: 'company-4' } });
    expect(await screen.findByText('Company deleted')).toBeInTheDocument();
  });

  it('makes a company a client and reloads the register', async () => {
    renderWithProviders(<CompaniesPage />);

    await runRowAction('makeClient', companyRow({ id: 'company-2', name: 'Initech' }));

    expect(gql.promote).toHaveBeenCalledWith({ variables: { id: 'company-2' } });
    expect(await screen.findByText('"Initech" is now a client')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('says why a company could not be made a client', async () => {
    gql.promote.mockRejectedValueOnce(new Error('Acme is already a client'));
    renderWithProviders(<CompaniesPage />);

    await runRowAction('makeClient', companyRow());

    expect(await screen.findByText('Acme is already a client')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    gql.promote.mockRejectedValueOnce('offline');
    renderWithProviders(<CompaniesPage />);

    await runRowAction('makeClient', companyRow());

    expect(await screen.findByText('Could not make the company a client')).toBeInTheDocument();
  });
});
