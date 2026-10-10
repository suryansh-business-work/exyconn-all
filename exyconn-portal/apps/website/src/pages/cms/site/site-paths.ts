import { env } from '@exyconn/shell/config/env';

/** Where every site-scoped page lives: /website/s/<site>/<section>. */
export const SITE_BASE = '/website/s';

const SAFE_STORAGE_KEY = 'exyconn.website.lastSite';
/** A record id (a Mongo ObjectId) in a path: switching sites stops before it. */
const RECORD_ID = /^[a-f\d]{24}$/i;

/** `value` without its trailing slashes (a loop: `/\/+$/` is quadratic on a long run of them). */
function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') {
    end -= 1;
  }
  return value.slice(0, end);
}

/** A page of one site: `sitePath('exyconn', 'pages')` → /website/s/exyconn/pages. */
export const sitePath = (slug: string, rest = ''): string =>
  rest ? `${SITE_BASE}/${slug}/${rest}` : `${SITE_BASE}/${slug}`;

/**
 * The same section on another site. A record of the old site (/pages/<id>/edit) does not
 * exist on the new one, so the path keeps only the section in front of the record.
 */
export function switchSitePath(pathname: string, slug: string): string {
  const rest = pathname.startsWith(`${SITE_BASE}/`)
    ? pathname
        .slice(SITE_BASE.length + 1)
        .split('/')
        .slice(1)
    : [];
  const end = rest.findIndex((segment) => RECORD_ID.test(segment));
  const section = end === -1 ? rest : rest.slice(0, end);
  return sitePath(slug, section.join('/'));
}

/** The site last worked on in this browser, so a nav link returns there. */
export function readLastSite(): string | null {
  try {
    return globalThis.localStorage.getItem(SAFE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function rememberSite(slug: string): void {
  try {
    globalThis.localStorage.setItem(SAFE_STORAGE_KEY, slug);
  } catch {
    // Storage blocked (private mode): the default site is used instead.
  }
}

/** The public origin a site is served on: the dev override, else its first domain. */
export function siteOrigin(domains: readonly string[]): string {
  if (env.websiteOrigin) {
    return trimTrailingSlashes(env.websiteOrigin);
  }
  const domain = domains[0];
  return domain ? `https://${domain}` : new URL(env.brandUrl).origin;
}
