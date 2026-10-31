import { txtRecords } from './mail-health.dns';
import { result, type CheckResult, type MailboxProvider } from './mail-health.types';

/** The include each provider's sending servers are published under. */
export const PROVIDER_SPF_INCLUDE: Readonly<Record<MailboxProvider, string>> = {
  GMAIL: '_spf.google.com',
  MICROSOFT: 'spf.protection.outlook.com',
};

/** RFC 7208: a receiver gives up on SPF after ten DNS-querying terms. */
const MAX_LOOKUPS = 10;
/** Terms that cost a DNS lookup. */
const LOOKUP_TERM = /^[+\-~?]?(include:|a\b|mx\b|ptr\b|exists:|redirect=)/i;
const NESTED_TERM = /^[+\-~?]?(?:include:|redirect=)(.+)$/i;

const spfOf = (records: string[]) =>
  records.filter((record) => record.toLowerCase().startsWith('v=spf1'));

interface SpfWalk {
  includes: Set<string>;
  lookups: number;
}

/** Follows include: and redirect= through the record, counting lookups the way a receiver does. */
async function walk(record: string, state: SpfWalk, depth: number): Promise<void> {
  for (const term of record.split(/\s+/).slice(1)) {
    if (LOOKUP_TERM.test(term)) state.lookups += 1;
    const nested = NESTED_TERM.exec(term)?.[1]?.toLowerCase();
    if (!nested || state.lookups > MAX_LOOKUPS || depth >= MAX_LOOKUPS) continue;
    state.includes.add(nested);
    const [child] = spfOf(await txtRecords(nested));
    if (child) await walk(child, state, depth + 1);
  }
}

/** The record with each missing provider's include put in front of its `all`. */
function withIncludes(record: string, missing: string[]): string {
  const terms = record.split(/\s+/);
  const allAt = terms.findIndex((term) => /^[+\-~?]?all$/i.test(term));
  const at = allAt === -1 ? terms.length : allAt;
  return [...terms.slice(0, at), ...missing.map((m) => `include:${m}`), ...terms.slice(at)].join(
    ' ',
  );
}

/**
 * How the record ends: `+all` lets anyone send, `?all` or nothing protects nothing. A record
 * with redirect= and no `all` takes its ending from the record it redirects to.
 */
function qualifierProblem(record: string): CheckResult | null {
  const all = /(^|\s)([+\-~?]?)all\s*$/i.exec(record);
  if (!all && /(^|\s)redirect=/i.test(record)) return null;
  if (all?.[2] === '+') {
    return result('FAIL', 'SPF allows every server on the internet to send as this domain.', {
      fix: 'Replace +all at the end of the record with ~all.',
      record,
    });
  }
  if (!all || all[2] === '?') {
    return result('WARN', 'SPF ends neutral, so it does not stop anyone sending as this domain.', {
      fix: 'End the record with ~all.',
      record,
    });
  }
  return null;
}

/** SPF: one record, within ten lookups, naming every provider the domain's mailboxes use. */
export async function checkSpf(domain: string, providers: MailboxProvider[]): Promise<CheckResult> {
  const records = spfOf(await txtRecords(domain));
  const includes = providers.map((provider) => PROVIDER_SPF_INCLUDE[provider]);
  if (records.length === 0) {
    return result('FAIL', 'The domain has no SPF record.', {
      fix: 'Add this TXT record at the root of the domain.',
      suggested: withIncludes('v=spf1 ~all', includes),
    });
  }
  const [record] = records;
  if (records.length > 1) {
    return result(
      'FAIL',
      'The domain has more than one SPF record, so receivers ignore all of them.',
      {
        fix: 'Merge them into a single TXT record.',
        record: records.join('\n'),
      },
    );
  }
  const state: SpfWalk = { includes: new Set(), lookups: 0 };
  await walk(record, state, 0);
  if (state.lookups > MAX_LOOKUPS) {
    return result('FAIL', 'SPF needs more than 10 DNS lookups, so receivers treat it as broken.', {
      fix: 'Remove includes for services you no longer send from.',
      record,
    });
  }
  const missing = includes.filter((include) => !state.includes.has(include));
  if (missing.length > 0) {
    return result('WARN', 'SPF does not name your mail provider’s servers.', {
      fix: 'Replace the TXT record with this one.',
      record,
      suggested: withIncludes(record, missing),
    });
  }
  return qualifierProblem(record) ?? result('PASS', 'SPF is set up.', { record });
}
