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
