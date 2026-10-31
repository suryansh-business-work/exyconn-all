/**
 * One call with the bot: who rang, over what, how it went and what was said. Written by the
 * portal server when a call is asked for and by the voice server while it runs.
 */
export const CALLING_BOT_CALL_MODEL = 'CallingBotCall';

export const CALL_CHANNELS = ['BROWSER', 'PHONE'] as const;
export type CallChannel = (typeof CALL_CHANNELS)[number];

/** STARTING until the audio connects (RINGING while a phone rings), LIVE, then one end state. */
export const CALL_STATUSES = ['STARTING', 'RINGING', 'LIVE', 'ENDED', 'FAILED'] as const;
export type CallStatus = (typeof CALL_STATUSES)[number];

export const TURN_ROLES = ['CALLER', 'BOT'] as const;
export type TurnRole = (typeof TURN_ROLES)[number];

/** One thing said on the call. */
export interface CallTurn {
  role: TurnRole;
  text: string;
  at: Date;
}

export const CALLING_BOT_CALL_FIELDS = {
  channel: { type: String, enum: [...CALL_CHANNELS], required: true },
  status: { type: String, enum: [...CALL_STATUSES], required: true, default: 'STARTING' },
  /** Who asked for the call: a demo visitor (`visitor:<id>`) or a portal user's id. */
  callerId: { type: String, required: true, index: true },
  callerName: { type: String, default: '', trim: true },
  callerEmail: { type: String, default: '', trim: true, lowercase: true },
  /** The number a phone call rang, in E.164; empty for a browser call. */
  phone: { type: String, default: '' },
  languageCode: { type: String, required: true },
  /** The example the caller picked (Agents > Calling bot > Examples); empty for none. */
  scenarioId: { type: String, default: '' },
  /** Its title when the call was made, so the log still reads after the example changes. */
  scenarioTitle: { type: String, default: '', trim: true },
  /** Vobiz's id for a phone call (request_uuid, then the CallUUID it answers with). */
  providerCallId: { type: String, default: '' },
  answeredAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  /** Why the call ended: hung up, time limit, an error message. */
  endReason: { type: String, default: '' },
  transcript: {
    type: [
      {
        _id: false,
        role: { type: String, enum: [...TURN_ROLES], required: true },
        text: { type: String, required: true },
        at: { type: Date, required: true },
      },
    ],
    default: () => [],
  },
};

/** One call as stored. */
export interface CallingBotCallRecord {
  _id: unknown;
  channel: CallChannel;
  status: CallStatus;
  callerId: string;
  callerName: string;
  callerEmail: string;
  phone: string;
  languageCode: string;
  scenarioId?: string;
  scenarioTitle?: string;
  providerCallId: string;
  answeredAt: Date | null;
  endedAt: Date | null;
  endReason: string;
  transcript: CallTurn[];
  createdAt: Date;
  updatedAt: Date;
}

/** Whether a call is over; nothing more is written to one that is. */
export const isFinished = (status: CallStatus): boolean =>
  status === 'ENDED' || status === 'FAILED';
