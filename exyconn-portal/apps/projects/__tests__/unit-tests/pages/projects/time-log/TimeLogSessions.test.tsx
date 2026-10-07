import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeLogSessions } from '../../../../../src/pages/projects/time-log/TimeLogSessions';
import { renderWithProviders } from '../../../test-utils';
import { sessionFixture, type SessionFixture } from '../projects-fixtures';

const gql = vi.hoisted(() => ({ sessions: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useProjectTimeLogSessionsQuery: (options: unknown) => gql.sessions(options),
}));

vi.mock('../../../../../src/pages/projects/time-log/TimeLogScreenshots', () => ({
  TimeLogScreenshots: ({
    sessionId,
    allowed,
  }: Readonly<{ sessionId: string; allowed: boolean }>) => (
    <p>{`Screenshots of ${sessionId} (${allowed ? 'allowed' : 'hidden'})`}</p>
  ),
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `at ${value.slice(11, 16)}` }),
}));

const PROPS = {
  projectId: 'proj-1',
  from: '2026-10-01T00:00:00.000Z',
  to: '2026-11-01T00:00:00.000Z',
  userId: 'user-1',
  taskId: '',
};

const answer = (sessions: SessionFixture[] | undefined, loading = false) =>
  gql.sessions.mockReturnValue({
    data: sessions ? { projectTimeLogSessions: sessions } : undefined,
    loading,
  });

const run = (startTime: RegExp) => screen.getByRole('button', { name: startTime });

describe('TimeLogSessions', () => {
  beforeEach(() => {
    gql.sessions.mockReset();
  });

  it('says it is loading the runs, asking for this person and ticket only', () => {
    answer(undefined, true);
    renderWithProviders(<TimeLogSessions {...PROPS} canViewScreenshots />);

    expect(screen.getByText('Loading runs…')).toBeInTheDocument();
    expect(gql.sessions).toHaveBeenCalledWith({ variables: PROPS });
  });

  it('explains time with no runs behind it as claimed off-computer', () => {
    answer([]);
    renderWithProviders(<TimeLogSessions {...PROPS} canViewScreenshots />);

    expect(
      screen.getByText('This time was claimed off-computer — there are no tracked runs behind it.'),
    ).toBeInTheDocument();
  });

  it('shows a finished run with no idle time or screenshots as just its start and length', () => {
    answer([sessionFixture()]);
    renderWithProviders(<TimeLogSessions {...PROPS} canViewScreenshots />);

    const summary = within(run(/at 09:00/));
    expect(summary.getByText('1h 0m')).toBeInTheDocument();
    expect(summary.queryByText(/idle/)).not.toBeInTheDocument();
    expect(summary.queryByText('Running')).not.toBeInTheDocument();
    expect(summary.queryByTestId('PhotoCameraIcon')).not.toBeInTheDocument();
  });

  it('marks a running run, its idle time and how many screenshots it took', () => {
    answer([sessionFixture({ endedAt: null, idleMs: 900_000, screenshotCount: 7 })]);
    renderWithProviders(<TimeLogSessions {...PROPS} canViewScreenshots />);

    const summary = within(run(/at 09:00/));
    expect(summary.getByText('15m idle')).toBeInTheDocument();
    expect(summary.getByText('Running')).toBeInTheDocument();
    expect(summary.getByText('7')).toBeInTheDocument();
    expect(summary.getByTestId('PhotoCameraIcon')).toBeInTheDocument();
  });

  it('loads a run screenshots only once it is opened, one run at a time', async () => {
    answer([
      sessionFixture({ id: 'run-1' }),
      sessionFixture({ id: 'run-2', startedAt: '2026-10-03T14:30:00.000Z' }),
    ]);
    renderWithProviders(<TimeLogSessions {...PROPS} canViewScreenshots={false} />);
    expect(screen.queryByText(/Screenshots of/)).not.toBeInTheDocument();

    await userEvent.click(run(/at 09:00/));
    expect(run(/at 09:00/)).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Screenshots of run-1 (hidden)')).toBeInTheDocument();

    await userEvent.click(run(/at 14:30/));
    expect(screen.getByText('Screenshots of run-2 (hidden)')).toBeInTheDocument();
    expect(screen.queryByText('Screenshots of run-1 (hidden)')).not.toBeInTheDocument();

    await userEvent.click(run(/at 14:30/));
    expect(run(/at 14:30/)).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Screenshots of/)).not.toBeInTheDocument();
  });

  it('passes on whether the viewer may see screenshots', async () => {
    answer([sessionFixture()]);
    renderWithProviders(<TimeLogSessions {...PROPS} canViewScreenshots />);

    await userEvent.click(run(/at 09:00/));

    expect(screen.getByText('Screenshots of run-1 (allowed)')).toBeInTheDocument();
  });
});
