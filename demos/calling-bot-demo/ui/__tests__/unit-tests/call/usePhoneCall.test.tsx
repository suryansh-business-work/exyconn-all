import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CallingBotCallStatus,
  CallingBotChannel,
  CallingBotTurnRole,
} from '@exyconn/shell/graphql/generated';
import { usePhoneCall } from '../../../src/call/usePhoneCall';
import { renderHookWithProviders } from '../test-utils';

const mocks = vi.hoisted(() => ({
  startCall: vi.fn(),
  starting: false,
  query: vi.fn(),
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useStartCallingBotCallMutation: () => [mocks.startCall, { loading: mocks.starting }],
  useCallingBotCallQuery: mocks.query,
}));

interface CallData {
  status: CallingBotCallStatus;
  answeredAt?: string | null;
  endReason?: string;
  transcript?: Array<{ role: CallingBotTurnRole; text: string; at: string }>;
}

function serve(call: CallData | null) {
  mocks.query.mockReturnValue({
    data: call ? { callingBotCall: { endReason: '', transcript: [], ...call } } : undefined,
    startPolling: mocks.startPolling,
    stopPolling: mocks.stopPolling,
  });
}

async function placed() {
  const hook = renderHookWithProviders(() => usePhoneCall('scenario-1'));
  await act(async () => {
    await hook.result.current.start('+919876543210');
  });
  return hook;
}

describe('a call to the caller’s phone', () => {
  beforeEach(() => {
    mocks.starting = false;
    serve(null);
    mocks.startCall.mockResolvedValue({
      data: { startCallingBotCall: { call: { id: 'call-1' } } },
    });
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('is idle and asks for nothing before a number is given', () => {
    const { result } = renderHookWithProviders(() => usePhoneCall(null));
    expect(result.current).toMatchObject({
      phase: 'idle',
      status: null,
      endReason: '',
      lines: [],
      error: null,
      startedAt: null,
    });
    expect(mocks.query).toHaveBeenLastCalledWith({
      variables: { id: '' },
      skip: true,
      fetchPolicy: 'network-only',
    });
    expect(mocks.startPolling).not.toHaveBeenCalled();
  });

  it('shows the call as connecting while it is being placed', () => {
    mocks.starting = true;
    const { result } = renderHookWithProviders(() => usePhoneCall(null));
    expect(result.current.phase).toBe('connecting');
  });

  it('places the call with the picked example and follows it every two seconds', async () => {
    const { result } = await placed();
    expect(mocks.startCall).toHaveBeenCalledWith({
      variables: {
        input: { channel: CallingBotChannel.Phone, phone: '+919876543210', scenarioId: 'scenario-1' },
      },
    });
    expect(mocks.query).toHaveBeenLastCalledWith(
      expect.objectContaining({ variables: { id: 'call-1' }, skip: false }),
    );
    expect(mocks.startPolling).toHaveBeenCalledWith(2000);
    expect(result.current.phase).toBe('connecting');
  });

  it('lists the transcript and times the call once it is answered', async () => {
    serve({
      status: CallingBotCallStatus.Live,
      answeredAt: '2026-10-01T10:00:00.000Z',
      transcript: [
        { role: CallingBotTurnRole.Bot, text: 'Hello', at: '2026-10-01T10:00:01.000Z' },
        { role: CallingBotTurnRole.Caller, text: 'Hi', at: '2026-10-01T10:00:02.000Z' },
      ],
    });
    const { result } = await placed();
    expect(result.current.phase).toBe('live');
    expect(result.current.startedAt).toBe(Date.parse('2026-10-01T10:00:00.000Z'));
    expect(result.current.lines).toEqual([
      { key: '2026-10-01T10:00:01.000Z-BOT', role: CallingBotTurnRole.Bot, text: 'Hello' },
      { key: '2026-10-01T10:00:02.000Z-CALLER', role: CallingBotTurnRole.Caller, text: 'Hi' },
    ]);
  });

  it('keeps ringing as connecting', async () => {
    serve({ status: CallingBotCallStatus.Ringing });
    const { result } = await placed();
    expect(result.current).toMatchObject({ phase: 'connecting', status: 'RINGING' });
  });

  it('stops following a finished call and shows why a failed one ended', async () => {
    serve({ status: CallingBotCallStatus.Failed, endReason: 'Phone call busy' });
    const { result } = await placed();
    expect(mocks.startPolling).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      phase: 'ended',
      endReason: 'Phone call busy',
      error: 'Phone call busy',
    });
  });

  it('shows no error for a call that ended normally', async () => {
    serve({ status: CallingBotCallStatus.Ended, endReason: 'Phone call completed' });
    const { result } = await placed();
    expect(result.current).toMatchObject({ phase: 'ended', error: null });
  });

  it('explains a call that could not be placed', async () => {
    mocks.startCall.mockRejectedValueOnce('refused');
    const { result } = await placed();
    expect(result.current.error).toBe('The phone call could not be placed.');
    expect(result.current.phase).toBe('idle');
  });

  it('stays idle when the server returns no call', async () => {
    mocks.startCall.mockResolvedValueOnce({ data: null });
    const { result } = await placed();
    expect(result.current.phase).toBe('idle');
  });

  it('goes back to idle on reset', async () => {
    const { result } = await placed();
    act(() => result.current.reset());
    expect(result.current.phase).toBe('idle');
    expect(mocks.stopPolling).toHaveBeenCalled();
  });
});
