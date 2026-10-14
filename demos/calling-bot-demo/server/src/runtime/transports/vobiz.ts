import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import type WebSocket from 'ws';
import { VOICE_PATHS, TICKET_PARAM } from '../../index';
import { PHONE_AUDIO } from '../audio';
import { Conversation } from '../conversation';
import { env } from '../env';
import { errorText, log } from '../log';
import { endCall, setStatus, type TicketedCall } from '../store';
import type { Transport } from '../transport';

/** Vobiz plays audio best in 20–60 ms pieces: 60 ms of 8 kHz mu-law is 480 bytes. */
const PIECE_BYTES = 480;

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/**
 * Whether a callback came from Vobiz: when it signs one, `X-Vobiz-Signature-V2` is the base64
 * HMAC-SHA256 of the callback URL (without its query) and the nonce, keyed with the Auth Token.
 * An unsigned callback still needs the call's ticket, which only the portal server can make.
 */
export function signedByVobiz(
  headers: IncomingHttpHeaders,
  path: string,
  authToken: string,
): boolean {
  const signature = headers['x-vobiz-signature-v2'];
  const nonce = headers['x-vobiz-signature-v2-nonce'];
  if (typeof signature !== 'string' || typeof nonce !== 'string') {
    return true;
  }
  const expected = Buffer.from(
    createHmac('sha256', authToken).update(`${env.publicUrl}${path}${nonce}`).digest('base64'),
  );
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** The answer XML: stream the call's audio both ways to this server, for as long as it runs. */
export function answerXml(ticket: string): string {
  const streamUrl = `${env.publicUrl.replace(/^http/, 'ws')}${VOICE_PATHS.vobizStream}?${TICKET_PARAM}=${encodeURIComponent(ticket)}`;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Response>',
    `<Stream bidirectional="true" keepCallAlive="true" contentType="audio/x-mulaw;rate=8000">${escapeXml(streamUrl)}</Stream>`,
    '</Response>',
  ].join('');
}

/** Vobiz's hangup callback: the phone call is over, however it ended. */
export async function phoneHungUp({ call }: TicketedCall, status: string): Promise<void> {
  await endCall(call, 'ENDED', status ? `Phone call ${status}` : 'Phone call ended');
}

/**
 * A phone call's media stream from Vobiz: JSON events, `start` once with the stream id, then
 * `media` every 20 ms with the caller's audio. The bot answers with `playAudio`, and cuts itself
 * off with `clearAudio`. Closing the socket ends the call.
 */
export function startPhoneCall(socket: WebSocket, ticketed: TicketedCall): void {
  let streamId = '';
  let conversation: Conversation | null = null;
  const send = (message: object) => socket.send(JSON.stringify(message));
  const transport: Transport = {
    format: PHONE_AUDIO,
    play: (audio) => {
      const bytes = Buffer.from(audio, 'base64');
      for (let at = 0; at < bytes.length; at += PIECE_BYTES) {
        send({
          event: 'playAudio',
          streamId,
          media: {
            contentType: 'audio/x-mulaw',
            sampleRate: PHONE_AUDIO.sampleRate,
            payload: bytes.subarray(at, at + PIECE_BYTES).toString('base64'),
          },
        });
      }
    },
    clear: () => send({ event: 'clearAudio', streamId }),
    notify: () => undefined,
    hangUp: () => socket.close(1000),
  };

  socket.on('message', (data: Buffer) => {
    const message = JSON.parse(data.toString()) as {
      event?: string;
      start?: { streamId?: string; callId?: string };
      media?: { payload?: string };
    };
    if (message.event === 'start' && !conversation) {
      streamId = message.start?.streamId ?? '';
      setStatus(ticketed.call, 'LIVE', { providerCallId: message.start?.callId ?? '' }).catch(
        (error) => log.error('could not record the phone call id', { error: errorText(error) }),
      );
      conversation = new Conversation(ticketed.call, ticketed.config, transport);
    } else if (message.event === 'media' && message.media?.payload) {
      conversation?.hear(message.media.payload);
    }
  });
  socket.on('close', () => conversation?.end('ENDED', 'Phone call ended'));
}
