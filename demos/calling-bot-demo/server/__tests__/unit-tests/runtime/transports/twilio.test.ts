import { createHmac } from 'node:crypto';
import type WebSocket from 'ws';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PHONE_AUDIO } from '../../../../src/runtime/audio';
import { Conversation } from '../../../../src/runtime/conversation';
import { log } from '../../../../src/runtime/log';
import { endCall, setStatus } from '../../../../src/runtime/store';
import {
  answerTwiml,
  signedByTwilio,
  startTwilioCall,
  twilioCallEnded,
  type ClaimCall,
} from '../../../../src/runtime/transports/twilio';
import { FakeSocket, makeTicketed } from '../../fixtures';

vi.mock('../../../../src/runtime/conversation', () => ({
  Conversation: { open: vi.fn(() => ({ hear: vi.fn(), end: vi.fn() })) },
}));
vi.mock('../../../../src/runtime/store', () => ({ endCall: vi.fn(), setStatus: vi.fn() }));
vi.mock('../../../../src/runtime/log', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  errorText: (error: unknown) => (error instanceof Error ? error.message : String(error)),
}));

const TOKEN = 'twilio-test-token';
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Twilio's callbacks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const params = { CallStatus: 'completed', AccountSid: 'AC1', CallSid: 'CA1' };
  // Twilio signs the full URL, then each parameter's name and value in name order.
  const genuine = createHmac('sha1', TOKEN)
    .update('https://voice.test/api/twilio/status?ticket=t1AccountSidAC1CallSidCA1CallStatuscompleted')
    .digest('base64');

  it('accepts a genuine signature over the address and sorted parameters', () => {
    expect(signedByTwilio(genuine, '/twilio/status?ticket=t1', params, TOKEN)).toBe(true);
  });

  it('refuses a changed parameter, a short signature, no signature or no token', () => {
    const changed = { ...params, CallStatus: 'busy' };
    expect(signedByTwilio(genuine, '/twilio/status?ticket=t1', changed, TOKEN)).toBe(false);
    expect(signedByTwilio('short', '/twilio/status?ticket=t1', params, TOKEN)).toBe(false);
    expect(signedByTwilio(undefined, '/twilio/status?ticket=t1', params, TOKEN)).toBe(false);
    expect(signedByTwilio([genuine], '/twilio/status?ticket=t1', params, TOKEN)).toBe(false);
    expect(signedByTwilio(genuine, '/twilio/status?ticket=t1', params, '')).toBe(false);
  });

  it('answers with a stream to this server carrying the ticket as a parameter', () => {
    expect(answerTwiml('a"<b>&')).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Connect>' +
        '<Stream url="wss://voice.test/api/twilio/stream">' +
        '<Parameter name="ticket" value="a&quot;&lt;b&gt;&amp;"/>' +
        '</Stream></Connect></Response>',
    );
  });

  it.each([
    ['completed', 'ENDED', 'Phone call completed'],
    ['', 'ENDED', 'Phone call ended'],
    ['no-answer', 'FAILED', 'Phone call no-answer'],
  ])('ends a %j call as %s', async (status, outcome, reason) => {
    const ticketed = makeTicketed();
    await twilioCallEnded(ticketed, status);
    expect(endCall).toHaveBeenCalledWith(ticketed.call, outcome, reason);
  });
});

describe("a phone call's Twilio media stream", () => {
  const ticketed = makeTicketed();
  const release = vi.fn();
  let claim: ReturnType<typeof vi.fn<ClaimCall>>;

  beforeEach(() => {
    vi.mocked(setStatus).mockResolvedValue();
    claim = vi.fn<ClaimCall>().mockResolvedValue({ ticketed, release });
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  function start() {
    const socket = new FakeSocket();
    startTwilioCall(socket as unknown as WebSocket, claim);
    return socket;
  }

  const startMessage = {
    event: 'start',
    start: { streamSid: 'MZ1', callSid: 'CA1', customParameters: { ticket: 't1' } },
  };

  const opened = () => ({
    transport: vi.mocked(Conversation.open).mock.calls[0][2],
    conversation: vi.mocked(Conversation.open).mock.results[0].value as {
      hear: ReturnType<typeof vi.fn>;
      end: ReturnType<typeof vi.fn>;
    },
  });

  it('claims the call its start names, marks it live and answers it', async () => {
    const socket = start();
    socket.receive({ event: 'connected' });
    socket.receive(startMessage);
    await flush();
    expect(claim).toHaveBeenCalledWith('t1');
    expect(setStatus).toHaveBeenCalledWith(ticketed.call, 'LIVE', { providerCallId: 'CA1' });
    const { transport } = opened();
    expect(transport.format).toBe(PHONE_AUDIO);
    transport.play('QUJD');
    transport.clear();
    transport.notify({ type: 'turn', role: 'BOT', text: 'Hi' });
    transport.hangUp();
    expect(socket.sentJson()).toEqual([
      { event: 'media', streamSid: 'MZ1', media: { payload: 'QUJD' } },
      { event: 'clear', streamSid: 'MZ1' },
    ]);
    expect(socket.close).toHaveBeenCalledWith(1000);
  });

  it('hears media, ends on stop, and releases the line when the socket closes', async () => {
    const socket = start();
    socket.receive({ event: 'media', media: { payload: 'early' } });
    socket.receive(startMessage);
    await flush();
    socket.receive(startMessage);
    socket.receive({ event: 'start' });
    socket.receive({ event: 'media', media: { payload: 'QUJD' } });
    socket.receive({ event: 'media' });
    socket.receive({ event: 'stop' });
    socket.emit('close');
    const { conversation } = opened();
    expect(claim).toHaveBeenCalledTimes(1);
    expect(conversation.hear.mock.calls).toEqual([['QUJD']]);
    expect(conversation.end).toHaveBeenCalledWith('ENDED', 'Phone call ended');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('copes with a start that names no ticket, stream or call', async () => {
    const socket = start();
    socket.receive({ event: 'start', start: {} });
    await flush();
    expect(claim).toHaveBeenCalledWith('');
    expect(setStatus).toHaveBeenCalledWith(ticketed.call, 'LIVE', { providerCallId: '' });
    opened().transport.clear();
    expect(socket.sentJson()).toEqual([{ event: 'clear', streamSid: '' }]);
  });

  it('drops a stream whose ticket opens no call', async () => {
    claim.mockResolvedValueOnce(null);
    const socket = start();
    socket.receive(startMessage);
    await flush();
    expect(socket.close).toHaveBeenCalledWith(1008);
    expect(Conversation.open).not.toHaveBeenCalled();
  });

  it('drops a stream that never says which call it carries', () => {
    vi.useFakeTimers();
    const socket = start();
    vi.advanceTimersByTime(9_999);
    expect(socket.close).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(socket.close).toHaveBeenCalledWith(1008);
  });

  it('keeps a claimed stream past the start timeout', async () => {
    vi.useFakeTimers();
    const socket = start();
    socket.receive(startMessage);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(socket.close).not.toHaveBeenCalled();
  });

  it('closes quietly before any start', () => {
    const socket = start();
    socket.emit('close');
    expect(Conversation.open).not.toHaveBeenCalled();
  });

  it('logs and closes when the call cannot be started', async () => {
    vi.mocked(setStatus).mockRejectedValueOnce(new Error('db down'));
    const socket = start();
    socket.receive(startMessage);
    await flush();
    expect(log.error).toHaveBeenCalledWith('could not start a Twilio call', { error: 'db down' });
    expect(socket.close).toHaveBeenCalledWith(1011);
  });
});
