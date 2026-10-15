import { Types } from 'mongoose';
import {
  isFinished,
  readCallTicket,
  withScenario,
  type CallingBotCallRecord,
  type CallingBotScenarioRecord,
  type CallingBotConfigRecord,
  type CallStatus,
  type TurnRole,
} from '../index';
import { CallModel, ConfigModel, ScenarioModel } from './db';

/** How long the active config is reused before it is read again. */
const CONFIG_TTL_MS = 15_000;

let cached: { config: CallingBotConfigRecord | null; at: number } | null = null;

/** The active config, read at most every few seconds; null when none is active. */
export async function activeConfig(): Promise<CallingBotConfigRecord | null> {
  if (cached && Date.now() - cached.at < CONFIG_TTL_MS) {
    return cached.config;
  }
  const config = await ConfigModel.findOne({ isActive: true }).lean<CallingBotConfigRecord>();
  cached = { config, at: Date.now() };
  return config;
}

/** The example a call was started with, or null when it had none (or it was deleted since). */
async function scenarioOf(call: CallingBotCallRecord): Promise<CallingBotScenarioRecord | null> {
  if (!call.scenarioId || !Types.ObjectId.isValid(call.scenarioId)) {
    return null;
  }
  return ScenarioModel.findById(call.scenarioId).lean<CallingBotScenarioRecord>();
}

/**
 * What a ticket opens: the call it names and the config it runs on — the one the ticket was
 * signed with, playing the call's example when it has one.
 */
export interface TicketedCall {
  call: CallingBotCallRecord;
  config: CallingBotConfigRecord;
}

/**
 * The call a ticket opens, when the ticket is genuine, unexpired and names a call that is
 * not over. Null in every other case — the caller learns nothing about why.
 */
export async function callForTicket(ticket: string): Promise<TicketedCall | null> {
  const config = await activeConfig();
  const claims = config ? readCallTicket(config.ticketSecret, ticket) : null;
  if (!config || !claims || !Types.ObjectId.isValid(claims.callId)) {
    return null;
  }
  const call = await CallModel.findById(claims.callId).lean<CallingBotCallRecord>();
  if (!call || isFinished(call.status)) {
    return null;
  }
  return { call, config: withScenario(config, await scenarioOf(call)) };
}

const callId = (call: CallingBotCallRecord): string => String(call._id);

/** Moves a call on, unless it has already finished. */
export async function setStatus(
  call: CallingBotCallRecord,
  status: CallStatus,
  extra: Partial<Pick<CallingBotCallRecord, 'answeredAt' | 'providerCallId'>> = {},
): Promise<void> {
  await CallModel.updateOne(
    { _id: callId(call), status: { $nin: ['ENDED', 'FAILED'] } },
    { status, ...extra },
  );
}

/** Adds one thing said to the call's transcript. */
export async function addTurn(
  call: CallingBotCallRecord,
  role: TurnRole,
  text: string,
): Promise<void> {
  await CallModel.updateOne(
    { _id: callId(call) },
    { $push: { transcript: { role, text, at: new Date() } } },
  );
}

/** Ends a call once: the first reason recorded is the one kept. */
export async function endCall(
  call: CallingBotCallRecord,
  status: 'ENDED' | 'FAILED',
  reason: string,
): Promise<void> {
  await CallModel.updateOne(
    { _id: callId(call), status: { $nin: ['ENDED', 'FAILED'] } },
    { status, endReason: reason, endedAt: new Date() },
  );
}
