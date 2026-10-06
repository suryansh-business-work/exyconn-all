import { registerBackgroundJob } from '../tech/jobs.registry';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { logger } from '../../utils/logger';
import { ChatMessageModel, ChatSessionModel } from './models';
import { answerQuestion } from './chat.bot';
import { postMessage } from './chat.messages';
import { asChatOwner } from './chat.owner';
import { readChatSettings } from './chat.settings';
import { closeSession } from './chat.session';

const TICK_MS = 15_000;
/** Sessions one pass hands over; the rest wait for the next tick. */
const BATCH = 50;

/**
 * Hands an unanswered live question to the knowledge bot, in the same thread: the visitor is
 * told why, and the bot answers what nobody on the team has. Nothing is copied to the
 * Knowledge Bot tab — each thread holds only what was asked in it. The team can still reply.
 *
 * Claimed atomically (the reply clock is cleared in the same write that finds it running), so
 * a sweep and an offline message racing each other hand a question over once.
 */
export async function handOff(sessionId: string, notice: string): Promise<void> {
  const session = await ChatSessionModel.findOneAndUpdate(
    { _id: sessionId, status: 'OPEN', awaitingReplySince: { $ne: null } },
    { $set: { awaitingReplySince: null, handedOffAt: new Date() } },
  ).lean();
  if (!session?.awaitingReplySince) {
    return;
  }
  const pending = await ChatMessageModel.find({
    sessionId,
    channel: 'LIVE',
    sender: 'VISITOR',
    createdAt: { $gte: session.awaitingReplySince },
  })
    .sort({ createdAt: 1 })
    .select('body')
    .lean();
  await postMessage({ sessionId, channel: 'LIVE', sender: 'SYSTEM', senderName: '', body: notice });
  const question = pending
    .map((message) => message.body)
    .filter(Boolean)
    .join('\n');
  if (question !== '') {
    await answerQuestion(sessionId, question, 'LIVE');
  }
}

/** Closes every open chat nobody has written in for the settings' session timeout. */
export async function closeExpiredSessions(timeoutMinutes: number): Promise<number> {
  const expired = await ChatSessionModel.find({ status: 'OPEN', expiresAt: { $lte: new Date() } })
    .select('_id')
    .limit(BATCH)
    .lean();
  for (const session of expired) {
    await closeSession(
      String(session._id),
      'Session timeout',
      `This chat ended after ${timeoutMinutes} minutes without a message. Start a new chat any time.`,
    );
  }
  return expired.length;
}

/**
 * One pass: every open session whose visitor has waited longer than the settings allow goes to
 * the bot, and every chat past its session timeout is closed.
 */
export async function sweepHandoffs(): Promise<void> {
  const settings = await readChatSettings();
  const cutoff = new Date(Date.now() - settings.noReplyTimeoutSeconds * 1000);
  const due = await ChatSessionModel.find({
    status: 'OPEN',
    awaitingReplySince: { $ne: null, $lte: cutoff },
  })
    .select('_id')
    .limit(BATCH)
    .lean();
  for (const session of due) {
    await handOff(String(session._id), settings.handoffMessage);
  }
  const closed = await closeExpiredSessions(settings.sessionTimeoutMinutes);
  recordJobRun(
    JOB_KEYS.websiteChatHandoff,
    `Handed ${due.length} website chats to the bot, closed ${closed} timed out`,
  );
}

export function startChatHandoff(): void {
  const tick = () => {
    asChatOwner(sweepHandoffs).catch((error: unknown) =>
      logger.error(error, 'Website chat handoff pass failed'),
    );
  };
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Website chat handoff started');
}

registerBackgroundJob({
  key: JOB_KEYS.websiteChatHandoff,
  label: 'Website chat handoff and timeouts',
  description:
    'Passes website chat questions nobody on the team answered in time to the knowledge bot, and closes chats past their session timeout.',
  runOnce: sweepHandoffs,
});
