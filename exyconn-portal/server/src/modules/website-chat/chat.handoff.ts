import { registerBackgroundJob } from '../tech/jobs.registry';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { logger } from '../../utils/logger';
import { ChatMessageModel, ChatSessionModel } from './models';
import { answerQuestion } from './chat.bot';
import { chatHub } from './chat.hub';
import { postMessage } from './chat.messages';
import { asChatOwner } from './chat.owner';
import { readChatSettings } from './chat.settings';

const TICK_MS = 15_000;
/** Sessions one pass hands over; the rest wait for the next tick. */
const BATCH = 50;

/**
 * Moves an unanswered live conversation to the knowledge bot: the visitor is told why, their
 * widget switches to the Knowledge Bot tab, and the questions nobody answered are put to the
 * bot there. The team can still reply in the live thread at any time.
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
  chatHub.toVisitors(sessionId, { t: 'switch', channel: 'KNOWLEDGE' });
  const question = pending
    .map((message) => message.body)
    .filter(Boolean)
    .join('\n');
  if (question === '') {
    return;
  }
  await postMessage({
    sessionId,
    channel: 'KNOWLEDGE',
    sender: 'VISITOR',
    senderName: session.name,
    body: question,
  });
  await answerQuestion(sessionId, question);
}

/** One pass: every open session whose visitor has waited longer than the settings allow. */
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
  recordJobRun(JOB_KEYS.websiteChatHandoff, `Handed ${due.length} website chats to the bot`);
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
  label: 'Website chat handoff',
  description:
    'Passes website chat questions nobody on the team answered in time to the knowledge bot.',
  runOnce: sweepHandoffs,
});
