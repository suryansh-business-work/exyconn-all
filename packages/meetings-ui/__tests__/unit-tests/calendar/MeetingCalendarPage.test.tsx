import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaCalendarGoogleState,
  MaScope,
  useMaCalendarQuery,
  useMaStartGoogleConnectMutation,
} from '@exyconn/shell/graphql/generated';
import { MeetingCalendarPage } from '../../../src/calendar/MeetingCalendarPage';
import { mutationTuple, queryResult, renderWithProviders, stubLocationAssign } from '../test-utils';
import { calendarData, calendarEvent, calendarMeeting } from './calendar-fixtures';

const phone = vi.hoisted(() => ({ on: false }));

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaCalendarQuery: vi.fn(),
  useMaStartGoogleConnectMutation: vi.fn(),
}));

vi.mock('@exyconn/shell/components/ui', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/components/ui')>()),
  useMediaQuery: () => phone.on,
}));

const BASE = '/ai/meeting-assistant';
const location = () => screen.getByRole('status', { name: 'location', hidden: true });
const connectRun = vi.fn();

function show(data: ReturnType<typeof calendarData> | undefined, extras = {}) {
  const result = queryResult(data, extras);
  vi.mocked(useMaCalendarQuery).mockReturnValue(result as never);
  return result;
}

const renderPage = (month = '2026-10') =>
  renderWithProviders(<MeetingCalendarPage scope="ALL" basePath={BASE} />, {
    route: `${BASE}/calendar?month=${month}`,
  });

beforeEach(() => {
  // Only the clock is faked: "today" is 14 October 2026, a day with a meeting on it.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-14T12:00:00.000Z'));
  phone.on = false;
  connectRun.mockReset();
  vi.mocked(useMaStartGoogleConnectMutation).mockReturnValue(mutationTuple(connectRun) as never);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('MeetingCalendarPage', () => {
  it("asks for the address's month, for the screen's scope", () => {
    show(calendarData());
    renderPage('2026-02');
    expect(vi.mocked(useMaCalendarQuery)).toHaveBeenLastCalledWith({
      variables: {
        from: '2026-01-31T00:00:00.000Z',
        to: '2026-03-02T00:00:00.000Z',
        scope: MaScope.All,
      },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByRole('heading', { name: 'February 2026' })).toBeInTheDocument();
  });

  it('shows a skeleton while the month loads', () => {
    show(undefined, { loading: true });
    renderPage();
    expect(screen.getByText('Loading calendar')).toBeInTheDocument();
    expect(screen.queryByText('No meetings this month')).toBeNull();
  });

  it('opens a recorded meeting on its page and an unrecorded event in a dialog', async () => {
    show(calendarData());
    renderPage();

    await userEvent.click(
      screen.getByRole('button', { name: 'Google Calendar: 09:00 AM Design review' }),
    );
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Design review' })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await userEvent.click(
      screen.getByRole('button', { name: 'Recorded meeting: 10:00 AM Weekly sync' }),
    );

    expect(location()).toHaveTextContent(`${BASE}/meetings/m1`);
  });

  it('keeps the month in the address as it moves back, forward and to today', async () => {
    show(calendarData());
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(location()).toHaveTextContent('?month=2026-09');
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(location()).toHaveTextContent('?month=2026-11');
    await userEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(location()).toHaveTextContent('?month=2026-10');
  });

  it('says when the month has nothing on it, ignoring the days around it', () => {
    const outside = calendarMeeting({ startedAt: '2026-09-30T10:00:00.000Z' });
    show(calendarData({ meetings: [outside], events: [] }));
    renderPage();
    expect(screen.getByText('No meetings this month')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Weekly sync/ })).toBeNull();
  });

  it('shows the failure with a way to ask again', async () => {
    const result = show(undefined, { error: new Error('Network down') });
    renderPage();
    expect(screen.getByText('Network down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(result.refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps three entries a day in the grid, the rest behind "+N more"', async () => {
    const meetings = ['a', 'b', 'c', 'd'].map((id) => calendarMeeting({ id, title: `Call ${id}` }));
    show(
      calendarData({
        meetings,
        events: [calendarEvent({ allDay: true, startsAt: '2026-10-16T00:00:00.000Z' })],
      }),
    );
    renderPage();

    expect(screen.queryByRole('button', { name: /Call d/ })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Google Calendar: All day Design review' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '+1 more' }));
    expect(screen.getByRole('button', { name: /Call d/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show fewer' }));
    expect(screen.queryByRole('button', { name: /Call d/ })).toBeNull();
  });

  it('lists the busy days as an agenda on a phone', () => {
    phone.on = true;
    show(calendarData());
    renderPage();
    const agenda = screen.getByRole('list');
    expect(
      within(agenda)
        .getAllByRole('listitem')
        .map((item) => item.firstChild?.textContent),
    ).toEqual(['14 Oct 2026', '15 Oct 2026']);
  });
});

describe('MeetingCalendarPage Google notice', () => {
  it('says Google is not configured, without an action', () => {
    show(calendarData({ google: MaCalendarGoogleState.NotConfigured, events: [] }));
    renderPage();
    expect(
      screen.getByText('Google Meet is not configured for this company yet.'),
    ).toBeInTheDocument();
  });

  it('connects Google Meet from the calendar', async () => {
    const assign = stubLocationAssign();
    connectRun.mockResolvedValue({
      data: { maStartGoogleConnect: 'https://accounts.google.com/o' },
    });
    show(calendarData({ google: MaCalendarGoogleState.NotConnected, events: [] }));
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Connect Google Meet' }));

    expect(connectRun).toHaveBeenCalledWith({
      variables: { returnTo: 'http://localhost/current' },
    });
    expect(assign).toHaveBeenCalledWith('https://accounts.google.com/o');
  });

  it('asks an older connection to reconnect, and tells when sign-in could not start', async () => {
    connectRun.mockRejectedValue(new Error('No client'));
    show(calendarData({ google: MaCalendarGoogleState.ReconnectRequired, events: [] }));
    renderPage();

    expect(screen.getByText('Reconnect Google to see your calendar')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reconnect Google' }));

    expect(await screen.findByText('No client')).toBeInTheDocument();
  });

  it("shows why Google could not be read, keeping the month's meetings", () => {
    show(
      calendarData({
        google: MaCalendarGoogleState.Unavailable,
        googleError: 'Try later.',
        events: [],
      }),
    );
    renderPage();
    expect(screen.getByText('Try later.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Weekly sync/ })).toBeInTheDocument();
  });
});
