import { WhatsappChannelModel } from './channel.model';
import { runAsPlatform } from '../../../../../exyconn-portal/server/src/lib/tenant';
import { logger } from '../../../../../exyconn-portal/server/src/utils/logger';

/**
 * What the number screen shows about delivery: when Meta last reached this server and the last
 * thing that stopped a message or a reply. Without it every failure on the real number is
 * silent — Meta gets its 200, the person gets no answer, and nobody can tell why.
 * Keyed by phone number id because the webhook knows nothing else; runs across companies.
 */
async function update(phoneNumberId: string, change: Record<string, unknown>): Promise<void> {
  await runAsPlatform(() => WhatsappChannelModel.updateOne({ phoneNumberId }, change));
}

/** A message arrived and was accepted; an earlier problem is cleared. */
export function recordInbound(phoneNumberId: string): Promise<void> {
  return update(phoneNumberId, { lastInboundAt: new Date(), lastProblem: '', lastProblemAt: null });
}

export function recordProblem(phoneNumberId: string, problem: string): Promise<void> {
  logger.warn({ phoneNumberId, problem }, 'WhatsApp channel problem');
  return update(phoneNumberId, { lastProblem: problem, lastProblemAt: new Date() });
}

/** Fire-and-forget form for the webhook, which must answer Meta whatever happens here. */
export function noteProblem(phoneNumberId: string, problem: string): void {
  recordProblem(phoneNumberId, problem).catch((error: unknown) =>
    logger.error({ err: error }, 'WhatsApp channel problem could not be recorded'),
  );
}
