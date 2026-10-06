/**
 * Which sidebar entry the current URL belongs to.
 *
 * An exact match is not enough: pages own more than their own path — a tab adds
 * a slug (`/environment-variables/slack`) and a detail page adds an id
 * (`/admin/users/42`) — and both should keep their parent entry highlighted.
 * So an entry matches when the URL is it or sits beneath it, and the longest
 * such entry wins, which is what keeps `/admin` (Overview) from claiming
 * `/admin/branding`.
 *
 * Returns the winning path, or `undefined` when the URL is under none of them.
 */
export function activeNavPath(pathname: string, paths: readonly string[]): string | undefined {
  let best: string | undefined;
  for (const path of paths) {
    const matches = pathname === path || pathname.startsWith(`${path}/`);
    if (matches && (best === undefined || path.length > best.length)) {
      best = path;
    }
  }
  return best;
}

/**
 * The URL as the sidebar matches it: a module's scope segment taken out, so
 * `/website/s/exyconn/pages` is matched as `/website/pages` (see `scopedPrefix` in the modules
 * config). A URL under no scoped prefix is returned unchanged.
 */
export function unscopedNavPath(pathname: string, scopedPrefixes: readonly string[]): string {
  for (const prefix of scopedPrefixes) {
    if (pathname.startsWith(`${prefix}/`)) {
      const rest = pathname.slice(prefix.length + 1);
      const slash = rest.indexOf('/');
      const parent = prefix.slice(0, prefix.lastIndexOf('/'));
      return slash === -1 ? parent : `${parent}${rest.slice(slash)}`;
    }
  }
  return pathname;
}
