import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LicenceStatus, ListLicencesPagedDocument } from '@exyconn/shell/graphql/generated';
import { LicencesPage } from '../../../../src/pages/licences';
import { LICENCE_COLUMNS } from '../../../../src/pages/licences/licences-grid';
import { renderWithProviders } from '../../test-utils';
import { daysFromNow, licenceRow, pending, tableStats } from '../page-kit/fixtures';
import { dashboardProps, paged } from '../page-kit/crud-dashboard.stub';
import { answerRowConfirm, runRowAction, statLines } from '../page-kit/page-actions';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  list: vi.fn(),
  refetchStats: vi.fn(),
  refetchList: vi.fn(),
  deleteLicence: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListLicencesStatsQuery: () => gql.stats(),
  useListLicencesQuery: () => gql.list(),
  useDeleteLicenceMutation: () => [gql.deleteLicence],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../page-kit/crud-dashboard.stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../page-kit/settings.mock')).settingsModule,
);

vi.mock('../../../../src/pages/licences/forms/licence', async () => ({
  LicenceForm: (await import('../page-kit/form.stub')).FormStub,
}));

const licences = [
  licenceRow({ id: 'l1', assigneeIds: ['a', 'b'], renewalDate: daysFromNow(10) }),
  licenceRow({ id: 'l2', assigneeIds: ['c'], renewalDate: daysFromNow(90) }),
  licenceRow({ id: 'l3', status: LicenceStatus.Cancelled, renewalDate: daysFromNow(5) }),
];

function answer(data: unknown, refetch: () => Promise<unknown>) {
  return { data, loading: false, refetch };
}

describe('LicencesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetchStats.mockResolvedValue({});
    gql.refetchList.mockResolvedValue({});
    gql.deleteLicence.mockResolvedValue({ data: { deleteLicence: true } });
    const stats = tableStats(3, { status: { ACTIVE: 2, CANCELLED: 1 } }, { seatsTotal: 20 });
    gql.stats.mockReturnValue(answer({ listLicencesStats: stats }, gql.refetchStats));
    gql.list.mockReturnValue(answer({ listLicences: licences }, gql.refetchList));
  });

  it('counts licences, active ones, seats in use and renewals coming up', () => {
    renderWithProviders(<LicencesPage />);

    expect(statLines()).toEqual([
      'Licences: 3',
      'Active: 2',
      'Seats used: 3 / 20',
      'Renews in 30d: 1',
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('shows zeros and a loading state until both queries answer', () => {
    gql.stats.mockReturnValue(pending());
    gql.list.mockReturnValue(pending());
    renderWithProviders(<LicencesPage />);

    expect(statLines()).toEqual([
      'Licences: 0',
      'Active: 0',
      'Seats used: 0 / 0',
      'Renews in 30d: 0',
    ]);
    expect(dashboardProps().statsLoading).toBe(true);
  });

  it('stays loading while only the full list is still on its way', () => {
    gql.list.mockReturnValue(pending());
    renderWithProviders(<LicencesPage />);

    expect(dashboardProps().statsLoading).toBe(true);
  });

  it('drives the server grid with the paged licence query and the licence columns', () => {
    renderWithProviders(<LicencesPage />);
    const page = { totalCount: 1, rows: [licenceRow()] };

    expect(paged.document).toBe(ListLicencesPagedDocument);
    expect(paged.select?.({ listLicencesPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Licences',
      entityLabel: 'licence',
      exportFileName: 'licences',
      columnDefs: LICENCE_COLUMNS,
    });
    expect(dashboardProps().context.formatDate?.('2026-10-01')).toBe('date(2026-10-01)');
  });

  it('opens the form blank or with the row, and reloads both queries once it is saved', async () => {
    renderWithProviders(<LicencesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();

    await runRowAction('edit', licenceRow({ name: 'Notion' }));
    expect(screen.getByText(/"name":"Notion"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(screen.queryByText(/Notion/)).not.toBeInTheDocument();
    expect(gql.refetchStats).toHaveBeenCalledTimes(1);
    expect(gql.refetchList).toHaveBeenCalledTimes(1);
  });

  it('deletes a licence by id once the delete is confirmed', async () => {
    renderWithProviders(<LicencesPage />);

    await answerRowConfirm('delete', licenceRow({ id: 'l9' }), 'Delete licence "Figma"?', 'Delete');

    expect(gql.deleteLicence).toHaveBeenCalledWith({ variables: { id: 'l9' } });
    expect(await screen.findByText('Licence deleted')).toBeInTheDocument();
  });

  it('keeps the licence when the delete is cancelled', async () => {
    renderWithProviders(<LicencesPage />);

    await answerRowConfirm('delete', licenceRow(), 'Delete licence "Figma"?', 'Cancel');

    expect(gql.deleteLicence).not.toHaveBeenCalled();
  });
});
