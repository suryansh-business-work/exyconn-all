import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerBuildPage } from '../../../../src/pages/tracker-build';
import { renderWithProviders } from '../../test-utils';
import { startBuildRenders } from './tracker-build.stubs';

const gql = vi.hoisted(() => ({ builds: vi.fn(), settings: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListTrackerBuildsQuery: gql.builds,
  useTrackerBuildSettingsQuery: gql.settings,
}));
vi.mock('../../../../src/pages/tracker-build/forms/start-build', async () => ({
  StartBuildForm: (await import('./tracker-build.stubs')).StartBuildFormStub,
}));

const STARTED = '2026-10-04T08:00:00.000Z';
const RUNS = [
  {
    id: 'r2',
    status: 'in_progress',
    conclusion: null,
    branch: 'staging',
    url: 'https://github.example/runs/2',
    startedAt: STARTED,
  },
  {
    id: 'r1',
    status: 'completed',
    conclusion: 'success',
    branch: 'main',
    url: 'https://github.example/runs/1',
    startedAt: STARTED,
  },
];

function answer(builds: Record<string, unknown>, settings: Record<string, unknown> = {}) {
  gql.builds.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch, ...builds });
  gql.settings.mockReturnValue({ data: undefined, loading: false, ...settings });
}

const SETTINGS = {
  data: { trackerBuildSettings: { slackChannels: ['C1', 'C2'], statusAlertChannels: [] } },
};

describe('TrackerBuildPage', () => {
  beforeEach(() => {
    gql.builds.mockReset();
    gql.settings.mockReset();
    gql.refetch.mockReset().mockResolvedValue({});
    startBuildRenders.mockReset();
  });

  it('lists the recent runs with their outcome and a link to each', () => {
    answer({ data: { listTrackerBuilds: RUNS } });
    renderWithProviders(<TrackerBuildPage />);
    expect(gql.builds).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(
      screen.getByText('The most recent runs of the tracker build workflow.'),
    ).toBeInTheDocument();
    const staging = screen.getByText('staging').closest('tr') as HTMLElement;
    expect(within(staging).getByText('IN PROGRESS')).toBeInTheDocument();
    expect(within(staging).getByText(new Date(STARTED).toLocaleString())).toBeInTheDocument();
    const link = within(staging).getByRole('link', { name: 'Open on GitHub' });
    expect(link).toHaveAttribute('href', 'https://github.example/runs/2');
    expect(link).toHaveAttribute('target', '_blank');
    const main = screen.getByText('main').closest('tr') as HTMLElement;
    expect(within(main).getByText('SUCCESS')).toBeInTheDocument();
  });

  it('says when no build has run yet', () => {
    answer({ data: { listTrackerBuilds: [] } });
    renderWithProviders(<TrackerBuildPage />);
    expect(screen.getByText('No builds yet.')).toBeInTheDocument();
  });

  it('holds placeholder rows while the runs load', () => {
    answer({ loading: true });
    const { container } = renderWithProviders(<TrackerBuildPage />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh table' })).toBeDisabled();
  });

  it('shows why the runs could not be listed', () => {
    answer({ error: new Error('GitHub token expired'), data: { listTrackerBuilds: [] } });
    renderWithProviders(<TrackerBuildPage />);
    expect(screen.getByText('GitHub token expired')).toBeInTheDocument();
    expect(
      screen.queryByText('The most recent runs of the tracker build workflow.'),
    ).not.toBeInTheDocument();
  });

  it('re-reads the runs on Refresh', async () => {
    answer({ data: { listTrackerBuilds: RUNS } });
    renderWithProviders(<TrackerBuildPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('opens the build form with the number of channels it will post to', async () => {
    answer({ data: { listTrackerBuilds: RUNS } }, SETTINGS);
    renderWithProviders(<TrackerBuildPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Create build' }));
    expect(screen.getByRole('heading', { name: 'Create tracker build' })).toBeInTheDocument();
    expect(screen.getByText('Announced in 2 channel(s)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back to Tracker Build' }));
    expect(screen.getByRole('heading', { name: 'Tracker Build' })).toBeInTheDocument();
  });

  it('counts no channels before the settings load', async () => {
    answer({ data: { listTrackerBuilds: [] } });
    renderWithProviders(<TrackerBuildPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Create build' }));
    expect(startBuildRenders.mock.lastCall?.[0].channelCount).toBe(0);
    await userEvent.click(screen.getByRole('button', { name: 'Abandon build' }));
    expect(screen.getByRole('button', { name: 'Create build' })).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('returns to the list and re-reads it once a build starts', async () => {
    gql.refetch.mockRejectedValue(new Error('offline'));
    answer({ data: { listTrackerBuilds: RUNS } }, SETTINGS);
    renderWithProviders(<TrackerBuildPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Create build' }));
    await userEvent.click(screen.getByRole('button', { name: 'Build started' }));
    expect(screen.getByRole('heading', { name: 'Tracker Build' })).toBeInTheDocument();
    await waitFor(() => expect(gql.refetch).toHaveBeenCalledTimes(1));
  });
});
