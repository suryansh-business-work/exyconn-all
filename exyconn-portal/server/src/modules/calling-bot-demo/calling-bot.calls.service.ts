import {
  canPhone,
  signCallTicket,
  TICKET_PARAM,
  VOICE_PATHS,
  type CallChannel,
  type CallingBotCallRecord,
  type CallingBotConfigRecord,
} from '@exyconn/calling-bot-demo-server';
import { env } from '../../config/env';
import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import { badRequest, notFound } from '../../utils/errors';
import { isE164Phone } from '../../utils/phoneNumber';
import { CallingBotCallModel } from './calling-bot.models';
import { callingBotConfigs } from './calling-bot.config.service';
import { placeTwilioCall } from './twilio.client';
import { placeVobizCall } from './vobiz.client';

/** Who is asking for a call: a demo visitor (`visitor:<id>`) or a portal user. */
export interface Caller {
  id: string;
  name: string;
  email: string;
}

export interface StartCallInput {
  channel: CallChannel;
  /** The number to ring, in E.164; phone calls only. */
  phone?: string | null;
}

/** A browser has this long to open its audio socket once the call is asked for. */
const BROWSER_TICKET_SECONDS = 120;

/** A phone may ring this long before it answers, on top of the call's own limit. */
const RING_SECONDS = 120;

/** Every call costs speech and model time: a person gets a handful an hour. */
const callsPerCaller = createLimiter({
  keyPrefix: 'calling-bot-call',
  points: 10,
  durationSec: 3600,
});

/** A phone call also costs telephony, and could be aimed at somebody else's number. */
const phoneCallsPerCaller = createLimiter({
  keyPrefix: 'calling-bot-phone',
  points: 3,
  durationSec: 3600,
});
const callsPerNumber = createLimiter({
  keyPrefix: 'calling-bot-number',
  points: 3,
  durationSec: 86_400,
});

const voiceUrl = (path: string, ticket: string): string =>
  `${env.callingBotApiUrl}${path}?${TICKET_PARAM}=${encodeURIComponent(ticket)}`;

/** The voice server's address for a WebSocket, from its https one. */
const socketUrl = (path: string, ticket: string): string =>
  voiceUrl(path, ticket).replace(/^http/, 'ws');

async function ringPhone(
  call: CallingBotCallRecord,
  phone: string,
  config: CallingBotConfigRecord,
): Promise<void> {
  const ticket = signCallTicket(
    config.ticketSecret,
    String(call._id),
    config.maxCallSeconds + RING_SECONDS,
  );
  try {
    const providerCallId =
      config.phoneProvider === 'TWILIO'
        ? await placeTwilioCall({
            config,
            to: phone,
            answerUrl: voiceUrl(VOICE_PATHS.twilioAnswer, ticket),
            statusUrl: voiceUrl(VOICE_PATHS.twilioStatus, ticket),
          })
        : await placeVobizCall({
            config,
            to: phone,
            answerUrl: voiceUrl(VOICE_PATHS.vobizAnswer, ticket),
            hangupUrl: voiceUrl(VOICE_PATHS.vobizHangup, ticket),
          });
    await CallingBotCallModel.updateOne({ _id: call._id }, { status: 'RINGING', providerCallId });
  } catch (error) {
    await CallingBotCallModel.updateOne(
      { _id: call._id },
      { status: 'FAILED', endReason: 'The phone call could not be placed', endedAt: new Date() },
    );
    throw error;
  }
}

/** Calls with the bot: asking for one, following it, and the Tech screen's log. */
export const callingBotCalls = {
  /** Whether a call can be made right now, and whether to a phone. */
  async availability() {
    const config = await callingBotConfigs.active();
    return {
      available: Boolean(config),
      phoneEnabled: config ? canPhone(config) : false,
      languageCode: config?.languageCode ?? null,
      maxCallSeconds: config?.maxCallSeconds ?? null,
    };
  },

  /**
   * Starts a call: records it, signs the ticket the voice server will check, and either hands
   * back the browser's socket address or has the phone provider (Vobiz or Twilio) ring it.
   */
  async start(caller: Caller, input: StartCallInput) {
    const config = await callingBotConfigs.active();
    if (!config) {
      badRequest('The calling bot is not set up yet.');
    }
    const phone = (input.phone ?? '').trim();
    if (input.channel === 'PHONE') {
      if (!canPhone(config)) {
        badRequest('Phone calls are not set up. Try the browser call instead.');
      }
      if (!isE164Phone(phone)) {
        badRequest('Enter the number with its country code, e.g. +919876543210.');
      }
      await enforceLimit(phoneCallsPerCaller, caller.id, 'phone calls');
      await enforceLimit(callsPerNumber, phone, 'calls to this number');
    }
    await enforceLimit(callsPerCaller, caller.id, 'calls');

    const created = await CallingBotCallModel.create({
      channel: input.channel,
      callerId: caller.id,
      callerName: caller.name,
      callerEmail: caller.email,
      phone: input.channel === 'PHONE' ? phone : '',
      languageCode: config.languageCode,
    });
    const call = created.toObject<CallingBotCallRecord>();
    if (input.channel === 'PHONE') {
      await ringPhone(call, phone, config);
      return { call: await this.ownCall(caller, String(call._id)), socketUrl: null };
    }
    const ticket = signCallTicket(config.ticketSecret, String(call._id), BROWSER_TICKET_SECONDS);
    return { call, socketUrl: socketUrl(VOICE_PATHS.browser, ticket) };
  },

  /** One of the caller's own calls — for following a phone call's transcript as it happens. */
  async ownCall(caller: Caller, id: string) {
    const call = await CallingBotCallModel.findOne({
      _id: id,
      callerId: caller.id,
    }).lean<CallingBotCallRecord>();
    if (!call) notFound('Call');
    return call;
  },

  /** The most recent calls, newest first, for Tech > Demos > Calling bot. */
  recent(limit: number) {
    return CallingBotCallModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<CallingBotCallRecord[]>();
  },
};
