import { badRequest } from '../../utils/errors';
import { isValidCountry, isValidCurrency } from '../../utils/iso';
import { TAX_ID_CODES, type TaxIdCode } from './client-tax-id';

/** What the Clients form sends; every field is checked again here. */
export interface ClientInput {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  country?: string | null;
  currency?: string | null;
  taxIdType?: string | null;
  taxId?: string | null;
  /** Older callers send the GSTIN on its own; it is read as an Indian tax number. */
  gstin?: string | null;
  stateCode?: string | null;
  region?: string | null;
  city?: string | null;
  postalCode?: string | null;
  billingAddress?: string | null;
}

const LOOSE_TAX_ID = /^[\dA-Z][\dA-Z./&Ñ-]{1,30}[\dA-Z]$/;
const GST_STATE_CODE = /^\d{2}$/;
const TEXT_MAX = 120;
const TAX_CODES: ReadonlySet<string> = new Set(TAX_ID_CODES);

const clean = (value: string | null | undefined): string => (value ?? '').trim();

/** The tax number pair, with a legacy GSTIN read as an Indian one. */
function taxIdOf(input: ClientInput): { taxIdType: TaxIdCode | ''; taxId: string } {
  const legacy = clean(input.gstin);
  const type = clean(input.taxIdType) || (legacy ? 'IN_GST' : '');
  const number = (clean(input.taxId) || legacy).replaceAll(/\s+/g, '').toUpperCase();
  if (type !== '' && !TAX_CODES.has(type)) {
    badRequest('Choose the kind of tax number from the list.');
  }
  if (number !== '' && type === '') {
    badRequest('Choose what kind of tax number this is.');
  }
  if (number !== '' && !LOOSE_TAX_ID.test(number)) {
    badRequest('Enter the tax number as it is registered (letters and digits).');
  }
  return { taxIdType: number === '' ? '' : (type as TaxIdCode), taxId: number };
}

function assertLength(value: string, label: string): void {
  if (value.length > TEXT_MAX) {
    badRequest(`Keep the ${label} under ${TEXT_MAX} characters.`);
  }
}

/**
 * A client as stored: ISO codes upper-cased and checked against the runtime's ISO tables, the
 * tax number normalised and paired with its kind, and the GST fields kept only for India.
 */
export function normalizeClient(input: ClientInput) {
  const country = clean(input.country).toUpperCase();
  const currency = clean(input.currency).toUpperCase();
  if (country !== '' && !isValidCountry(country)) {
    badRequest('Choose a country from the list.');
  }
  if (currency !== '' && !isValidCurrency(currency)) {
    badRequest('Choose a currency from the list.');
  }
  const { taxIdType, taxId } = taxIdOf(input);
  const indian = country === 'IN' || (country === '' && taxIdType === 'IN_GST');
  const stateCode = indian ? clean(input.stateCode) : '';
  if (stateCode !== '' && !GST_STATE_CODE.test(stateCode)) {
    badRequest('Choose the GST state from the list.');
  }
  const region = clean(input.region);
  const city = clean(input.city);
  const postalCode = clean(input.postalCode);
  assertLength(region, 'region');
  assertLength(city, 'city');
  assertLength(postalCode, 'postal code');
  return {
    name: input.name,
    email: input.email,
    phone: input.phone,
    company: input.company,
    status: input.status,
    country,
    currency,
    taxIdType,
    taxId,
    gstin: taxIdType === 'IN_GST' ? taxId : '',
    stateCode,
    region,
    city,
    postalCode,
    billingAddress: clean(input.billingAddress),
  };
}
