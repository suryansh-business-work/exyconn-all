/**
 * Which sidebar entry the current URL belongs to.
 *
 * An exact match is not enough: pages own more than their own path — a tab adds
 * a slug (`/environment-variables/slack`) and a detail page adds an id
 * (`/admin/users/42`) — and both should keep their parent entry highlighted.
 * So an entry matches when the URL is it or sits beneath it, and the longest
 * such entry wins, which is what keeps `/admin` (Users) from claiming
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
