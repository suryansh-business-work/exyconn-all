import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { logger } from '../../utils/logger';
import { forEachOrganization } from '../organizations';
import { registerBackgroundJob } from '../tech/jobs.registry';
import { runDailyHealthChecks } from './mail-health.service';

/** Hourly ticks; each domain is only re-checked once its last check is 20 hours old. */
const TICK_MS = 60 * 60 * 1000;

async function runOnce(): Promise<void> {
  const checked = await runDailyHealthChecks();
  recordJobRun(JOB_KEYS.mailHealth, `Checked ${checked} sending domain(s)`);
}

/** Starts the daily mailbox health check across every company. */
export function startMailHealthChecks(): void {
  const tick = () => {
    forEachOrganization(runOnce, 'Mailbox health').catch((error: unknown) =>
      logger.error(error, 'Mailbox health check failed'),
    );
  };
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Mailbox health checks started');
}

registerBackgroundJob({
  key: JOB_KEYS.mailHealth,
  label: 'Mailbox health',
  description:
    'Checks SPF, DKIM, DMARC, MX and blocklists for the domains the CRM mailboxes send from, and alerts admins when a score drops.',
  runOnce,
});
