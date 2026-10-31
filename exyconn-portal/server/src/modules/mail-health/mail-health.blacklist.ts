import { aRecords } from './mail-health.dns';
import { result, type CheckResult } from './mail-health.types';

/** Domain blocklists receivers check links and senders against. */
const BLOCKLISTS = [
  { name: 'Spamhaus DBL', zone: 'dbl.spamhaus.org' },
  { name: 'SURBL', zone: 'multi.surbl.org' },
  { name: 'URIBL', zone: 'multi.uribl.com' },
] as const;

type Listing = 'CLEAN' | 'LISTED' | 'UNKNOWN';

/**
 * A blocklist answers "not listed" with no record. 127.0.0.1 (SURBL, URIBL) and 127.255.255.x
 * (Spamhaus) mean the list refused the query — usually because it came through a big public
 * resolver — so they say nothing about the domain.
 */
function readAnswer(addresses: string[]): Listing {
  if (addresses.length === 0) return 'CLEAN';
  const refused = addresses.every(
    (address) => address === '127.0.0.1' || address.startsWith('127.255.255.'),
  );
  return refused ? 'UNKNOWN' : 'LISTED';
}

async function lookup(domain: string, zone: string): Promise<Listing> {
  try {
    return readAnswer(await aRecords(`${domain}.${zone}`));
  } catch {
    return 'UNKNOWN';
  }
}

/** Blacklist: the domain on none of the lists; a list that would not answer is not counted. */
export async function checkBlacklists(domain: string): Promise<CheckResult> {
  const answers = await Promise.all(
    BLOCKLISTS.map(async (list) => ({ name: list.name, listing: await lookup(domain, list.zone) })),
  );
  const named = (listing: Listing) =>
    answers.filter((answer) => answer.listing === listing).map((answer) => answer.name);
  const listed = named('LISTED');
  if (listed.length > 0) {
    return result('FAIL', 'The domain is on a blocklist.', {
      fix: 'Look the domain up on the list’s own site to see why, fix the cause (often a compromised account or a bought list), then request removal there.',
      record: listed.join(', '),
    });
  }
  const unchecked = named('UNKNOWN');
  if (unchecked.length === BLOCKLISTS.length) {
    return result('UNKNOWN', 'The blocklists refused the lookup from this server.');
  }
  return result('PASS', 'The domain is not on any blocklist checked.', {
    record: unchecked.length > 0 ? `Not checked: ${unchecked.join(', ')}` : '',
  });
}
