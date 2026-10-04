import type { PendingPush } from '@exyconn/wa-flow';
import { WhatsappChatModel } from './chat.model';
import type { Sender } from './channel.graph';
import { activeSender } from './channel.service';
import { converse } from './channel.conversation';
import { inTurn } from './channel.queue';
import { toRecord } from './channel.chats';
import { forEachOrganization } from '../../organizations';
import { currentOrganizationId } from '../../../lib/tenant/tenant-scope';
import { registerBackgroundJob } from '../../tech/jobs.registry';
import { JOB_KEYS, recordJobRun } from '../../../utils/jobHeartbeat';
import { logger } from '../../../utils/logger';

/**
 * Reminders a workflow schedules ("your appointment is in an hour") arrive on their own on the
 * real number too. The browser delivers its own while the tab is open; here a loop finds the
 * chats with one due and plays it, in that chat's turn (channel.queue), so it cannot race a
 * message the person is sending at the same moment.
 */
const TICK_MS = 30_000;
/** Chats one pass handles per company; the rest wait for the next tick. */
const BATCH = 50;

async function deliverDue(chatId: string, sender: Sender): Promise<number> {
  let delivered = 0;
  for (;;) {
    const doc = await WhatsappChatModel.findById(chatId).lean();
    const chat = doc ? toRecord(doc) : null;
    const now = Date.now();
    const push = chat?.pending.reduce<PendingPush | undefined>(
      (earliest, p) => (p.at <= now && (!earliest || p.at < earliest.at) ? p : earliest),
      undefined,
    );
    if (!chat || !push) {
      return delivered;
    }
    await converse(chat, { kind: 'push', push }, sender);
    delivered += 1;
  }
}

/** One pass for the company in scope. */
export async function deliverReminders(): Promise<void> {
  const sender = await activeSender();
  if (!sender) {
    return;
  }
  const due = await WhatsappChatModel.find({ nextDueAt: { $lte: new Date() } })
    .select('_id waId')
    .limit(BATCH)
    .lean();
  let delivered = 0;
  for (const chat of due) {
    const key = `${currentOrganizationId() ?? ''}:${chat.waId}`;
    delivered += await inTurn(key, () => deliverDue(String(chat._id), sender));
  }
  recordJobRun(JOB_KEYS.whatsappReminders, `Delivered ${delivered} WhatsApp reminders`);
}

export function startWhatsappReminders(): void {
  const tick = () => {
    forEachOrganization(deliverReminders, 'WhatsApp reminders').catch((error: unknown) =>
      logger.error(error, 'WhatsApp reminder pass failed'),
    );
  };
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('WhatsApp reminders started');
}

registerBackgroundJob({
  key: JOB_KEYS.whatsappReminders,
  label: 'WhatsApp reminders',
  description:
    'Sends the reminders demo workflows schedule to people chatting on the real WhatsApp number.',
  runOnce: deliverReminders,
});
