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

/** A Stripe secret or restricted API key, live or test, e.g. `sk_live_…` or `rk_test_…`. */
export const STRIPE_SECRET_KEY = /^(?:sk|rk)_(?:live|test)_\w+$/;

/** A Stripe webhook signing secret, e.g. `whsec_…`. */
export const STRIPE_WEBHOOK_SECRET = /^whsec_\w+$/;

/** A Razorpay key id, live or test, e.g. `rzp_live_…`. */
export const RAZORPAY_KEY_ID = /^rzp_(?:live|test)_\w+$/;

/** A six-digit one-time code, as emailed for the WhatsApp demo sign-in, e.g. `042917`. */
export const ONE_TIME_CODE = /^\d{6}$/;

/** A reference code: letters, digits and hyphens, e.g. `CC-OPS` or `ACME-01`. */
export const CODE = /^[A-Za-z\d-]+$/;

/** A constant-style code: capitals, digits and underscores, e.g. `NEW` or `OLD_2025`. */
export const UPPER_SNAKE = /^[A-Z\d_]+$/;

/** A bare domain, not a URL — `exyconn.com`, no scheme and no path. */
export const DOMAIN = /^[a-z\d-]+(?:\.[a-z\d-]+)+$/i;

/** A Cloudflare account or zone id: 32 hexadecimal characters. */
export const CLOUDFLARE_ID = /^[\da-f]{32}$/i;

/** A Meta (WhatsApp Cloud API) object id, such as a Phone number ID: digits only. */
export const META_ID = /^\d{5,30}$/;

/** A GitHub owner or repository name as it appears in the repository URL. */
export const GITHUB_NAME = /^[\w.-]+$/;

/** A SonarQube project key: letters, digits, `-`, `_`, `.` and `:`, not digits alone. */
export const SONAR_PROJECT_KEY = /^(?!\d+$)[\w.:-]+$/;

/** A calendar month as `YYYY-MM`, e.g. `2026-04`. */
export const YEAR_MONTH = /^\d{4}-(?:0[1-9]|1[0-2])$/;

/** An Indian financial year as `YYYY-YY`, e.g. `2026-27`. */
export const FINANCIAL_YEAR = /^\d{4}-\d{2}$/;

/** A two-digit GST state code, as the `gstStates` query lists them. */
export const GST_STATE_CODE = /^\d{2}$/;

/** A problem-report reference the status page hands out, e.g. `EXY-4KQ7W2`. */
export const REPORT_REFERENCE = /^EXY-[A-Z2-9]{6}$/;

