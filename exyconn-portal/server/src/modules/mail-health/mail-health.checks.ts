import { checkBlacklists } from './mail-health.blacklist';
import { checkDkim, checkDmarc, checkMx } from './mail-health.records';
import { checkSpf } from './mail-health.spf';
import {
  lookupFailed,
  result,
  type CheckResult,
  type HealthCheck,
  type HealthCheckCode,
  type HealthCheckStatus,
  type MailboxProvider,
} from './mail-health.types';

/** How much each check counts towards the 0–100 Setup Score. */
const WEIGHTS: Readonly<Record<HealthCheckCode, number>> = {
  SPF: 25,
  DKIM: 25,
  DMARC: 20,
  MX: 10,
  BLACKLIST: 20,
};

/** The share of a check's weight each outcome earns; UNKNOWN is left out altogether. */
const EARNED: Readonly<Record<Exclude<HealthCheckStatus, 'UNKNOWN'>, number>> = {
  PASS: 1,
  WARN: 0.5,
  FAIL: 0,
};

/** 0–100 over the checks that could be made; 0 when none could. */
export function setupScore(checks: readonly HealthCheck[]): number {
  let possible = 0;
  let earned = 0;
  for (const check of checks) {
    if (check.status === 'UNKNOWN') continue;
    possible += WEIGHTS[check.code];
    earned += WEIGHTS[check.code] * EARNED[check.status];
  }
  return possible === 0 ? 0 : Math.round((earned / possible) * 100);
}

/**
 * Addresses on the provider's own domain: Google or Microsoft owns its DNS and nobody at the
 * company can change it, so only what can still go wrong for the company is checked.
 */
const PROVIDER_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
]);

const providerManaged = () =>
  Promise.resolve(result('PASS', 'The mail provider manages this for its own domain.'));

const safely = (run: () => Promise<CheckResult>) => run().catch(lookupFailed);

/** Every check on one sending domain, for the providers its mailboxes use. */
export async function runHealthChecks(
  domain: string,
  providers: MailboxProvider[],
): Promise<HealthCheck[]> {
  const managed = PROVIDER_DOMAINS.has(domain);
  const runs: [HealthCheckCode, () => Promise<CheckResult>][] = [
    ['SPF', managed ? providerManaged : () => checkSpf(domain, providers)],
    ['DKIM', managed ? providerManaged : () => checkDkim(domain, providers)],
    ['DMARC', managed ? providerManaged : () => checkDmarc(domain)],
    ['MX', () => checkMx(domain)],
    ['BLACKLIST', () => checkBlacklists(domain)],
  ];
  return Promise.all(runs.map(async ([code, run]) => ({ code, ...(await safely(run)) })));
}
