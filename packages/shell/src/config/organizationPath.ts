/**
 * Every portal address names the company it shows: `<app>/organization/:slug/<path>`.
 *
 * The prefix is the router's basename, so routes, links and `navigate()` inside an app stay
 * written without it. It is read once, when the page loads: switching company is a full page
 * load, which also leaves nothing of the previous company in the Apollo cache.
 */

const ORGANIZATION_SEGMENT = 'organization';

/** The request header that tells the API which company the address names. */
export const ORGANIZATION_HEADER = 'x-organization';

/** The company handle in `/organization/:slug/...`, or null when the path names none. */
export function organizationSlugOf(pathname: string): string | null {
  const [, segment, slug] = pathname.split('/');
  return segment === ORGANIZATION_SEGMENT && slug ? decodeURIComponent(slug) : null;
}

/** The path prefix for a company, or nothing when no company is named. */
export function organizationBasename(slug: string | null): string {
  return slug ? `/${ORGANIZATION_SEGMENT}/${encodeURIComponent(slug)}` : '';
}

/**
 * Where this app is mounted on its origin, without the trailing slash: empty for an app at the
 * root of its subdomain, `/whatsapp-demo` for a demo that shares demos.exyconn.com with others.
 * It is Vite's `base` (apps.json `basePath`), so it comes before the company prefix.
 */
export const APP_BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

/** The address's path with the app's base path taken off. */
function pathAfterBase(pathname: string): string {
  return pathname.startsWith(APP_BASE_PATH) ? pathname.slice(APP_BASE_PATH.length) : pathname;
}

/** The company this page was loaded for. */
export const CURRENT_ORGANIZATION_SLUG = organizationSlugOf(
  pathAfterBase(globalThis.location.pathname),
);

/** The company prefix for this page — what another app's address carries too. */
export const ORGANIZATION_BASENAME = organizationBasename(CURRENT_ORGANIZATION_SLUG);

/** The router basename for this page: the app's base path, then the company prefix. */
export const ROUTER_BASENAME = `${APP_BASE_PATH}${ORGANIZATION_BASENAME}`;

/** Where the page is, inside the app: the path after the router basename, plus query and hash. */
export function pathInApp(): string {
  const { pathname, search, hash } = globalThis.location;
  const path = pathname.slice(ROUTER_BASENAME.length) || '/';
  return `${path}${search}${hash}`;
}

/** The same place in this app, for another company. */
export function organizationLocation(slug: string): string {
  return `${APP_BASE_PATH}${organizationBasename(slug)}${pathInApp()}`;
}
