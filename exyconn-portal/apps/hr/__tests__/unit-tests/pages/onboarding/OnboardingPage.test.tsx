import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListOnboardingChecklistsPagedDocument } from '@exyconn/shell/graphql/generated';
import { OnboardingPage } from '../../../../src/pages/onboarding';
import { ONBOARDING_COLUMNS } from '../../../../src/pages/onboarding/onboarding-grid';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps, paged } from '../../harness/crud-dashboard';
import { answerRowDelete, runRowAction, statLines, tableStats } from '../../harness/crud-page';
import { checklist } from './onboarding-fixture';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  refetch: vi.fn(),
  remove: vi.fn(),
  setItem: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListOnboardingChecklistsStatsQuery: () => gql.stats(),
  useDeleteOnboardingChecklistMutation: () => [gql.remove],
  useSetOnboardingItemMutation: () => [gql.setItem, { loading: false }],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/onboarding/forms/start-onboarding', async () => ({
  StartOnboardingForm: (await import('../../harness/form-stub')).FormStub,
}));

const ROW = checklist();

describe('OnboardingPage', () => {
  beforeEach(() => {
    gql.refetch.mockReset().mockResolvedValue({});
    gql.remove.mockReset().mockResolvedValue({ data: { deleteOnboardingChecklist: true } });
    gql.setItem.mockReset();
    gql.stats.mockReset().mockReturnValue({
      data: { listOnboardingChecklistsStats: tableStats(7) },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the onboardings and wires the grid to the paged checklist query', () => {
    renderWithProviders(<OnboardingPage />);
    const page = { totalCount: 1, rows: [ROW] };

    expect(statLines()).toEqual(['Onboardings: 7']);
    expect(dashboardProps()).toMatchObject({
      title: 'Onboarding',
      exportFileName: 'onboarding',
      entityLabel: 'onboarding',
      searchPlaceholder: 'Search by employee or template…',
      statsLoading: false,
      columnDefs: ONBOARDING_COLUMNS,
    });
    expect(paged.document).toBe(ListOnboardingChecklistsPagedDocument);
    expect(paged.select?.({ listOnboardingChecklistsPaged: page } as never)).toBe(page);
    expect(dashboardProps().context.formatDate('2026-03-04T12:00:00.000Z')).toBe('04 Mar 2026');
  });

  it('shows the tile loading at zero until the stats first answer', () => {
    gql.stats.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    renderWithProviders(<OnboardingPage />);

    expect(statLines()).toEqual(['Onboardings: 0']);
    expect(dashboardProps().statsLoading).toBe(true);
  });

  it('opens the start form and reloads the stats once it is done', async () => {
    renderWithProviders(<OnboardingPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('closes the start form without reloading when it is cancelled', async () => {
    renderWithProviders(<OnboardingPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('opens the checklist drawer from the details action and closes it again', async () => {
    renderWithProviders(<OnboardingPage />);

    await runRowAction('details', ROW);
    expect(screen.getByRole('heading', { name: 'Asha Rao — onboarding' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Asha Rao — onboarding' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('keeps the drawer open on the ticked checklist and reloads the grid', async () => {
    const updated = checklist({ employeeName: 'Asha R.', progressPercent: 100 });
    gql.setItem.mockResolvedValue({ data: { setOnboardingItem: updated } });
    renderWithProviders(<OnboardingPage />);

    await runRowAction('details', ROW);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sign the policy' }));

    expect(
      await screen.findByRole('heading', { name: 'Asha R. — onboarding' }),
    ).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a checklist after a confirm that names the joiner', async () => {
    renderWithProviders(<OnboardingPage />);

    await answerRowDelete(ROW, "Delete Asha Rao's onboarding checklist?");

    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'checklist-1' } });
    expect(await screen.findByText('Onboarding checklist deleted')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('leaves the checklist alone when the delete is cancelled', async () => {
    renderWithProviders(<OnboardingPage />);

    await answerRowDelete(ROW, "Delete Asha Rao's onboarding checklist?", 'Cancel');

    expect(gql.remove).not.toHaveBeenCalled();
  });
});
