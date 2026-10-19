import { createHmac } from 'node:crypto';
import type WebSocket from 'ws';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PHONE_AUDIO } from '../../../../src/runtime/audio';
import { Conversation } from '../../../../src/runtime/conversation';
import { log } from '../../../../src/runtime/log';
import { endCall, setStatus } from '../../../../src/runtime/store';
import {
  answerXml,
  phoneHungUp,
  signedByVobiz,
  startPhoneCall,
} from '../../../../src/runtime/transports/vobiz';
import { FakeSocket, makeTicketed } from '../../fixtures';

vi.mock('../../../../src/runtime/conversation', () => ({
  Conversation: { open: vi.fn(() => ({ hear: vi.fn(), end: vi.fn() })) },
}));
vi.mock('../../../../src/runtime/store', () => ({ endCall: vi.fn(), setStatus: vi.fn() }));
vi.mock('../../../../src/runtime/log', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  errorText: (error: unknown) => (error instanceof Error ? error.message : String(error)),
}));

const TOKEN = 'vobiz-test-token';
const PUBLIC_URL = 'https://voice.test/api';
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const signatureOf = (path: string, nonce: string) =>
  createHmac('sha256', TOKEN).update(`${PUBLIC_URL}${path}${nonce}`).digest('base64');

describe("Vobiz's callbacks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('accepts a genuine signature over the callback address and nonce', () => {
    const headers = {
      'x-vobiz-signature-v2': signatureOf('/vobiz/answer', 'n1'),
      'x-vobiz-signature-v2-nonce': 'n1',
    };
    expect(signedByVobiz(headers, '/vobiz/answer', TOKEN)).toBe(true);
    expect(signedByVobiz(headers, '/vobiz/hangup', TOKEN)).toBe(false);
  });

  it('refuses a signature of the wrong length', () => {
    const headers = { 'x-vobiz-signature-v2': 'short', 'x-vobiz-signature-v2-nonce': 'n1' };
    expect(signedByVobiz(headers, '/vobiz/answer', TOKEN)).toBe(false);
  });

  it('leaves an unsigned callback to its ticket', () => {
    expect(signedByVobiz({}, '/vobiz/answer', TOKEN)).toBe(true);
    expect(signedByVobiz({ 'x-vobiz-signature-v2': 'sig' }, '/vobiz/answer', TOKEN)).toBe(true);
  });

  it('answers with a two-way mu-law stream to this server, the ticket escaped', () => {
    expect(answerXml('a&b c')).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><Response>' +
        '<Stream bidirectional="true" keepCallAlive="true" contentType="audio/x-mulaw;rate=8000">' +
        'wss://voice.test/api/vobiz/stream?ticket=a%26b%20c</Stream></Response>',
    );
  });

  it('ends the call on hangup, with the status when Vobiz gives one', async () => {
    const ticketed = makeTicketed();
    await phoneHungUp(ticketed, 'busy');
    await phoneHungUp(ticketed, '');
    expect(vi.mocked(endCall).mock.calls).toEqual([
      [ticketed.call, 'ENDED', 'Phone call busy'],
      [ticketed.call, 'ENDED', 'Phone call ended'],
    ]);
  });
});

describe("a phone call's Vobiz media stream", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function start() {
    vi.mocked(setStatus).mockResolvedValue();
    const socket = new FakeSocket();
    const ticketed = makeTicketed();
    startPhoneCall(socket as unknown as WebSocket, ticketed);
    return { socket, ticketed };
  }

  const opened = () => {
    const [, , transport] = vi.mocked(Conversation.open).mock.calls[0];
    const conversation = vi.mocked(Conversation.open).mock.results[0].value as {
      hear: ReturnType<typeof vi.fn>;
      end: ReturnType<typeof vi.fn>;
    };
    return { transport, conversation };
  };

  it('answers on start, recording the Vobiz call id', () => {
    const { socket, ticketed } = start();
    socket.receive({ event: 'start', start: { streamId: 'S1', callId: 'V1' } });
    expect(setStatus).toHaveBeenCalledWith(ticketed.call, 'LIVE', { providerCallId: 'V1' });
    expect(Conversation.open).toHaveBeenCalledWith(
      ticketed.call,
      ticketed.config,
      expect.objectContaining({ format: PHONE_AUDIO }),
    );
  });

  it('plays the voice in 60 ms pieces on its stream and cuts it with clearAudio', () => {
    const { socket } = start();
    socket.receive({ event: 'start', start: { streamId: 'S1', callId: 'V1' } });
    const { transport } = opened();
    transport.play(Buffer.alloc(1000, 7).toString('base64'));
    transport.clear();
    transport.notify({ type: 'turn', role: 'BOT', text: 'Hi' });
    transport.hangUp();
    const sent = socket.sentJson() as Array<{ event: string; media?: { payload: string } }>;
    expect(sent.map((message) => message.event)).toEqual([
      'playAudio',
      'playAudio',
      'playAudio',
      'clearAudio',
    ]);
    expect(sent[0]).toEqual({
      event: 'playAudio',
      streamId: 'S1',
      media: {
        contentType: 'audio/x-mulaw',
        sampleRate: 8000,
        payload: Buffer.alloc(480, 7).toString('base64'),
      },
    });
    expect(Buffer.from(sent[2].media?.payload ?? '', 'base64')).toHaveLength(40);
    expect(sent[3]).toEqual({ event: 'clearAudio', streamId: 'S1' });
    expect(socket.close).toHaveBeenCalledWith(1000);
  });

  it('copes with a start that names neither stream nor call', () => {
    const { socket, ticketed } = start();
    socket.receive({ event: 'start' });
    expect(setStatus).toHaveBeenCalledWith(ticketed.call, 'LIVE', { providerCallId: '' });
    opened().transport.clear();
    expect(socket.sentJson()).toEqual([{ event: 'clearAudio', streamId: '' }]);
  });

  it('hears media with audio, answers only the first start and ends when the socket closes', () => {
    const { socket } = start();
    socket.receive({ event: 'media', media: { payload: 'early' } });
    socket.receive({ event: 'start', start: { streamId: 'S1' } });
    socket.receive({ event: 'start', start: { streamId: 'S2' } });
    socket.receive({ event: 'media', media: { payload: 'QUJD' } });
    socket.receive({ event: 'media', media: {} });
    socket.emit('close');
    const { conversation } = opened();
    expect(Conversation.open).toHaveBeenCalledTimes(1);
    expect(conversation.hear.mock.calls).toEqual([['QUJD']]);
    expect(conversation.end).toHaveBeenCalledWith('ENDED', 'Phone call ended');
  });

  it('closes quietly before any start', () => {
    const { socket } = start();
    socket.emit('close');
    expect(Conversation.open).not.toHaveBeenCalled();
  });

  it('logs when the call id cannot be recorded', async () => {
    const { socket } = start();
    vi.mocked(setStatus).mockRejectedValueOnce(new Error('db down'));
    socket.receive({ event: 'start', start: { streamId: 'S1', callId: 'V1' } });
    await flush();
    expect(log.error).toHaveBeenCalledWith('could not record the phone call id', {
      error: 'db down',
    });
  });
});
