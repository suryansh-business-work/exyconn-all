import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListActivitiesPagedDocument } from '@exyconn/shell/graphql/generated';
import { ActivitiesPage } from '../../../../src/pages/activities';
import { ACTIVITY_COLUMNS } from '../../../../src/pages/activities/activities-grid';
import { renderWithProviders } from '../../test-utils';
import { activityRow, pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), deleteActivity: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListActivitiesStatsQuery: () => gql.stats(),
  useDeleteActivityMutation: () => [gql.deleteActivity],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/activities/forms/activity', async () => ({
  ActivityForm: (await import('../../form-stub')).FormStub,
}));

describe('ActivitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteActivity.mockResolvedValue({ data: { deleteActivity: true } });
    gql.stats.mockReturnValue({
      data: { listActivitiesStats: tableStats(11, { type: { CALL: 4, MEETING: 3, TASK: 2 } }) },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the activities by type from the stats query', () => {
    renderWithProviders(<ActivitiesPage />);

    expect(statLines()).toEqual(['Activities: 11', 'Calls: 4', 'Meetings: 3', 'Tasks: 2']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<ActivitiesPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()).toEqual(['Activities: 0', 'Calls: 0', 'Meetings: 0', 'Tasks: 0']);
  });

  it('drives the server grid with the paged activities query and the activity columns', () => {
    renderWithProviders(<ActivitiesPage />);
    const page = { totalCount: 1, rows: [activityRow()] };

    expect(paged.document).toBe(ListActivitiesPagedDocument);
    expect(paged.select?.({ listActivitiesPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(ACTIVITY_COLUMNS);
    expect(dashboardProps()).toMatchObject({ title: 'Activities', exportFileName: 'activities' });
  });

  it('opens the form blank for a new activity and with the row for an edit', async () => {
    renderWithProviders(<ActivitiesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();

    await runRowAction('edit', activityRow({ subject: 'Pricing review' }));
    expect(screen.getByText(/"subject":"Pricing review"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes an activity after confirming, by its id', async () => {
    renderWithProviders(<ActivitiesPage />);

    await confirmRowDelete(activityRow({ id: 'activity-3' }), 'Delete activity "Kick-off call"?');

    expect(gql.deleteActivity).toHaveBeenCalledWith({ variables: { id: 'activity-3' } });
    expect(await screen.findByText('Activity deleted')).toBeInTheDocument();
  });
});