/** A person's name as typed into a form or a chat: letters (any script), spaces, `.`, `'` and `-`. */
export const PERSON_NAME = /^\p{L}[\p{L}\p{M}\s.'-]{1,59}$/u;

/** An Indian PIN code: six digits, never starting with 0. */
export const INDIAN_PINCODE = /^[1-9]\d{5}$/;

/** A date typed as day/month/year, e.g. `14/08/1990` or `4-8-1990`. */
export const DAY_MONTH_YEAR = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;

/**
 * Business tax registrations by country — what an invoice to a client prints about them. One
 * entry per kind of number, with the countries (ISO 3166-1 alpha-2) that issue it and the shape
 * it has once spaces are removed and letters upper-cased (see normalizeTaxId). OTHER covers any
 * country not listed, with a loose shape check.
 */
export interface TaxIdType {
  /** Stored on the client and sent to the API (the GraphQL enum `ClientTaxIdType`). */
  code: string;
  /** What the number is called where it is issued: "GSTIN", "VAT number", "EIN". */
  label: string;
  /** The countries that issue it; empty for OTHER, which any country may use. */
  countries: readonly string[];
  pattern: RegExp;
  /** A well-formed example, for a field's hint. */
  example: string;
}

/** A GSTIN — state code, PAN, entity number, the letter Z and a check character. */
export const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[\dA-Z]$/;

/** The EU member states, by the prefix their VAT numbers carry (Greece writes EL, not GR). */
const EU_VAT_PREFIXES = [
  'AT',
  'BE',
  'BG',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'EL',
  'ES',
  'FI',
  'FR',
  'HR',
  'HU',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SE',
  'SI',
  'SK',
] as const;
const EU_COUNTRIES = EU_VAT_PREFIXES.map((prefix) => (prefix === 'EL' ? 'GR' : prefix));

export const TAX_ID_TYPES: readonly TaxIdType[] = [
  {
    code: 'IN_GST',
    label: 'GSTIN',
    countries: ['IN'],
    pattern: GSTIN,
    example: '27AAPFU0939F1ZV',
  },
  {
    code: 'EU_VAT',
    label: 'VAT number',
    countries: EU_COUNTRIES,
    pattern: new RegExp(`^(?:${EU_VAT_PREFIXES.join('|')})[\\dA-Z]{2,13}$`),
    example: 'DE123456789',
  },
  {
    code: 'GB_VAT',
    label: 'VAT number',
    countries: ['GB'],
    pattern: /^(?:GB|XI)(?:\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
    example: 'GB123456789',
  },
  {
    code: 'US_EIN',
    label: 'EIN',
    countries: ['US'],
    pattern: /^\d{2}-?\d{7}$/,
    example: '12-3456789',
  },
  {
    code: 'CA_BN',
    label: 'Business Number (GST/HST)',
    countries: ['CA'],
    pattern: /^\d{9}(?:RT\d{4})?$/,
    example: '123456789RT0001',
  },
  { code: 'AU_ABN', label: 'ABN', countries: ['AU'], pattern: /^\d{11}$/, example: '51824753556' },
  {
    code: 'NZ_GST',
    label: 'GST number',
    countries: ['NZ'],
    pattern: /^\d{8,9}$/,
    example: '123456789',
  },
  {
    code: 'AE_TRN',
    label: 'TRN',
    countries: ['AE'],
    pattern: /^\d{15}$/,
    example: '100123456700003',
  },
  {
    code: 'SA_VAT',
    label: 'VAT number',
    countries: ['SA'],
    pattern: /^3\d{13}3$/,
    example: '310123456700003',
  },
  {
    code: 'SG_UEN',
    label: 'UEN / GST registration',
    countries: ['SG'],
    pattern: /^[\dA-Z]{9,10}$/,
    example: '201912345K',
  },
  {
    code: 'CH_UID',
    label: 'UID / VAT number',
    countries: ['CH', 'LI'],
    pattern: /^CHE\d{9}(?:MWST|TVA|IVA)?$/,
    example: 'CHE123456789MWST',
  },
  {
    code: 'BR_CNPJ',
    label: 'CNPJ',
    countries: ['BR'],
    pattern: /^\d{14}$/,
    example: '12345678000195',
  },
  {
    code: 'MX_RFC',
    label: 'RFC',
    countries: ['MX'],
    pattern: /^[A-ZÑ&]{3,4}\d{6}[\dA-Z]{3}$/,
    example: 'ABC010101AB1',
  },
  {
    code: 'ZA_VAT',
    label: 'VAT number',
    countries: ['ZA'],
    pattern: /^4\d{9}$/,
    example: '4123456789',
  },
  {
    code: 'JP_CN',
    label: 'Corporate Number',
    countries: ['JP'],
    pattern: /^T?\d{13}$/,
    example: 'T1234567890123',
  },
  {
    code: 'OTHER',
    label: 'Tax ID',
    countries: [],
    pattern: /^[\dA-Z][\dA-Z./-]{1,30}[\dA-Z]$/,
    example: 'AB-123456',
  },
];

const BY_CODE = new Map(TAX_ID_TYPES.map((type) => [type.code, type]));

/** A typed tax number as it is stored and checked: no spaces, letters upper-cased. */
export function normalizeTaxId(value: string): string {
  return value.replaceAll(/\s+/g, '').toUpperCase();
}

/** The kind of number a code names, or undefined. */
export function taxIdType(code: string): TaxIdType | undefined {
  return BY_CODE.get(code);
}

/** The kinds of number a country issues, followed by OTHER — what a client form offers. */
export function taxIdTypesFor(country: string): TaxIdType[] {
  const own = TAX_ID_TYPES.filter((type) => type.countries.includes(country));
  return [...own, ...TAX_ID_TYPES.filter((type) => type.code === 'OTHER')];
}

/** Whether `value` is a well-formed number of kind `code` (after normalizeTaxId). */
export function isValidTaxId(code: string, value: string): boolean {
  const type = BY_CODE.get(code);
  return type !== undefined && type.pattern.test(normalizeTaxId(value));
}
