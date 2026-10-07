import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobsPage } from '../../../../src/pages/jobs';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({
  jobs: vi.fn(),
  refetch: vi.fn(),
  run: vi.fn(),
  running: false,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useBackgroundJobsQuery: gql.jobs,
  useRunBackgroundJobMutation: () => [gql.run, { loading: gql.running }],
}));
vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({
    formatDateTime: (value: string | null | undefined) => `at ${value ?? ''}`,
  }),
}));

const JOBS = [
  {
    key: 'payslips',
    label: 'Payslip run',
    description: 'Generates payslips on payday',
    lastRunAt: '2026-10-07T06:00:00.000Z',
    lastRunSummary: '12 payslips generated',
  },
  {
    key: 'digest',
    label: 'Daily digest',
    description: 'Emails the morning digest',
    lastRunAt: null,
    lastRunSummary: '',
  },
];

const answer = (overrides: object = {}) => ({
  data: { backgroundJobs: JOBS },
  loading: false,
  error: undefined,
  refetch: gql.refetch,
  ...overrides,
});

const runButtons = () => screen.getAllByRole('button', { name: 'Run now' });

describe('JobsPage', () => {
  beforeEach(() => {
    gql.running = false;
    gql.refetch.mockReset().mockResolvedValue({});
    gql.run.mockReset().mockResolvedValue({ data: {} });
    gql.jobs.mockReset().mockReturnValue(answer());
  });

  it('lists every loop the server runs, read fresh', () => {
    renderWithProviders(<JobsPage />);

    expect(gql.jobs).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('heading', { name: 'Background jobs' })).toBeInTheDocument();
    expect(screen.getByText('Payslip run')).toBeInTheDocument();
    expect(screen.getByText('Daily digest')).toBeInTheDocument();
    expect(screen.getByText('Not since this server started')).toBeInTheDocument();
    expect(runButtons()).toHaveLength(2);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows a progress bar while the first list is on its way', () => {
    gql.jobs.mockReturnValue(answer({ data: undefined, loading: true }));
    renderWithProviders(<JobsPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Run now' })).not.toBeInTheDocument();
  });

  it('keeps the list on screen during a refresh', () => {
    gql.jobs.mockReturnValue(answer({ loading: true }));
    renderWithProviders(<JobsPage />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(runButtons()).toHaveLength(2);
  });

  it('shows why the list could not be read', () => {
    gql.jobs.mockReturnValue(answer({ data: undefined, error: new Error('Not allowed') }));
    const { unmount } = renderWithProviders(<JobsPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Not allowed');
    unmount();

    gql.jobs.mockReturnValue(answer({ data: undefined, error: { reason: 'opaque' } }));
    renderWithProviders(<JobsPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('The job list could not be read.');
  });

  it('re-reads the list on Refresh', async () => {
    renderWithProviders(<JobsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('runs a job now, re-reads the list and says it has taken a pass', async () => {
    renderWithProviders(<JobsPage />);
    await userEvent.click(runButtons()[1]);

    expect(await screen.findByRole('alert')).toHaveTextContent('Daily digest has taken a pass.');
    expect(gql.run).toHaveBeenCalledWith({ variables: { key: 'digest' } });
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('reports the server’s reason when a run is refused', async () => {
    gql.run.mockRejectedValue(new Error('Job is already running'));
    renderWithProviders(<JobsPage />);
    await userEvent.click(runButtons()[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent('Job is already running');
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when a run fails without one', async () => {
    gql.run.mockRejectedValue('offline');
    renderWithProviders(<JobsPage />);
    await userEvent.click(runButtons()[0]);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('That job could not be run.'),
    );
  });

  it('holds every Run now button while one run is in flight', () => {
    gql.running = true;
    renderWithProviders(<JobsPage />);

    for (const button of runButtons()) {
      expect(button).toBeDisabled();
    }
  });
});
