import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListBugsPagedDocument } from '@exyconn/shell/graphql/generated';
import { BugsPage } from '../../../../src/pages/bugs';
import { BUG_COLUMNS } from '../../../../src/pages/bugs/bugs-grid';
import { renderWithProviders } from '../../test-utils';
import { bugRow, pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../helpers/crud-dashboard-stub';
import { answerRowConfirm, runRowAction, statLines } from '../../helpers/crud-page-helpers';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  refetch: vi.fn(),
  deleteBug: vi.fn(),
  promote: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListBugsStatsQuery: () => gql.stats(),
  useDeleteBugMutation: () => [gql.deleteBug],
  usePromoteBugToTaskMutation: () => [gql.promote],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../helpers/crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/bugs/forms/bug', async () => ({
  BugForm: (await import('../../helpers/form-stub')).FormStub,
}));

const PROMPT = 'Create a BUG ticket for "Crash on save" on the Website board?';

describe('BugsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteBug.mockResolvedValue({ data: { deleteBug: true } });
    gql.promote.mockResolvedValue({ data: { promoteBugToTask: { key: 'WEB-7' } } });
    gql.stats.mockReturnValue({
      data: {
        listBugsStats: tableStats(9, {
          status: { OPEN: 4, RESOLVED: 2 },
          severity: { CRITICAL: 1 },
        }),
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the bugs by status and severity from the stats query', () => {
    renderWithProviders(<BugsPage />);

    expect(statLines()).toEqual(['Total bugs: 9', 'Open: 4', 'Critical: 1', 'Resolved: 2']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<BugsPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()[0]).toBe('Total bugs: 0');
  });

  it('drives the server grid with the paged bugs query and the bug columns', () => {
    renderWithProviders(<BugsPage />);
    const page = { totalCount: 1, rows: [bugRow()] };

    expect(paged.document).toBe(ListBugsPagedDocument);
    expect(paged.select?.({ listBugsPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(BUG_COLUMNS);
    expect(dashboardProps()).toMatchObject({ title: 'Bugs', exportFileName: 'bugs' });
    expect(typeof dashboardProps().context.formatDate).toBe('function');
  });

  it('opens the form blank for a new bug and with the row for an edit', async () => {
    renderWithProviders(<BugsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();

    await runRowAction('edit', bugRow({ title: 'Broken link' }));
    expect(screen.getByText(/"title":"Broken link"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/Broken link/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a bug after confirming, by its id', async () => {
    renderWithProviders(<BugsPage />);

    await answerRowConfirm(
      'delete',
      bugRow({ id: 'bug-4' }),
      'Delete bug "Crash on save"?',
      'Delete',
    );

    expect(gql.deleteBug).toHaveBeenCalledWith({ variables: { id: 'bug-4' } });
    expect(await screen.findByText('Bug deleted')).toBeInTheDocument();
  });

  it('promotes a bug to a ticket on its board and names the new key', async () => {
    renderWithProviders(<BugsPage />);

    await answerRowConfirm('promote', bugRow({ id: 'bug-2' }), PROMPT, 'Promote');

    expect(gql.promote).toHaveBeenCalledWith({ variables: { id: 'bug-2' } });
    expect(await screen.findByText('Ticket WEB-7 created.')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('names the board generically when the bug has no project name', async () => {
    renderWithProviders(<BugsPage />);

    await answerRowConfirm(
      'promote',
      bugRow({ projectName: '' }),
      'Create a BUG ticket for "Crash on save" on the project board?',
      'Cancel',
    );

    expect(gql.promote).not.toHaveBeenCalled();
  });

  it('reports an empty key when the server answers without one', async () => {
    gql.promote.mockResolvedValueOnce({ data: undefined });
    renderWithProviders(<BugsPage />);

    await answerRowConfirm('promote', bugRow(), PROMPT, 'Promote');

    expect(await screen.findByText('Ticket created.')).toBeInTheDocument();
  });

  it('says why a bug could not be promoted, and does not reload', async () => {
    gql.promote.mockRejectedValueOnce(new Error('Bug has no project'));
    renderWithProviders(<BugsPage />);

    await answerRowConfirm('promote', bugRow(), PROMPT, 'Promote');

    expect(await screen.findByText('Bug has no project')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    gql.promote.mockRejectedValueOnce('offline');
    renderWithProviders(<BugsPage />);

    await answerRowConfirm('promote', bugRow(), PROMPT, 'Promote');

    expect(await screen.findByText('The bug could not be promoted.')).toBeInTheDocument();
  });
});
