import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMyAttendanceQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { MyAttendancePage } from '../../../../src/pages/employee/MyAttendancePage';

const logger = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: logger }));
vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyAttendanceQuery: vi.fn(),
}));
vi.mock('@exyconn/shell/components/work', async () => {
  const { WorkArrangementStub } = await import('./helpers/stubs');
  return { MyWorkArrangementCard: WorkArrangementStub };
});
vi.mock('../../../../src/pages/employee/attendance-calendar', async () => {
  const { AttendanceCalendarStub } = await import('./helpers/stubs');
  return { AttendanceCalendar: AttendanceCalendarStub };
});
vi.mock('../../../../src/pages/employee/forms/mark-attendance', async () => {
  const { FormStub } = await import('./helpers/stubs');
  return { MarkAttendanceForm: FormStub };
});

const attendance = [
  { id: 'r1', date: '2026-03-02T00:00:00.000Z', status: 'PRESENT', note: 'Client visit' },
  { id: 'r2', date: '2026-03-03T00:00:00.000Z', status: 'WFH', note: null },
];

function renderPage(refetch: () => Promise<unknown> = vi.fn(() => Promise.resolve({}))) {
  vi.mocked(useMyAttendanceQuery).mockReturnValue(
    queryResult({ data: { myAttendance: attendance }, refetch }),
  );
  renderWithProviders(<MyAttendancePage />);
}

beforeEach(() => {
  logger.warn.mockClear();
});

describe('MyAttendancePage', () => {
  it('shows the calendar, the work arrangement and every marked day', () => {
    renderPage();
    expect(screen.getByText('Calendar of 2 days, ready')).toBeInTheDocument();
    expect(screen.getByText('Work arrangement card')).toBeInTheDocument();

    const [, present, wfh] = screen.getAllByRole('row');
    expect(within(present).getByText('on 2026-03-02T00:00:00.000Z')).toBeInTheDocument();
    expect(within(present).getByText('PRESENT')).toBeInTheDocument();
    expect(within(present).getByText('Client visit')).toBeInTheDocument();
    expect(within(wfh).getByText('WFH')).toBeInTheDocument();
    expect(within(wfh).getByText('—')).toBeInTheDocument();
  });

  it('hands the calendar the loading state while the attendance loads', () => {
    vi.mocked(useMyAttendanceQuery).mockReturnValue(queryResult({ loading: true }));
    renderWithProviders(<MyAttendancePage />);
    expect(screen.getByText('Calendar of 0 days, loading')).toBeInTheDocument();
    expect(screen.queryByText('No attendance recorded yet.')).toBeNull();
  });

  it('says so when nothing is recorded', () => {
    vi.mocked(useMyAttendanceQuery).mockReturnValue(queryResult({ data: { myAttendance: [] } }));
    renderWithProviders(<MyAttendancePage />);
    expect(screen.getByText('No attendance recorded yet.')).toBeInTheDocument();
  });

  it('opens the mark-attendance form and closes it by the back link or Cancel', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Mark attendance' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Mark attendance' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to My Attendance' }));
    expect(screen.getByRole('heading', { level: 1, name: 'My Attendance' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark attendance' }));
    await user.click(screen.getByRole('button', { name: 'Stub cancel' }));
    expect(screen.getByRole('heading', { level: 1, name: 'My Attendance' })).toBeInTheDocument();
  });

  it('reloads the attendance once a day is marked', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn(() => Promise.resolve({}));
    renderPage(refetch);

    await user.click(screen.getByRole('button', { name: 'Mark attendance' }));
    await user.click(screen.getByRole('button', { name: 'Stub done' }));

    expect(screen.getByRole('heading', { level: 1, name: 'My Attendance' })).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs a failed reload instead of failing the page', async () => {
    const user = userEvent.setup();
    const failure = new Error('offline');
    renderPage(vi.fn(() => Promise.reject(failure)));

    await user.click(screen.getByRole('button', { name: 'Mark attendance' }));
    await user.click(screen.getByRole('button', { name: 'Stub done' }));

    await waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith('Could not reload attendance', failure),
    );
    expect(screen.getByRole('heading', { level: 1, name: 'My Attendance' })).toBeInTheDocument();
  });
});
