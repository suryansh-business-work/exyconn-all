/** URL and locale helpers the meta builders share. */

const ABSOLUTE_URL = /^https?:\/\//i;

/** True for an `http(s)://` URL — the only kind a canonical or share image may be. */
export function isAbsoluteUrl(value: string): boolean {
  return ABSOLUTE_URL.test(value);
}

/**
 * `path` resolved against `origin`, with no trailing slash except on the root.
 * An already-absolute URL is returned unchanged.
 */
export function absoluteUrl(origin: string, path: string): string {
  if (isAbsoluteUrl(path)) {
    return path;
  }
  const base = origin.replace(/\/+$/, '');
  const trimmed = path.replace(/\/+$/, '');
  if (trimmed === '') {
    return `${base}/`;
  }
  const leading = trimmed.startsWith('/') ? '' : '/';
  return `${base}${leading}${trimmed}`;
}

/** A BCP 47 tag ("en-us", "en-US") as Open Graph wants it ("en_US"). */
export function toOgLocale(locale: string): string {
  const [language, region] = locale.split(/[-_]/);
  return region ? `${language.toLowerCase()}_${region.toUpperCase()}` : language.toLowerCase();
}
