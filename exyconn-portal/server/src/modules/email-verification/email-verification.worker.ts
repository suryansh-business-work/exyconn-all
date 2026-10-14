import { forEachOrganization } from '../organizations';
import { registerBackgroundJob } from '../tech/jobs.registry';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { logger } from '../../utils/logger';
import { currentOrganizationId } from '../../lib/tenant/tenant-scope';
import { runBatchPass } from './email-verification.service';

/** A pass checks a dozen addresses; the next starts once it is done, at most this often. */
const TICK_MS = 10_000;

/** Companies with a pass still running, so a slow pass is never overlapped by the next tick. */
const running = new Set<string>();

/** One pass for the company in scope, unless its previous pass is still going. */
export async function verifyQueuedEmails(): Promise<void> {
  const organization = currentOrganizationId() ?? '';
  if (running.has(organization)) {
    return;
  }
  running.add(organization);
  try {
    const checked = await runBatchPass();
    recordJobRun(JOB_KEYS.emailVerification, `Checked ${checked} addresses from bulk uploads`);
  } finally {
    running.delete(organization);
  }
}

export function startEmailVerification(): void {
  const tick = () => {
    forEachOrganization(verifyQueuedEmails, 'Email verification').catch((error: unknown) =>
      logger.error(error, 'Email verification pass failed'),
    );
  };
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Email verification started');
}

registerBackgroundJob({
  key: JOB_KEYS.emailVerification,
  label: 'Email verification',
  description: 'Works through bulk email checks uploaded in CRM > Tools > Email verifier.',
  runOnce: verifyQueuedEmails,
});
