import type WebSocket from 'ws';
import { BROWSER_AUDIO } from '../audio';
import { Conversation } from '../conversation';
import type { TicketedCall } from '../store';
import type { CallEvent, Transport } from '../transport';

/**
 * A call from the browser. Binary frames are audio both ways — 16 kHz 16-bit mono PCM; text
 * frames are JSON: the call screen's transcript and "clear" (stop playing) from here, and
 * `{"type":"hangup"}` from the browser.
 */
export function startBrowserCall(socket: WebSocket, { call, config }: TicketedCall): Conversation {
  const send = (message: object) => socket.send(JSON.stringify(message));
  const transport: Transport = {
    format: BROWSER_AUDIO,
    play: (audio) => socket.send(Buffer.from(audio, 'base64')),
    clear: () => send({ type: 'clear' }),
    notify: (event: CallEvent) => send(event),
    hangUp: () => socket.close(1000),
  };
  const conversation = Conversation.open(call, config, transport);
  socket.on('message', (data: Buffer, isBinary: boolean) => {
    if (isBinary) {
      conversation.hear(data.toString('base64'));
    } else if (data.toString() === JSON.stringify({ type: 'hangup' })) {
      conversation.end('ENDED', 'Caller hung up');
    }
  });
  socket.on('close', () => conversation.end('ENDED', 'Caller hung up'));
  return conversation;
}
