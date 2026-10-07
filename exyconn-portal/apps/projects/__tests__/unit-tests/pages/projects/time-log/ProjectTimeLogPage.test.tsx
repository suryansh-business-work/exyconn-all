import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectTimeLogPage } from '../../../../../src/pages/projects/time-log';
import { renderWithProviders } from '../../../test-utils';
import { timeLogRow } from '../projects-fixtures';

const m = vi.hoisted(() => ({
  log: vi.fn(),
  refetch: vi.fn(),
  prev: vi.fn(),
  next: vi.fn(),
  range: { from: '2026-10-01T00:00:00.000Z', to: '2026-11-01T00:00:00.000Z' },
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useProjectTimeLogQuery: (options: unknown) => m.log(options),
}));

vi.mock('@exyconn/shell/pages/tracker-view/useTrackerMonth', () => ({
  useTrackerMonth: () => ({
    monthLabel: 'October 2026',
    prev: m.prev,
    next: m.next,
    range: m.range,
  }),
}));

vi.mock('../../../../../src/pages/projects/time-log/TimeLogSessions', () => ({
  TimeLogSessions: (props: Readonly<Record<string, unknown>>) => (
    <p>{`Runs ${JSON.stringify(props)}`}</p>
  ),
}));

vi.mock('../../../../../src/pages/projects/time-log/TimeLogBilling', () => ({
  TimeLogBilling: ({ budgetAmount }: Readonly<{ budgetAmount: number | null }>) => (
    <p>{`Billing against ${budgetAmount ?? 'no budget'}`}</p>
  ),
}));

const ROWS = [
  timeLogRow(),
  timeLogRow({
    id: 'row-2',
    userId: 'user-2',
    userName: 'Asha',
    taskId: '',
    taskKey: '',
    taskTitle: '',
  }),
];

function answer(log: Record<string, unknown> | undefined, loading = false) {
  m.log.mockReturnValue({
    data: log ? { projectTimeLog: log } : undefined,
    loading,
    refetch: m.refetch,
  });
}

const LOG = {
  totalActiveMs: 7_200_000,
  totalManualMs: 1_800_000,
  canViewScreenshots: true,
  rows: ROWS,
};

const renderPage = (budgetHours: number | null = 10, projectId = 'proj-1') =>
  renderWithProviders(
    <ProjectTimeLogPage projectId={projectId} budgetHours={budgetHours} budgetAmount={5000} />,
  );

describe('ProjectTimeLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.refetch.mockResolvedValue({});
    answer(LOG);
  });

  it('asks for the month the navigator shows, and moves it back and forth', async () => {
    renderPage();

    expect(screen.getByText('October 2026')).toBeInTheDocument();
    expect(m.log).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1', ...m.range },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Prev' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(m.prev).toHaveBeenCalledTimes(1);
    expect(m.next).toHaveBeenCalledTimes(1);
  });

  it('totals tracked and off-computer time apart, against budget hours and money', () => {
    renderPage();

    expect(screen.getByText('Tracked 2h 0m')).toBeInTheDocument();
    expect(screen.getByText('Off-computer 30m')).toBeInTheDocument();
    expect(screen.getByText('Tracked 2.5 h of budget 10 h')).toBeInTheDocument();
    expect(screen.getByText('Billing against 5000')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Priya')).toBeInTheDocument();
    expect(screen.getByText('Asha')).toBeInTheDocument();
  });

  it('leaves out the off-computer total when there is none, and the bar with no budget', () => {
    answer({ ...LOG, totalManualMs: 0 });
    renderPage(null);

    expect(screen.queryByText(/^Off-computer/)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: 'Budget used' })).not.toBeInTheDocument();
  });

  it('tells a viewer without the tracker role why screenshots are missing', () => {
    answer({ ...LOG, canViewScreenshots: false });
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent(/Screenshots stay with the Tracker role/);
  });

  it('shows only the empty table before the month has loaded, skipping it without a project', () => {
    answer(undefined);
    renderPage(10, '');

    expect(screen.getByText('No tracked time on this project for this month.')).toBeInTheDocument();
    expect(screen.queryByText(/^Tracked/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Billing/)).not.toBeInTheDocument();
    expect(m.log).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it('opens the runs behind a row and closes them on a second click', async () => {
    renderPage();

    await userEvent.click(screen.getByText('Priya'));
    expect(screen.getByText('Priya · WEB-1')).toBeInTheDocument();
    expect(
      screen.getByText(
        `Runs ${JSON.stringify({ projectId: 'proj-1', ...m.range, userId: 'user-1', taskId: 'task-1', canViewScreenshots: true })}`,
      ),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByText('Priya'));
    expect(screen.queryByText(/^Runs/)).not.toBeInTheDocument();
  });

  it('switches straight to another row, naming time booked to no ticket', async () => {
    renderPage();

    await userEvent.click(screen.getByText('Priya'));
    await userEvent.click(screen.getByText('Asha'));

    expect(screen.getByText('Asha · No ticket')).toBeInTheDocument();
    expect(screen.getByText(/^Runs .*"userId":"user-2","taskId":""/)).toBeInTheDocument();
  });

  it('withholds screenshots from an open row once the month data is gone', async () => {
    const { rerender } = renderPage();
    await userEvent.click(screen.getByText('Priya'));

    answer(undefined, true);
    rerender(<ProjectTimeLogPage projectId="proj-1" budgetHours={10} budgetAmount={5000} />);

    expect(screen.getByText(/^Runs .*"canViewScreenshots":false/)).toBeInTheDocument();
  });
});
