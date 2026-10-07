import {
  normalizeClient,
  type ClientInput,
} from '../../../../src/modules/clients/client.validation';
import {
  TAX_ID_CODES,
  TAX_ID_LABELS,
  taxIdLabel,
} from '../../../../src/modules/clients/client-tax-id';

const base: ClientInput = {
  name: 'Acme',
  email: 'ops@acme.test',
  phone: '123',
  company: 'Acme Ltd',
  status: 'ACTIVE',
};

const normalize = (fields: Partial<ClientInput>) => normalizeClient({ ...base, ...fields });

describe('normalizeClient', () => {
  it('stores a client with no optional fields as blanks', () => {
    expect(normalize({})).toEqual({
      ...base,
      country: '',
      currency: '',
      taxIdType: '',
      taxId: '',
      gstin: '',
      stateCode: '',
      region: '',
      city: '',
      postalCode: '',
      billingAddress: '',
    });
  });

  it('upper-cases the ISO codes and trims the address', () => {
    const client = normalize({
      country: ' de ',
      currency: 'eur',
      region: ' Bavaria ',
      city: ' Munich ',
      postalCode: ' 80331 ',
      billingAddress: ' Street 1 ',
    });

    expect(client).toMatchObject({
      country: 'DE',
      currency: 'EUR',
      region: 'Bavaria',
      city: 'Munich',
      postalCode: '80331',
      billingAddress: 'Street 1',
    });
  });

  it('reads a legacy GSTIN as an Indian tax number and keeps its state code', () => {
    const client = normalize({ gstin: ' 27aapfu0939f1zv ', stateCode: '27' });

    expect(client).toMatchObject({
      country: '',
      taxIdType: 'IN_GST',
      taxId: '27AAPFU0939F1ZV',
      gstin: '27AAPFU0939F1ZV',
      stateCode: '27',
    });
  });

  it('removes spaces from the number and drops the GST state outside India', () => {
    const client = normalize({
      country: 'DE',
      taxIdType: 'EU_VAT',
      taxId: 'de 123 456 789',
      stateCode: '09',
    });

    expect(client).toMatchObject({
      taxIdType: 'EU_VAT',
      taxId: 'DE123456789',
      gstin: '',
      stateCode: '',
    });
  });

  it('prefers the new tax number over a legacy GSTIN', () => {
    const client = normalize({
      country: 'GB',
      taxIdType: 'GB_VAT',
      taxId: 'GB123456789',
      gstin: '27AAPFU0939F1ZV',
    });

    expect(client).toMatchObject({ taxIdType: 'GB_VAT', taxId: 'GB123456789', gstin: '' });
  });

  it('keeps no kind of tax number when no number was given', () => {
    expect(normalize({ taxIdType: 'US_EIN', taxId: '  ' })).toMatchObject({
      taxIdType: '',
      taxId: '',
    });
  });

  it('keeps the GST state of an Indian client', () => {
    expect(normalize({ country: 'in', stateCode: ' 29 ' })).toMatchObject({
      country: 'IN',
      stateCode: '29',
    });
  });

  it('refuses a kind of tax number that is not on the list', () => {
    expect(() => normalize({ taxIdType: 'XX_TAX', taxId: 'X123' })).toThrow(
      'Choose the kind of tax number from the list.',
    );
  });

  it('refuses a number whose kind is not given', () => {
    expect(() => normalize({ taxId: '12-3456789' })).toThrow(
      'Choose what kind of tax number this is.',
    );
  });

  it.each(['#BAD!', 'A', 'AB'])('refuses the malformed tax number %s', (taxId) => {
    expect(() => normalize({ taxIdType: 'OTHER', taxId })).toThrow(
      'Enter the tax number as it is registered (letters and digits).',
    );
  });

  it('refuses a country that is not an ISO code', () => {
    expect(() => normalize({ country: 'India' })).toThrow('Choose a country from the list.');
  });

  it('refuses an invented two-letter country', () => {
    expect(() => normalize({ country: 'XX' })).toThrow('Choose a country from the list.');
  });

  it('refuses a currency that is not an ISO code', () => {
    expect(() => normalize({ currency: 'rupee' })).toThrow('Choose a currency from the list.');
  });

  it('refuses a GST state that is not a two-digit code', () => {
    expect(() => normalize({ country: 'IN', stateCode: 'MH' })).toThrow(
      'Choose the GST state from the list.',
    );
  });

  it.each([
    ['region', 'region'],
    ['city', 'city'],
    ['postalCode', 'postal code'],
  ] as const)('refuses a %s longer than 120 characters', (field, label) => {
    expect(() => normalize({ [field]: 'x'.repeat(121) })).toThrow(
      `Keep the ${label} under 120 characters.`,
    );
    expect(normalize({ [field]: 'x'.repeat(120) })[field]).toHaveLength(120);
  });
});

describe('taxIdLabel', () => {
  it('names the number an invoice prints', () => {
    expect(taxIdLabel('IN_GST')).toBe('GSTIN');
    expect(taxIdLabel('EU_VAT')).toBe('VAT number');
    expect(taxIdLabel('OTHER')).toBe('Tax ID');
  });

  it('is empty for no number or an unknown kind', () => {
    expect(taxIdLabel(null)).toBe('');
    expect(taxIdLabel(undefined)).toBe('');
    expect(taxIdLabel('')).toBe('');
    expect(taxIdLabel('NOPE')).toBe('');
  });

  it('lists every kind that has a label', () => {
    expect(TAX_ID_CODES).toEqual(Object.keys(TAX_ID_LABELS));
    expect(TAX_ID_CODES.every((code) => taxIdLabel(code) !== '')).toBe(true);
  });
});
