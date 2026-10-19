import type WebSocket from 'ws';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BROWSER_AUDIO } from '../../../../src/runtime/audio';
import { Conversation } from '../../../../src/runtime/conversation';
import type { Transport } from '../../../../src/runtime/transport';
import { startBrowserCall } from '../../../../src/runtime/transports/browser';
import { FakeSocket, makeTicketed } from '../../fixtures';

vi.mock('../../../../src/runtime/conversation', () => ({
  Conversation: { open: vi.fn(() => ({ hear: vi.fn(), end: vi.fn() })) },
}));

function start() {
  const socket = new FakeSocket();
  const ticketed = makeTicketed();
  const conversation = startBrowserCall(socket as unknown as WebSocket, ticketed);
  const transport = vi.mocked(Conversation.open).mock.calls[0][2];
  return { socket, ticketed, conversation, transport };
}

describe('a call from the browser', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('answers the ticketed call over 16 kHz PCM', () => {
    const { ticketed, transport } = start();
    expect(Conversation.open).toHaveBeenCalledWith(ticketed.call, ticketed.config, transport);
    expect(transport.format).toBe(BROWSER_AUDIO);
  });

  it('sends the voice as binary frames and everything else as JSON', () => {
    const { socket, transport } = start();
    transport.play(Buffer.from('pcm').toString('base64'));
    transport.clear();
    transport.notify({ type: 'turn', role: 'BOT', text: 'Hi' });
    expect(socket.send.mock.calls[0][0]).toEqual(Buffer.from('pcm'));
    expect(socket.send.mock.calls.slice(1).map(([text]) => JSON.parse(String(text)))).toEqual([
      { type: 'clear' },
      { type: 'turn', role: 'BOT', text: 'Hi' },
    ]);
  });

  it('hangs up with a normal close', () => {
    const { socket, transport } = start();
    (transport satisfies Transport).hangUp();
    expect(socket.close).toHaveBeenCalledWith(1000);
  });

  it('hears binary frames and ends on a hangup message or a closed socket', () => {
    const { socket, conversation } = start();
    socket.emit('message', Buffer.from('audio'), true);
    socket.emit('message', Buffer.from('{"type":"other"}'), false);
    expect(conversation.hear).toHaveBeenCalledWith(Buffer.from('audio').toString('base64'));
    expect(conversation.end).not.toHaveBeenCalled();
    socket.emit('message', Buffer.from('{"type":"hangup"}'), false);
    socket.emit('close');
    expect(vi.mocked(conversation.end).mock.calls).toEqual([
      ['ENDED', 'Caller hung up'],
      ['ENDED', 'Caller hung up'],
    ]);
  });
});
