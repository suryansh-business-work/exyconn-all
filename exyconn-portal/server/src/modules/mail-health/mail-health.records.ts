import { mxHosts, txtRecords } from './mail-health.dns';
import { result, type CheckResult, type MailboxProvider } from './mail-health.types';

/** Where each provider publishes its DKIM key; Microsoft rotates between two. */
const DKIM_SELECTORS: Readonly<Record<MailboxProvider, string[]>> = {
  GMAIL: ['google'],
  MICROSOFT: ['selector1', 'selector2'],
};

const DKIM_FIX: Readonly<Record<MailboxProvider, string>> = {
  GMAIL:
    'In Google Admin, open Apps > Google Workspace > Gmail > Authenticate email, generate a key, add the TXT record it shows, then click Start authentication.',
  MICROSOFT:
    'In Microsoft Defender, open Email & collaboration > Policies > Email authentication settings > DKIM, add the two CNAME records it shows for the domain, then enable signing.',
};

async function hasDkimKey(domain: string, provider: MailboxProvider): Promise<boolean> {
  for (const selector of DKIM_SELECTORS[provider]) {
    const records = await txtRecords(`${selector}._domainkey.${domain}`);
    if (records.some((record) => /(^|;)\s*p=[^;\s]+/i.test(record))) return true;
  }
  return false;
}

/** DKIM: a published key for every provider the domain's mailboxes send through. */
export async function checkDkim(
  domain: string,
  providers: MailboxProvider[],
): Promise<CheckResult> {
  const missing: MailboxProvider[] = [];
  for (const provider of providers) {
    if (!(await hasDkimKey(domain, provider))) missing.push(provider);
  }
  if (missing.length === 0) return result('PASS', 'DKIM is set up.');
  const status = missing.length === providers.length ? 'FAIL' : 'WARN';
  return result(status, 'No DKIM key is published for your mail provider.', {
    fix: missing.map((provider) => DKIM_FIX[provider]).join('\n'),
    record: missing.map((provider) => DKIM_SELECTORS[provider].join(', ')).join('; '),
  });
}

/** The policy a DMARC record asks receivers to apply. */
const policyOf = (record: string) => /(^|;)\s*p\s*=\s*(\w+)/i.exec(record)?.[2]?.toLowerCase();

/** DMARC: one record at _dmarc, asking receivers to act on mail that fails. */
export async function checkDmarc(domain: string): Promise<CheckResult> {
  const records = (await txtRecords(`_dmarc.${domain}`)).filter((record) =>
    record.toLowerCase().startsWith('v=dmarc1'),
  );
  if (records.length === 0) {
    return result('FAIL', 'The domain has no DMARC record.', {
      fix: 'Add this TXT record at _dmarc on the domain. Start with p=none, then tighten to p=quarantine once the reports look clean.',
      suggested: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
    });
  }
  const [record] = records;
  if (records.length > 1) {
    return result(
      'FAIL',
      'The domain has more than one DMARC record, so receivers ignore all of them.',
      {
        fix: 'Keep a single TXT record at _dmarc.',
        record: records.join('\n'),
      },
    );
  }
  if (policyOf(record) === 'none') {
    return result('WARN', 'DMARC only monitors (p=none), so spoofed mail is still delivered.', {
      fix: 'Once the reports show only your own mail passing, change p=none to p=quarantine.',
      record,
    });
  }
  return result('PASS', 'DMARC is set up.', { record });
}

/** MX: somewhere for replies and bounces to go. */
export async function checkMx(domain: string): Promise<CheckResult> {
  const hosts = await mxHosts(domain);
  if (hosts.length === 0) {
    return result('FAIL', 'The domain has no MX record, so replies and bounces cannot reach it.', {
      fix: 'Add the MX records your mail provider gives you.',
    });
  }
  return result('PASS', 'The domain receives mail.', { record: hosts.join(', ') });
}
