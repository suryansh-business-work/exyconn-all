import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MaBotStatus } from '@exyconn/shell/graphql/generated';
import { SendBotPanel } from '../../../src/components/SendBotPanel';
import { TripCard } from '../../../src/components/TripCard';
import { TripList } from '../../../src/components/TripList';
import type { MeetingBotDemo } from '../../../src/pages/meeting-bot/useMeetingBotDemo';
import { INFO, SUMMARY, renderWithProviders, tripOf } from '../test-utils';

/** The page's data, ready and empty unless overridden. */
function demoOf(overrides: Partial<MeetingBotDemo> = {}): MeetingBotDemo {
  return {
    info: INFO,
    infoError: null,
    retryInfo: vi.fn(),
    trips: [],
    tripsLoading: false,
    tripsError: null,
    retryTrips: vi.fn(),
    sending: false,
    send: vi.fn().mockResolvedValue(true),
    callBack: vi.fn(),
    ...overrides,
  } as MeetingBotDemo;
}

describe('the send panel', () => {
  it('shows the limits and terms, and sends through the form', async () => {
    const demo = demoOf();
    renderWithProviders(<SendBotPanel demo={demo} />);
    expect(
      screen.getByText(
        'Exyconn Notetaker records up to 30 minutes. You have 2 of 3 demo calls left today.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(INFO.consentText)).toBeInTheDocument();
    await userEvent.type(
      screen.getByRole('textbox', { name: /Google Meet link/ }),
      'https://meet.google.com/abc-defg-hij',
    );
    await userEvent.click(screen.getByRole('switch', { name: /I agree/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Send the bot to my call' }));
    await vi.waitFor(() => {
      expect(demo.send).toHaveBeenCalledWith({
        meetUrl: 'https://meet.google.com/abc-defg-hij',
        consent: true,
      });
    });
  });

  it('says when the bot is not set up, and when the day’s calls are used', () => {
    renderWithProviders(
      <SendBotPanel demo={demoOf({ info: { ...INFO, enabled: false, tripsLeftToday: 0 } })} />,
    );
    expect(screen.getByText(/not set up on this server yet/)).toBeInTheDocument();
    expect(screen.getByText(/used today’s demo calls/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send the bot to my call' })).toBeDisabled();
  });

  it('shows loading, then a retryable error', async () => {
    const { unmount } = renderWithProviders(<SendBotPanel demo={demoOf({ info: null })} />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    unmount();
    const demo = demoOf({ info: null, infoError: 'Network down' });
    renderWithProviders(<SendBotPanel demo={demo} />);
    expect(screen.getByText('Network down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(demo.retryInfo).toHaveBeenCalled();
  });
});

describe('the trip list', () => {
  it('shows loading, an empty state, and a retryable error', async () => {
    const { unmount } = renderWithProviders(<TripList demo={demoOf({ tripsLoading: true })} />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    unmount();
    const empty = renderWithProviders(<TripList demo={demoOf()} />);
    expect(screen.getByText(/No calls yet/)).toBeInTheDocument();
    empty.unmount();
    const demo = demoOf({ tripsError: 'Server error' });
    renderWithProviders(<TripList demo={demo} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(demo.retryTrips).toHaveBeenCalled();
  });

  it('lists each trip, and calls a live bot back', async () => {
    const live = tripOf({ id: 't1', status: MaBotStatus.InCall });
    const done = tripOf({ id: 't2', meetingCode: 'xyz-abcd-efg', status: MaBotStatus.Cancelled });
    const demo = demoOf({ trips: [live, done] });
    renderWithProviders(<TripList demo={demo} />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'abc-defg-hij',
      'xyz-abcd-efg',
    ]);
    expect(screen.getAllByRole('button', { name: 'Call back' })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Call back' }));
    expect(demo.callBack).toHaveBeenCalledWith(live);
    expect(screen.getByText('No notes were made for this call.')).toBeInTheDocument();
  });
});

describe('a trip', () => {
  const show = (trip: ReturnType<typeof tripOf>) =>
    renderWithProviders(<TripCard trip={trip} onCallBack={vi.fn()} />);

  it('says where the bot is while it works, with progress', () => {
    show(tripOf({ status: MaBotStatus.WaitingAdmit }));
    expect(
      screen.getByText('The bot is in the lobby. Admit it from your call.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Waiting for the bot' })).toBeInTheDocument();
  });

  it('says the notes are coming once the call has ended', () => {
    show(tripOf({ status: MaBotStatus.Done, summaryStatus: 'RUNNING' }));
    expect(screen.getByText(/notes are being written/)).toBeInTheDocument();
  });

  it('says no notes were made when the notes step was skipped', () => {
    show(tripOf({ status: MaBotStatus.Done, summaryStatus: 'SKIPPED' }));
    expect(screen.getByText('No notes were made for this call.')).toBeInTheDocument();
  });

  it('shows why a trip failed, or a plain reason', () => {
    const { unmount } = show(tripOf({ status: MaBotStatus.Failed, error: 'Not admitted' }));
    expect(screen.getByText('Not admitted')).toBeInTheDocument();
    unmount();
    show(tripOf({ status: MaBotStatus.Failed }));
    expect(screen.getByText('The bot could not record this call.')).toBeInTheDocument();
  });

  it('says a deleted recording is gone', () => {
    show(tripOf({ status: MaBotStatus.Done, purged: true }));
    expect(screen.getByText(/have been deleted/)).toBeInTheDocument();
  });

  it('shows the notes, the actions with owners and dates, and when they were emailed', () => {
    show(
      tripOf({
        status: MaBotStatus.Done,
        summaryStatus: 'READY',
        summary: SUMMARY,
        emailedAt: '2026-10-31T11:00:00.000Z',
      }),
    );
    expect(screen.getByText('We agreed the rollout.')).toBeInTheDocument();
    expect(screen.getByText('Go with plan B')).toBeInTheDocument();
    const actions = screen.getByRole('heading', { name: 'Action items' }).parentElement;
    const lines = within(actions as HTMLElement).getAllByRole('listitem');
    expect(lines[0]).toHaveTextContent('Send quote — Asha, Friday');
    expect(lines[1]).toHaveTextContent(/^Book demo — No owner yet, .*2026/);
    expect(lines[2]).toHaveTextContent('Think it over — No owner yet');
    expect(screen.getByText(/Notes emailed to you/)).toBeInTheDocument();
  });

  it('says plainly when the notes hold no decisions or actions', () => {
    show(
      tripOf({
        status: MaBotStatus.Done,
        summaryStatus: 'READY',
        summary: {
          ...SUMMARY,
          executiveSummary: '',
          discussionPoints: [],
          decisions: [],
          actionItems: [],
        },
      }),
    );
    expect(screen.getByText('No decisions or action items were recorded.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Decisions' })).not.toBeInTheDocument();
  });
});
