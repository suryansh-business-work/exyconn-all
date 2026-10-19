import { DOMAIN } from '@exyconn/regex';

/**
 * Where a company's favicon comes from: Google's favicon service. One https source for every
 * domain at a fixed size, and the company's own server never learns who looked it up. When
 * Google has no icon for a domain it still answers with an image (a generic globe).
 */
const FAVICON_SERVICE = 'https://www.google.com/s2/favicons';
const FAVICON_SIZE = '64';

/** The address of an uploaded logo or picture, only when it is a valid https URL; else empty. */
export function safeImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!URL.canParse(trimmed)) {
    return '';
  }
  const parsed = new URL(trimmed);
  return parsed.protocol === 'https:' ? parsed.href : '';
}

/** The favicon of a bare domain such as `acme.com`; empty when the domain is not a valid one. */
export function faviconUrl(domain: string): string {
  const host = domain.trim().toLowerCase();
  if (!DOMAIN.test(host)) {
    return '';
  }
  const query = new URLSearchParams({ domain: host, sz: FAVICON_SIZE });
  return `${FAVICON_SERVICE}?${query.toString()}`;
}

/** The images to try for an avatar, best first: the uploaded picture, then the favicon. */
export function avatarSources(src: string, domain: string): string[] {
  return [safeImageUrl(src), faviconUrl(domain)].filter(Boolean);
}
