import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterOp, ListApplicantsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ApplicantsPage } from '../../../../src/pages/applicants';
import { APPLICANT_COLUMNS } from '../../../../src/pages/applicants/applicants-grid';
import { renderWithProviders } from '../../test-utils';
import { paged } from '../../harness/crud-dashboard';
import { runRowAction, tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';
import { applicantRow } from './applicant-fixture';

vi.setConfig({ testTimeout: 20_000 });

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListApplicantsStatsQuery: () => gql.stats(),
  useDeleteApplicantMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/applicants/forms/applicant', async () => ({
  ApplicantForm: (await import('../../harness/form-stub')).FormStub,
}));

vi.mock('../../../../src/pages/applicants/forms/applicant-stage', async () => ({
  ApplicantStageForm: (await import('../../harness/form-stub')).FormStub,
}));

const row = applicantRow();
const stats = tableStats(20, {
  stage: { NEW: 6, SCREENING: 5, INTERVIEW: 4, OFFER: 2, HIRED: 1, REJECTED: 2 },
});

describeCrudPage('ApplicantsPage', {
  page: <ApplicantsPage />,
  mocks: gql,
  statsKey: 'listApplicantsStats',
  stats,
  lines: ['Applicants: 20', 'New: 6', 'Screening: 5', 'Interview: 4', 'Offer: 2', 'Hired: 1'],
  emptyLines: ['Applicants: 0', 'New: 0', 'Screening: 0', 'Interview: 0', 'Offer: 0', 'Hired: 0'],
  document: ListApplicantsPagedDocument,
  pageKey: 'listApplicantsPaged',
  columns: APPLICANT_COLUMNS,
  meta: {
    title: 'Applicants',
    exportFileName: 'applicants',
    entityLabel: 'applicant',
    searchPlaceholder: 'Search by name, email or job…',
  },
  row,
  confirm: 'Delete applicant "Asha Rao"?',
  entity: 'Applicant',
});

describe('ApplicantsPage pipeline tools', () => {
  const renderPage = () => {
    gql.refetch.mockReset().mockResolvedValue({});
    gql.stats.mockReturnValue({ data: { listApplicantsStats: stats }, refetch: gql.refetch });
    renderWithProviders(<ApplicantsPage />);
  };

  it('narrows every page request to the stage picked in the quick filter', async () => {
    renderPage();
    expect(paged.extraFilters).toEqual([]);

    await userEvent.click(screen.getByRole('button', { name: 'Screening' }));
    expect(paged.extraFilters).toEqual([
      { field: 'stage', op: FilterOp.Equals, value: 'SCREENING' },
    ]);
    expect(gql.refetch).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(paged.extraFilters).toEqual([]);
    expect(gql.refetch).toHaveBeenCalledTimes(2);
  });

  it('opens the applicant in full from the details action and closes it again', async () => {
    renderPage();

    await runRowAction('details', row);
    expect(screen.getByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('heading', { name: 'Asha Rao' })).not.toBeInTheDocument();
  });

  it('moves an applicant on and reloads the pipeline once the stage form is done', async () => {
    renderPage();

    await runRowAction('advance', row);
    expect(screen.getByRole('heading', { name: 'Advance stage' })).toBeInTheDocument();
    expect(screen.getByText(`Form for ${JSON.stringify(row)}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/^Form for/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('drops the stage form without reloading when it is cancelled or closed', async () => {
    renderPage();

    await runRowAction('advance', row);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText(/^Form for/)).not.toBeInTheDocument();

    await runRowAction('advance', row);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText(/^Form for/)).not.toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });
});
