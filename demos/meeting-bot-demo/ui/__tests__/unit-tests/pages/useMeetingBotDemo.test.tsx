import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MaBotStatus } from '@exyconn/shell/graphql/generated';
import {
  POLL_MS,
  isMoving,
  useMeetingBotDemo,
} from '../../../src/pages/meeting-bot/useMeetingBotDemo';
import { INFO, renderHookWithProviders, tripOf } from '../test-utils';

const api = vi.hoisted(() => ({
  info: vi.fn(),
  trips: vi.fn(),
  send: vi.fn(),
  cancel: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMeetingBotDemoInfoQuery: () => api.info(),
  useMeetingBotDemoTripsQuery: () => api.trips(),
  useSendMeetingBotDemoMutation: () => [api.send, { loading: false }],
  useCancelMeetingBotDemoMutation: () => [api.cancel],
}));

const startPolling = vi.fn();
const stopPolling = vi.fn();
const refetchInfo = vi.fn();
const refetchTrips = vi.fn();

function tripsResult(trips: ReturnType<typeof tripOf>[] | null, extra: object = {}) {
  return {
    data: trips ? { meetingBotDemoTrips: trips } : undefined,
    loading: !trips,
    error: undefined,
    refetch: refetchTrips,
    startPolling,
    stopPolling,
    ...extra,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.info.mockReturnValue({
    data: { meetingBotDemoInfo: INFO },
    error: undefined,
    refetch: refetchInfo,
  });
  api.trips.mockReturnValue(tripsResult([]));
});

describe('whether a trip can still change', () => {
  it('moves while the bot works and while its notes are written, never once deleted', () => {
    expect(isMoving(tripOf({ status: MaBotStatus.InCall }))).toBe(true);
    expect(isMoving(tripOf({ status: MaBotStatus.Done, summaryStatus: 'RUNNING' }))).toBe(true);
    expect(isMoving(tripOf({ status: MaBotStatus.Done, summaryStatus: 'READY' }))).toBe(false);
    expect(isMoving(tripOf({ status: MaBotStatus.Failed }))).toBe(false);
    expect(isMoving(tripOf({ status: MaBotStatus.Queued, purged: true }))).toBe(false);
  });
});

describe('the demo data', () => {
  it('passes the terms and trips through, and retries each', () => {
    const { result } = renderHookWithProviders(useMeetingBotDemo);
    expect(result.current.info).toEqual(INFO);
    expect(result.current.trips).toEqual([]);
    result.current.retryInfo();
    result.current.retryTrips();
    expect(refetchInfo).toHaveBeenCalled();
    expect(refetchTrips).toHaveBeenCalled();
    expect(startPolling).not.toHaveBeenCalled();
  });

  it('reports loading and errors', () => {
    api.info.mockReturnValue({
      data: undefined,
      error: new Error('Info failed'),
      refetch: refetchInfo,
    });
    api.trips.mockReturnValue(tripsResult(null, { error: new Error('Trips failed') }));
    const { result } = renderHookWithProviders(useMeetingBotDemo);
    expect(result.current.info).toBeNull();
    expect(result.current.infoError).toBe('Info failed');
    expect(result.current.tripsError).toBe('Trips failed');
    expect(result.current.tripsLoading).toBe(true);
  });

  it('re-reads the trips while one is still moving, and stops when it settles', () => {
    api.trips.mockReturnValue(tripsResult([tripOf({ status: MaBotStatus.InCall })]));
    const { rerender } = renderHookWithProviders(useMeetingBotDemo);
    expect(startPolling).toHaveBeenCalledWith(POLL_MS);
    api.trips.mockReturnValue(tripsResult([tripOf({ status: MaBotStatus.Failed })]));
    rerender();
    expect(stopPolling).toHaveBeenCalled();
  });

  it('sends the bot and says so, or says why it could not', async () => {
    api.send.mockResolvedValueOnce({});
    const { result } = renderHookWithProviders(useMeetingBotDemo);
    const values = { meetUrl: 'https://meet.google.com/abc-defg-hij', consent: true };
    await act(async () => {
      expect(await result.current.send(values)).toBe(true);
    });
    expect(api.send).toHaveBeenCalledWith(expect.objectContaining({ variables: values }));
    expect(await screen.findByText(/The bot is on its way/)).toBeInTheDocument();
    api.send.mockRejectedValueOnce(new Error('You have used today’s demo calls.'));
    await act(async () => {
      expect(await result.current.send(values)).toBe(false);
    });
    expect(await screen.findByText('You have used today’s demo calls.')).toBeInTheDocument();
  });

  it('calls the bot back only once the visitor confirms, and reports a failure', async () => {
    const trip = tripOf({ status: MaBotStatus.InCall });
    const { result } = renderHookWithProviders(useMeetingBotDemo);
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.callBack(trip);
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await act(() => pending);
    expect(api.cancel).not.toHaveBeenCalled();

    api.cancel.mockResolvedValueOnce({});
    act(() => {
      pending = result.current.callBack(trip);
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Call back' }));
    await act(() => pending);
    expect(api.cancel).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: trip.id } }),
    );
    expect(await screen.findByText('The bot was called back')).toBeInTheDocument();

    api.cancel.mockRejectedValueOnce(new Error('Demo call not found'));
    act(() => {
      pending = result.current.callBack(trip);
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Call back' }));
    await act(() => pending);
    expect(await screen.findByText('Demo call not found')).toBeInTheDocument();
  });
});
