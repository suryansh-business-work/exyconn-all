import { isEmailAddress } from '../../utils/emailAddress';
import { logger } from '../../utils/logger';
import { safeFetch, UnsafeUrlError } from '../../utils/safeFetch';
import { inSequence } from '../../utils/inSequence';
import { robotsAllows } from './robots';

/**
 * The lead generator's "find emails" step: reads a business's own website — its home page and at
 * most two contact/about pages linked from it — and returns the addresses published there.
 *
 * Every request goes through safeFetch, so only http(s) to public addresses is made (no
 * localhost, private ranges or cloud metadata, re-checked on every redirect), with a timeout and
 * a size cap. robots.txt is honoured: a site that disallows a page is not read.
 * Ported from exyconn-tools' contact extractor (linear email scan, no backtracking regex).
 */

export const CRAWLER_AGENT = 'ExyconnLeadBot';
export const USER_AGENT = `Mozilla/5.0 (compatible; ${CRAWLER_AGENT}/1.0; +https://exyconn.com)`;
const PAGE_TIMEOUT_MS = 8000;
const PAGE_MAX_BYTES = 1024 * 1024;
const ROBOTS_MAX_BYTES = 128 * 1024;
const MAX_EXTRA_PAGES = 2;
const MAX_EMAILS = 10;

export type WebsiteEmailStatus = 'FOUND' | 'NONE' | 'BLOCKED' | 'UNREACHABLE';

export interface WebsiteEmailResult {
  emails: string[];
  status: WebsiteEmailStatus;
  /** Why, in one line, when nothing was found. */
  message: string;
}

const LOCAL_CHAR = /[\w.%+-]/;
const DOMAIN_CHAR = /[a-z\d.-]/i;
const LETTER = /[a-z]/i;

function runEnd(text: string, from: number, kind: RegExp): number {
  let end = from;
  while (end < text.length && kind.test(text[end])) {
    end += 1;
  }
  return end;
}

function localStart(text: string, to: number, floor: number): number {
  let start = to;
  while (start > floor && LOCAL_CHAR.test(text[start - 1])) {
    start -= 1;
  }
  return start;
}

/** Where the address whose domain run is text[from, end) stops, or -1 when it has no TLD. */
function addressEnd(text: string, from: number, end: number): number {
  for (let dot = end - 3; dot > from; dot -= 1) {
    if (text[dot] === '.' && LETTER.test(text[dot + 1]) && LETTER.test(text[dot + 2])) {
      return runEnd(text, dot + 1, LETTER);
    }
  }
  return -1;
}

/** Every `name@domain.tld` in the text, in one linear pass. */
export function findEmails(text: string): string[] {
  const found: string[] = [];
  let searchFrom = 0;
  let at = text.indexOf('@');
  while (at >= 0) {
    const start = localStart(text, at, searchFrom);
    const domainEnd = runEnd(text, at + 1, DOMAIN_CHAR);
    const end = start < at ? addressEnd(text, at + 1, domainEnd) : -1;
    if (end >= 0) {
      found.push(text.slice(start, end));
      searchFrom = end;
      at = text.indexOf('@', end);
    } else {
      at = text.indexOf('@', at + 1);
    }
  }
  return found;
}

/** Asset names that look like addresses (logo@2x.png) and placeholder or tracking domains. */
const NOT_A_MAILBOX = /\.(?:png|jpe?g|gif|svg|webp|css|js)$|@(?:example\.|sentry|wixpress\.com)/i;

/** Drops the dots a sentence wraps around an address ("write to .info@acme.com."). */
function trimDots(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && value[start] === '.') {
    start += 1;
  }
  while (end > start && value[end - 1] === '.') {
    end -= 1;
  }
  return value.slice(start, end);
}

/** The real, distinct addresses in a page's HTML: mailto links and plain text alike. */
export function emailsInHtml(html: string): string[] {
  const decoded = html.replaceAll('&#64;', '@').replaceAll('%40', '@');
  const emails = findEmails(decoded)
    .map((email) => trimDots(email.toLowerCase()))
    .filter((email) => isEmailAddress(email) && !NOT_A_MAILBOX.test(email));
  return [...new Set(emails)];
}

const LINK_HREF = /href=["']([^"'#\s]+)["']/gi;
const CONTACT_WORDS = /contact|about|impressum|kontakt/i;

/** Up to two same-site pages whose address says contact / about. */
export function contactPages(html: string, base: URL): URL[] {
  const pages = new Map<string, URL>();
  for (const [, href] of html.matchAll(LINK_HREF)) {
    if (!CONTACT_WORDS.test(href)) {
      continue;
    }
    let url: URL;
    try {
      url = new URL(href, base);
    } catch {
      continue;
    }
    if (url.hostname === base.hostname && url.pathname !== base.pathname) {
      pages.set(url.pathname, url);
    }
  }
  return [...pages.values()].slice(0, MAX_EXTRA_PAGES);
}

/** The site's start URL: http(s) only, no credentials. Anything else is refused up front. */
export function siteUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new UnsafeUrlError('Enter a valid website address');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new UnsafeUrlError('Only http and https websites can be read');
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError('A URL must not carry a username or password');
  }
  return url;
}

const fetchOptions = (maxBytes: number) => ({
  allowHttp: true,
  timeoutMs: PAGE_TIMEOUT_MS,
  maxBytes,
});

/** The site's robots.txt, or '' when it has none (or it cannot be read, which allows all). */
async function robotsOf(origin: string): Promise<string> {
  try {
    const response = await safeFetch(
      `${origin}/robots.txt`,
      { headers: { 'User-Agent': USER_AGENT } },
      fetchOptions(ROBOTS_MAX_BYTES),
    );
    return response.ok ? await response.text() : '';
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      throw error;
    }
    return '';
  }
}

/** A page's HTML, or null when it failed. Unsafe addresses still throw. */
async function pageHtml(url: URL): Promise<string | null> {
  try {
    const response = await safeFetch(
      url.toString(),
      { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' } },
      fetchOptions(PAGE_MAX_BYTES),
    );
    return response.ok ? await response.text() : null;
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      throw error;
    }
    logger.warn({ err: error, url: url.origin }, 'Lead generator could not read a page');
    return null;
  }
}

const result = (status: WebsiteEmailStatus, message: string, emails: string[] = []) => ({
  emails,
  status,
  message,
});

/** Reads the website politely and safely, and returns the addresses it publishes. */
export async function findWebsiteEmails(website: string): Promise<WebsiteEmailResult> {
  const start = siteUrl(website);
  const robots = await robotsOf(start.origin);
  const allowed = (url: URL) => robotsAllows(robots, CRAWLER_AGENT, url.pathname);
  if (!allowed(start)) {
    return result('BLOCKED', 'The website asks crawlers not to read this page');
  }
  const home = await pageHtml(start);
  if (home === null) {
    return result('UNREACHABLE', 'The website did not answer');
  }
  const found = new Set(emailsInHtml(home));
  // One page at a time: a polite crawler never hits a small site with parallel requests.
  const pages = await inSequence(contactPages(home, start).filter(allowed), pageHtml);
  for (const html of pages) {
    for (const email of html ? emailsInHtml(html) : []) {
      found.add(email);
    }
  }
  const emails = [...found].slice(0, MAX_EMAILS);
  if (emails.length === 0) {
    return result('NONE', 'No email address is published on the website');
  }
  return result('FOUND', '', emails);
}
