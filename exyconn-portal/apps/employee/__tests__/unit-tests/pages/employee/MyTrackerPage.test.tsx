import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { skipToken, useQuery } from '@apollo/client/react';
import {
  MyTrackerDayDocument,
  useMyTrackerAccessQuery,
  useMyTrackerCalendarQuery,
  useTrackerProjectOptionsQuery,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { MyTrackerPage } from '../../../../src/pages/employee/MyTrackerPage';

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQuery: vi.fn(),
}));
vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyTrackerAccessQuery: vi.fn(),
  useMyTrackerCalendarQuery: vi.fn(),
  useTrackerProjectOptionsQuery: vi.fn(),
}));
vi.mock('@exyconn/shell/components/work', async () => {
  const { WorkArrangementStub } = await import('./helpers/stubs');
  return { MyWorkArrangementCard: WorkArrangementStub };
});
vi.mock('@exyconn/shell/pages/tracker-view/TrackerView', async () => {
  const { TrackerViewStub } = await import('./helpers/stubs');
  return { TrackerView: TrackerViewStub };
});
vi.mock('../../../../src/pages/employee/MyOffComputerTime', async () => {
  const { OffComputerStub } = await import('./helpers/stubs');
  return { MyOffComputerTime: OffComputerStub };
});

const MARCH = { from: new Date(2026, 2, 1).toISOString(), to: new Date(2026, 3, 1).toISOString() };

function mockQueries({ withData }: Readonly<{ withData: boolean }>) {
  const access = { id: 'ta1', grantedAt: '2026-02-01', isActive: true };
  vi.mocked(useMyTrackerAccessQuery).mockReturnValue(
    queryResult({ data: withData ? { myTrackerAccess: access } : undefined }),
  );
  vi.mocked(useMyTrackerCalendarQuery).mockReturnValue(
    queryResult({
      data: withData
        ? { myTrackerCalendar: [{ date: '2026-03-02' }, { date: '2026-03-03' }] }
        : undefined,
      loading: !withData,
    }),
  );
  vi.mocked(useTrackerProjectOptionsQuery).mockReturnValue(
    queryResult({
      data: withData ? { trackerProjectOptions: [{ id: 'p0', name: 'General' }] } : undefined,
    }),
  );
  vi.mocked(useQuery).mockReturnValue(
    queryResult({ data: withData ? { myTrackerDay: { date: '2026-03-10' } } : undefined }),
  );
}

describe('MyTrackerPage', () => {
  it("shows the month from the URL, the employee's access and the picked day", () => {
    mockQueries({ withData: true });
    renderWithProviders(<MyTrackerPage />, { route: '/me/tracker?month=2026-03&date=2026-03-10' });

    expect(screen.getByRole('heading', { level: 1, name: 'My Tracker' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Tracking enabled since on 2026-02-01.');
    expect(screen.getByText('Work arrangement card')).toBeInTheDocument();
    expect(
      screen.getByText(
        'month March 2026 | 2 buckets | selected 2026-03-10 | label on 2026-03-10 | ' +
          'zone Asia/Kolkata | calendar ready | day ready | day loaded',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('35 day cells')).toBeInTheDocument();
    expect(
      screen.getByText(`Off-computer ${MARCH.from} to ${MARCH.to} for General`),
    ).toBeInTheDocument();
  });

  it("asks for the month in the workspace's zone and for the picked day's 24 hours", () => {
    mockQueries({ withData: true });
    renderWithProviders(<MyTrackerPage />, { route: '/me/tracker?month=2026-03&date=2026-03-10' });

    expect(useMyTrackerCalendarQuery).toHaveBeenLastCalledWith({
      variables: { ...MARCH, timezone: 'Asia/Kolkata' },
    });
    expect(useQuery).toHaveBeenLastCalledWith(MyTrackerDayDocument, {
      variables: {
        start: new Date(2026, 2, 10).toISOString(),
        end: new Date(2026, 2, 11).toISOString(),
      },
    });
  });

  it('skips the day query until a day is picked, then asks for it', async () => {
    const user = userEvent.setup();
    mockQueries({ withData: false });
    renderWithProviders(<MyTrackerPage />, { route: '/me/tracker?month=2026-03' });

    expect(useQuery).toHaveBeenLastCalledWith(MyTrackerDayDocument, skipToken);
    expect(
      screen.getByText(
        'month March 2026 | 0 buckets | selected none | label none | ' +
          'zone Asia/Kolkata | calendar loading | day ready | no day',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No tracker access');
    expect(
      screen.getByText(`Off-computer ${MARCH.from} to ${MARCH.to} for no projects`),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Stub pick day' }));
    expect(screen.getByText(/selected 2026-03-10 \| label on 2026-03-10/)).toBeInTheDocument();
    expect(useQuery).toHaveBeenLastCalledWith(MyTrackerDayDocument, {
      variables: expect.objectContaining({ start: new Date(2026, 2, 10).toISOString() }),
    });
  });

  it('moves between months', async () => {
    const user = userEvent.setup();
    mockQueries({ withData: true });
    renderWithProviders(<MyTrackerPage />, { route: '/me/tracker?month=2026-03' });

    await user.click(screen.getByRole('button', { name: 'Stub next' }));
    expect(screen.getByText(/^month April 2026/)).toBeInTheDocument();
    expect(useMyTrackerCalendarQuery).toHaveBeenLastCalledWith({
      variables: {
        from: new Date(2026, 3, 1).toISOString(),
        to: new Date(2026, 4, 1).toISOString(),
        timezone: 'Asia/Kolkata',
      },
    });

    await user.click(screen.getByRole('button', { name: 'Stub previous' }));
    await user.click(screen.getByRole('button', { name: 'Stub previous' }));
    expect(screen.getByText(/^month February 2026/)).toBeInTheDocument();
  });
});
