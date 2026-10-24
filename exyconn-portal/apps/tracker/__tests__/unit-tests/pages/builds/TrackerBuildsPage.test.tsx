import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { TrackerBuildsPage } from '../../../../src/pages/builds/TrackerBuildsPage';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { resetRecorded, tabberProps } from '../tracker/tracker.mocks';
import { startBuildRenders } from './builds.stubs';

const state = vi.hoisted(() => ({
  settings: vi.fn(),
  refetchQueries: vi.fn(),
  logError: vi.fn(),
  retention: vi.fn(),
}));

vi.mock('@exyconn/tabber', async () =>
  (await import('../tracker/tracker.mocks')).tabberModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerBuildSettingsQuery: state.settings,
}));
vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useApolloClient: () => ({ refetchQueries: state.refetchQueries }),
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { error: state.logError },
}));
vi.mock('../../../../src/pages/builds/BuildReleasesTab', () => ({
  BuildReleasesTab: () => <p>Published here</p>,
}));
vi.mock('../../../../src/pages/builds/BuildRunsTab', () => ({
  BuildRunsTab: () => <p>Runs here</p>,
}));
vi.mock('../../../../src/pages/builds/forms/build-retention', () => ({
  BuildRetentionForm: ({ keepLatestBuilds }: Readonly<{ keepLatestBuilds: number }>) => {
    state.retention(keepLatestBuilds);
    return <p>Retention form here</p>;
  },
}));
vi.mock('../../../../src/pages/builds/forms/start-build', async () => ({
  StartBuildForm: (await import('./builds.stubs')).StartBuildFormStub,
}));

const SETTINGS = {
  data: {
    trackerBuildSettings: {
      slackChannels: ['C1', 'C2'],
      statusAlertChannels: [],
      keepLatestBuilds: 4,
    },
  },
};

function Page() {
  return (
    <>
      <TrackerBuildsPage />
      <output aria-label="url">{useCurrentUrl()}</output>
    </>
  );
}

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route path="/tracker/builds/:tab?" element={<Page />} />
    </Routes>,
    { route: '/tracker/builds/published' },
  );

describe('TrackerBuildsPage', () => {
  beforeEach(() => {
    resetRecorded();
    startBuildRenders.mockReset();
    state.settings.mockReset().mockReturnValue(SETTINGS);
    state.refetchQueries.mockReset().mockResolvedValue([]);
    state.logError.mockReset();
    state.retention.mockReset();
  });

  it('keeps published builds, runs and settings on their own tabs', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Builds' })).toBeInTheDocument();
    expect(tabberProps().basePath).toBe('/tracker/builds');
    expect(tabberProps().items.map((item) => item.slug)).toEqual(['published', 'runs', 'settings']);
    expect(
      within(screen.getByRole('region', { name: 'Published' })).getByText('Published here'),
    ).toBeInTheDocument();
    expect(screen.getByText('Runs here')).toBeInTheDocument();
    expect(screen.getByText('Retention form here')).toBeInTheDocument();
    expect(state.retention).toHaveBeenCalledWith(4);
  });

  it('keeps no builds back before the settings load', async () => {
    state.settings.mockReturnValue({ data: undefined });
    renderPage();
    expect(state.retention).toHaveBeenLastCalledWith(0);
    await userEvent.click(screen.getByRole('button', { name: 'Create build' }));
    expect(startBuildRenders.mock.lastCall?.[0].channelCount).toBe(0);
  });

  it('opens the build form and comes back on Abandon', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Create build' }));
    expect(screen.getByRole('heading', { name: 'Create tracker build' })).toBeInTheDocument();
    expect(screen.getByText('Announced in 2 channel(s)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Abandon build' }));
    expect(screen.getByRole('heading', { name: 'Builds' })).toBeInTheDocument();
    expect(state.refetchQueries).not.toHaveBeenCalled();
  });

  it('goes back from the form header too', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Create build' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back to Builds' }));
    expect(screen.getByRole('heading', { name: 'Builds' })).toBeInTheDocument();
  });

  it('shows the runs once a build starts, logging a failed refresh', async () => {
    state.refetchQueries.mockRejectedValue(new Error('offline'));
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Create build' }));
    await userEvent.click(screen.getByRole('button', { name: 'Build started' }));
    expect(screen.getByLabelText('url')).toHaveTextContent('/tracker/builds/runs');
    await waitFor(() =>
      expect(state.logError).toHaveBeenCalledWith(
        'Tracker builds: refreshing runs failed',
        expect.any(Error),
      ),
    );
  });
});
