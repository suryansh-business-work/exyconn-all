import { DEFAULT_FORMAT_SETTINGS, formatDateTime } from '@exyconn/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuildRunsTab } from '../../../../src/pages/builds/BuildRunsTab';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ builds: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListTrackerBuildsQuery: gql.builds,
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

function answer(builds: Record<string, unknown>) {
  gql.builds.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch, ...builds });
}

describe('BuildRunsTab', () => {
  beforeEach(() => {
    gql.builds.mockReset();
    gql.refetch.mockReset().mockResolvedValue({});
  });

  it('lists the recent runs with their outcome and a link to each', () => {
    answer({ data: { listTrackerBuilds: RUNS } });
    renderWithProviders(<BuildRunsTab />);
    expect(gql.builds).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(
      screen.getByText('The most recent runs of the tracker build workflow.'),
    ).toBeInTheDocument();
    const staging = screen.getByText('staging').closest('tr') as HTMLElement;
    expect(within(staging).getByText('IN PROGRESS')).toBeInTheDocument();
    expect(
      within(staging).getByText(formatDateTime(STARTED, DEFAULT_FORMAT_SETTINGS)),
    ).toBeInTheDocument();
    const link = within(staging).getByRole('link', { name: 'Open on GitHub' });
    expect(link).toHaveAttribute('href', 'https://github.example/runs/2');
    expect(link).toHaveAttribute('target', '_blank');
    const main = screen.getByText('main').closest('tr') as HTMLElement;
    expect(within(main).getByText('SUCCESS')).toBeInTheDocument();
  });

  it('says when no build has run yet', () => {
    answer({ data: { listTrackerBuilds: [] } });
    renderWithProviders(<BuildRunsTab />);
    expect(screen.getByText('No builds yet.')).toBeInTheDocument();
  });

  it('holds placeholder rows while the runs load', () => {
    answer({ loading: true });
    const { container } = renderWithProviders(<BuildRunsTab />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh table' })).toBeDisabled();
  });

  it('shows why the runs could not be listed', () => {
    answer({ error: new Error('GitHub token expired'), data: { listTrackerBuilds: [] } });
    renderWithProviders(<BuildRunsTab />);
    expect(screen.getByText('GitHub token expired')).toBeInTheDocument();
    expect(
      screen.queryByText('The most recent runs of the tracker build workflow.'),
    ).not.toBeInTheDocument();
  });

  it('re-reads the runs on Refresh', async () => {
    answer({ data: { listTrackerBuilds: RUNS } });
    renderWithProviders(<BuildRunsTab />);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
