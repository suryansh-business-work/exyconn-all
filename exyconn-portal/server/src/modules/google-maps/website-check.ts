import { mapWithConcurrency } from '../../utils/concurrency';
import { logger } from '../../utils/logger';
import { safeFetch, UnsafeUrlError } from '../../utils/safeFetch';
import { domainOf } from './lead-row';
import { USER_AGENT } from './website-emails';

/**
 * Before a lead is filed, the website Google Places lists for it is visited once: only a site
 * whose final answer (after redirects) is 2xx is saved on the company, with its domain and
 * favicon. A dead, parked or private address is dropped, so the CRM never holds a website
 * nobody can open or a blank favicon for it.
 *
 * Every request goes through safeFetch: http(s) only, public addresses only (re-checked on
 * every redirect), a short timeout and a size cap.
 */

const CHECK_TIMEOUT_MS = 5000;
const CHECK_CONCURRENCY = 8;
const MAX_REDIRECTS = 5;
/** A GET fallback reads the page only for its status; this caps what it downloads. */
const PAGE_MAX_BYTES = 5 * 1024 * 1024;
const FAVICON_MAX_BYTES = 256 * 1024;

/** The favicon service the CRM shows company icons from (see the CRM app's avatarSources). */
const FAVICON_SERVICE = 'https://www.google.com/s2/favicons';
const FAVICON_SIZE = '64';

export interface WebsiteCheck {
  /** The site answered 2xx: its website, domain and favicon may be saved. */
  ok: boolean;
  /** Why it was dropped, in one line; empty when it is ok. */
  reason: string;
  /** The favicon to save as the company logo; empty unless it answered 2xx with an image. */
  logoUrl: string;
}

const isSuccess = (status: number) => status >= 200 && status < 300;

const options = (maxBytes: number) => ({
  allowHttp: true,
  timeoutMs: CHECK_TIMEOUT_MS,
  maxBytes,
  maxRedirects: MAX_REDIRECTS,
});

async function statusOf(url: string, method: 'HEAD' | 'GET'): Promise<number> {
  const response = await safeFetch(
    url,
    { method, headers: { 'User-Agent': USER_AGENT } },
    options(PAGE_MAX_BYTES),
  );
  return response.status;
}

/** The site's final status: HEAD first, then GET when HEAD is refused or not answered 2xx. */
async function finalStatus(url: string): Promise<number> {
  const head = await statusOf(url, 'HEAD');
  return isSuccess(head) ? head : statusOf(url, 'GET');
}

/** One line on why a request failed; a refused address says why it was refused. */
function failureReason(error: unknown): string {
  if (error instanceof UnsafeUrlError) {
    return error.message;
  }
  const name = (error as { name?: unknown } | null)?.name;
  if (name === 'TimeoutError' || name === 'AbortError') {
    return `No answer within ${CHECK_TIMEOUT_MS / 1000} seconds`;
  }
  return 'The website could not be reached';
}

/** The favicon address the CRM shows for a domain. */
export function faviconUrl(domain: string): string {
  const query = new URLSearchParams({ domain, sz: FAVICON_SIZE });
  return `${FAVICON_SERVICE}?${query.toString()}`;
}

/**
 * The domain's favicon when one exists, else ''. Google answers a domain it has no icon for
 * with a generic globe and a 404, so only a 2xx image counts.
 */
async function faviconOf(domain: string): Promise<string> {
  const url = faviconUrl(domain);
  try {
    const response = await safeFetch(url, {}, { ...options(FAVICON_MAX_BYTES), allowHttp: false });
    const type = response.headers.get('content-type') ?? '';
    return response.ok && type.startsWith('image/') ? url : '';
  } catch (error) {
    logger.debug({ domain, reason: failureReason(error) }, 'Lead favicon check failed');
    return '';
  }
}

/** Visits one website and says whether it may be saved, with its favicon. Never rejects. */
export async function checkWebsite(website: string): Promise<WebsiteCheck> {
  let status: number;
  try {
    status = await finalStatus(website);
  } catch (error) {
    return { ok: false, reason: failureReason(error), logoUrl: '' };
  }
  if (!isSuccess(status)) {
    return { ok: false, reason: `Answered ${status} instead of 200 OK`, logoUrl: '' };
  }
  return { ok: true, reason: '', logoUrl: await faviconOf(domainOf(website)) };
}

/** Checks each distinct website, a few at a time; the result is keyed by website. */
export async function checkWebsites(
  websites: readonly string[],
): Promise<Map<string, WebsiteCheck>> {
  const distinct = [...new Set(websites.filter(Boolean))];
  const checks = await mapWithConcurrency(distinct, CHECK_CONCURRENCY, checkWebsite);
  return new Map(distinct.map((website, index) => [website, checks[index]]));
}
