/**
 * `@exyconn/regex` — the validation patterns every form checks against, with ZERO dependencies.
 *
 * A form reaches for a pattern here before it writes its own, so "a valid email" or "a slug"
 * means the same thing on every screen. Messages stay with the form — only the rule is shared.
 * Every pattern is anchored and flag-free of `g`, so `.test()` is stateless and safe to reuse.
 */

/** A mailbox: a local part, an `@`, a dotted domain and a two-letter-plus TLD. */
export const EMAIL = /^(?!\.)(?!.*\.\.)[\w'+.-]*[\w+-]@(?:[a-z\d][a-z\d-]*\.)+[a-z]{2,}$/i;

/** An absolute web address — `http://` or `https://`, a host, then anything without spaces. */
export const HTTP_URL = /^https?:\/\/[^\s/?#]+(?:[/?#]\S*)?$/i;

/** A path on the same site, like `/about-us` — never `//host`, which would leave the site. */
export const SITE_PATH = /^\/(?!\/)\S*$/;

/** Either of the above: where a link may point off-site or stay on it. */
export const LINK = /^(?:https?:\/\/[^\s/?#]+(?:[/?#]\S*)?|\/(?!\/)\S*)$/i;

/** A phone number as people write it: optional `+`, digits, spaces, dashes and brackets. */
export const PHONE = /^\+?\(?\d[\d\s()-]{5,18}\d$/;

/** A ten-digit Indian mobile number, without the country code — it always starts 6–9. */
export const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/** A six-digit hex colour with its hash, e.g. `#155dfc`. */
export const HEX_COLOR = /^#[\da-f]{6}$/i;

/** A URL segment or lookup key: lower-case letters, digits and hyphens, e.g. `ai-writing`. */
export const SLUG = /^[a-z\d-]+$/;

/** A reference code: letters, digits and hyphens, e.g. `CC-OPS` or `ACME-01`. */
export const CODE = /^[A-Za-z\d-]+$/;

/** A constant-style code: capitals, digits and underscores, e.g. `NEW` or `OLD_2025`. */
export const UPPER_SNAKE = /^[A-Z\d_]+$/;

/** A bare domain, not a URL — `exyconn.com`, no scheme and no path. */
export const DOMAIN = /^[a-z\d-]+(?:\.[a-z\d-]+)+$/i;

/** A GitHub owner or repository name as it appears in the repository URL. */
export const GITHUB_NAME = /^[\w.-]+$/;

/** A calendar month as `YYYY-MM`, e.g. `2026-04`. */
export const YEAR_MONTH = /^\d{4}-(?:0[1-9]|1[0-2])$/;

/** An Indian financial year as `YYYY-YY`, e.g. `2026-27`. */
export const FINANCIAL_YEAR = /^\d{4}-\d{2}$/;

/** A GSTIN — state code, PAN, entity number, the letter Z and a check character. */
export const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[\dA-Z]$/;

/** A two-digit GST state code, as the `gstStates` query lists them. */
export const GST_STATE_CODE = /^\d{2}$/;

/** A problem-report reference the status page hands out, e.g. `EXY-4KQ7W2`. */
export const REPORT_REFERENCE = /^EXY-[A-Z2-9]{6}$/;
