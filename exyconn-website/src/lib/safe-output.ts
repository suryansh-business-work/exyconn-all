/**
 * Output encoding for portal-authored values the site prints into markup.
 *
 * The portal's editors are role-guarded, but a stored value is still data: a JSON-LD string
 * holding `</script>` would close the element it is printed into, and a link saved as
 * `javascript:…` would run under exyconn.com's origin when clicked.
 */

/** The only URL schemes a portal-authored link may use. */
const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/** Characters that could end a `<script>` element or break a JS parser, and their escapes. */
const JSON_LD_ESCAPES: Record<string, string> = {
  "<": String.raw`\u003c`,
  ">": String.raw`\u003e`,
  "&": String.raw`\u0026`,
  "\u2028": String.raw`\u2028`,
  "\u2029": String.raw`\u2029`,
};

/**
 * JSON for a `<script type="application/ld+json">` body. The escapes are valid JSON string
 * escapes, so the parsed data is unchanged while no `</script>` or `<!--` can appear.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll(/[<>&\u2028\u2029]/g, (char) => JSON_LD_ESCAPES[char]);
}

/**
 * The link when it is safe to print as an `href` / `src`, otherwise "" (callers treat "" as
 * "no link"). Allowed: http, https, mailto and tel URLs, and same-site paths (`/x`, `#x`,
 * `?x`). A protocol-relative `//host` or `/\host` is refused — it leaves the site without
 * saying so.
 */
export function safeHref(value: string | null | undefined): string {
  const url = value?.trim() ?? "";
  if (!url) {
    return "";
  }
  if (/^[#?]/.test(url) || /^\/(?![/\\])/.test(url)) {
    return url;
  }
  try {
    return SAFE_SCHEMES.has(new URL(url).protocol) ? url : "";
  } catch {
    return "";
  }
}
