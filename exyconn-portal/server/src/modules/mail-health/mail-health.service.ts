import { env } from '../../config/env';
import { ROLES } from '../../constants/roles';
import { notFound } from '../../utils/errors';
import { UserModel } from '../admin/user.model';
import { GmailAccountModel } from '../gmail/gmail.models';
import { ORG_MAILBOXES } from '../gmail/gmail.accounts';
import { MicrosoftMailAccountModel } from '../microsoft-mail/microsoft.models';
import { notifyBestEffort } from '../notifications/notifications.service';
import { runHealthChecks, setupScore } from './mail-health.checks';
import { MailDomainHealthModel, type MailDomainHealthDocument } from './mail-health.model';
import type { MailboxProvider } from './mail-health.types';

/** A domain the company's CRM mailboxes send from, with who sends from it. */
interface SendingDomain {
  domain: string;
  providers: MailboxProvider[];
  mailboxes: string[];
}

const domainOf = (email: string) => email.slice(email.lastIndexOf('@') + 1).toLowerCase();

/** Every domain the company's CRM mailboxes (Gmail and Microsoft) are on, by name. */
export async function sendingDomains(): Promise<SendingDomain[]> {
  const [gmail, microsoft] = await Promise.all([
    GmailAccountModel.find(ORG_MAILBOXES).select('email').lean(),
    MicrosoftMailAccountModel.find(ORG_MAILBOXES).select('email').lean(),
  ]);
  const byDomain = new Map<string, SendingDomain>();
  const add = (email: string, provider: MailboxProvider) => {
    const domain = domainOf(email);
    const entry = byDomain.get(domain) ?? { domain, providers: [], mailboxes: [] };
    if (!entry.providers.includes(provider)) entry.providers.push(provider);
    entry.mailboxes.push(email);
    byDomain.set(domain, entry);
  };
  gmail.forEach((account) => add(account.email, 'GMAIL'));
  microsoft.forEach((account) => add(account.email, 'MICROSOFT'));
  const domains = [...byDomain.values()];
  domains.sort((a, b) => a.domain.localeCompare(b.domain));
  return domains;
}

/** A sending domain with its last check, which is null until it has been checked once. */
export type DomainHealth = SendingDomain & { health: MailDomainHealthDocument | null };

/** The company's sending domains with their last checks. */
export async function listDomainHealth(): Promise<DomainHealth[]> {
  const domains = await sendingDomains();
  const rows = await MailDomainHealthModel.find({
    domain: { $in: domains.map((entry) => entry.domain) },
  }).lean<MailDomainHealthDocument[]>();
  const byDomain = new Map(rows.map((row) => [row.domain, row]));
  return domains.map((entry) => ({ ...entry, health: byDomain.get(entry.domain) ?? null }));
}

/** Checks one sending domain now and keeps the result, with the score it replaces. */
async function checkSendingDomain(entry: SendingDomain, now: Date): Promise<DomainHealth> {
  const checks = await runHealthChecks(entry.domain, entry.providers);
  const previous = await MailDomainHealthModel.findOne({ domain: entry.domain })
    .select('score')
    .lean();
  const health = await MailDomainHealthModel.findOneAndUpdate(
    { domain: entry.domain },
    { score: setupScore(checks), previousScore: previous?.score ?? null, checks, checkedAt: now },
    { upsert: true, new: true, lean: true },
  ).lean<MailDomainHealthDocument>();
  return { ...entry, health };
}

/** "Check health" on a row: only a domain the company's own mailboxes send from. */
export async function checkDomainHealth(domain: string): Promise<DomainHealth> {
  const entry = (await sendingDomains()).find((candidate) => candidate.domain === domain);
  if (!entry) notFound('Sending domain');
  return checkSendingDomain(entry, new Date());
}

/** Where an alert points: CRM > Integrations > Email. */
const healthLink = () => `${env.crmUrl}/integrations/email`;

/** Tells the company's admins a domain's score went down, and what it is now. */
async function alertDrop(result: DomainHealth): Promise<void> {
  const health = result.health;
  if (health?.previousScore == null || health.score >= health.previousScore) return;
  const admins = await UserModel.find({ roles: ROLES.ADMIN, isActive: true }).select('_id').lean();
  const failing = health.checks.filter((check) => check.status === 'FAIL').map((c) => c.code);
  const body =
    `Setup Score for ${result.domain} fell from ${health.previousScore} to ${health.score}.` +
    (failing.length > 0 ? ` Failing: ${failing.join(', ')}.` : '');
  await Promise.all(
    admins.map((admin) =>
      notifyBestEffort(String(admin._id), {
        kind: 'CRM',
        title: 'Mailbox health dropped',
        body,
        link: healthLink(),
      }),
    ),
  );
}

/** A domain checked in this window is not checked again, so the hourly ticks run it once a day. */
const RECHECK_AFTER_MS = 20 * 60 * 60 * 1000;

/**
 * One company's daily pass: every sending domain not checked in the last 20 hours is checked
 * and, when its score went down, the admins are told. Idempotent: a second pass right after
 * finds every domain freshly checked and does nothing. Returns how many domains it checked.
 */
export async function runDailyHealthChecks(now = new Date()): Promise<number> {
  const due = new Date(now.getTime() - RECHECK_AFTER_MS);
  const fresh = await MailDomainHealthModel.find({ checkedAt: { $gte: due } })
    .select('domain')
    .lean();
  const skip = new Set(fresh.map((row) => row.domain));
  const domains = (await sendingDomains()).filter((entry) => !skip.has(entry.domain));
  for (const entry of domains) {
    await alertDrop(await checkSendingDomain(entry, now));
  }
  return domains.length;
}
