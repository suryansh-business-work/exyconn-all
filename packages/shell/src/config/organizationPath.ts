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

/** The company this page was loaded for. */
export const CURRENT_ORGANIZATION_SLUG = organizationSlugOf(window.location.pathname);

/** The router basename for this page. */
export const ORGANIZATION_BASENAME = organizationBasename(CURRENT_ORGANIZATION_SLUG);

/** Where the page is, inside the app: the path after the company prefix, plus query and hash. */
export function pathInApp(): string {
  const { pathname, search, hash } = window.location;
  const path = pathname.slice(ORGANIZATION_BASENAME.length) || '/';
  return `${path}${search}${hash}`;
}

/** The same place in this app, for another company. */
export function organizationLocation(slug: string): string {
  return `${organizationBasename(slug)}${pathInApp()}`;
}
