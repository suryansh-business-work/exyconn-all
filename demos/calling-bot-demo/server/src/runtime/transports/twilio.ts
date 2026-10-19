import { createHmac, timingSafeEqual } from 'node:crypto';
import type WebSocket from 'ws';
import { VOICE_PATHS } from '../../index';
import { PHONE_AUDIO } from '../audio';
import { Conversation } from '../conversation';
import { env } from '../env';
import { errorText, log } from '../log';
import { endCall, setStatus, type TicketedCall } from '../store';
import type { Transport } from '../transport';

/** A stream that has not said which call it carries within this long is dropped. */
const START_TIMEOUT_MS = 10_000;

/** What opens a call's audio line: the ticket checked and the line claimed, or null. */
export type ClaimCall = (
  ticket: string,
) => Promise<{ ticketed: TicketedCall; release: () => void } | null>;

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/**
 * Whether a callback came from Twilio: `X-Twilio-Signature` is the base64 HMAC-SHA1 of the
 * full URL Twilio requested, followed by every POST parameter's name and value in name order,
 * keyed with the account's Auth Token.
 */
export function signedByTwilio(
  signature: string | string[] | undefined,
  pathAndQuery: string,
  params: Record<string, string>,
  authToken: string,
): boolean {
  if (typeof signature !== 'string' || !authToken) {
    return false;
  }
  const payload = Object.keys(params)
    .sort((a, b) => a.localeCompare(b))
    .reduce((text, name) => `${text}${name}${params[name]}`, `${env.publicUrl}${pathAndQuery}`);
  const expected = Buffer.from(createHmac('sha1', authToken).update(payload).digest('base64'));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/**
 * The TwiML that answers a call: stream its audio both ways to this server. Twilio's stream URL
 * takes no query string, so the ticket rides along as a custom parameter.
 */
export function answerTwiml(ticket: string): string {
  const streamUrl = `${env.publicUrl.replace(/^http/, 'ws')}${VOICE_PATHS.twilioStream}`;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Response><Connect>',
    `<Stream url="${escapeXml(streamUrl)}">`,
    `<Parameter name="ticket" value="${escapeXml(ticket)}"/>`,
    '</Stream>',
    '</Connect></Response>',
  ].join('');
}

/** Twilio's status callback: the call is over, however it ended (completed, busy, no-answer…). */
export async function twilioCallEnded({ call }: TicketedCall, status: string): Promise<void> {
  const failed = status !== '' && status !== 'completed';
  await endCall(
    call,
    failed ? 'FAILED' : 'ENDED',
    status ? `Phone call ${status}` : 'Phone call ended',
  );
}

interface TwilioMessage {
  event?: string;
  start?: { streamSid?: string; callSid?: string; customParameters?: { ticket?: string } };
  media?: { payload?: string };
}

/** The line a Twilio media stream gives a conversation: mu-law out as `media`, cut with `clear`. */
function twilioTransport(socket: WebSocket, streamSid: string): Transport {
  const send = (message: object) => socket.send(JSON.stringify(message));
  return {
    format: PHONE_AUDIO,
    play: (audio) => send({ event: 'media', streamSid, media: { payload: audio } }),
    clear: () => send({ event: 'clear', streamSid }),
    notify: () => undefined,
    hangUp: () => socket.close(1000),
  };
}

/**
 * A phone call's media stream from Twilio: `connected`, then `start` with the stream id and
 * the ticket, then `media` every 20 ms with the caller's audio, and `stop`. Closing the socket
 * ends the call, since the answer TwiML has nothing after the stream.
 */
export function startTwilioCall(socket: WebSocket, claim: ClaimCall): void {
  let conversation: Conversation | null = null;
  let release: (() => void) | null = null;
  const unclaimed = setTimeout(() => socket.close(1008), START_TIMEOUT_MS);

  const begin = async (start: NonNullable<TwilioMessage['start']>) => {
    const claimed = await claim(start.customParameters?.ticket ?? '');
    if (!claimed) {
      socket.close(1008);
      return;
    }
    clearTimeout(unclaimed);
    release = claimed.release;
    const { ticketed } = claimed;
    await setStatus(ticketed.call, 'LIVE', { providerCallId: start.callSid ?? '' });
    conversation = Conversation.open(
      ticketed.call,
      ticketed.config,
      twilioTransport(socket, start.streamSid ?? ''),
    );
  };

  socket.on('message', (data: Buffer) => {
    const message = JSON.parse(data.toString()) as TwilioMessage;
    if (message.event === 'start' && message.start && !conversation) {
      begin(message.start).catch((error) => {
        log.error('could not start a Twilio call', { error: errorText(error) });
        socket.close(1011);
      });
    } else if (message.event === 'media' && message.media?.payload) {
      conversation?.hear(message.media.payload);
    } else if (message.event === 'stop') {
      conversation?.end('ENDED', 'Phone call ended');
    }
  });
  socket.on('close', () => {
    clearTimeout(unclaimed);
    conversation?.end('ENDED', 'Phone call ended');
    release?.();
  });
}
