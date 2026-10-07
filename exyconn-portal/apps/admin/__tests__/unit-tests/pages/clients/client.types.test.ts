import { describe, expect, it } from 'vitest';
import { ClientStatus, ClientTaxIdType } from '@exyconn/shell/graphql/generated';
import {
  GST_COUNTRY,
  clientSchema,
  toClientInput,
  toClientValues,
  type ClientFormValues,
} from '../../../../src/pages/clients/forms/client/client.types';
import { client, clientValues } from './client.fixtures';

/** The first message Zod reports for each field — the one the form shows under it. */
function errorsFor(overrides: Partial<ClientFormValues>): Record<string, string> {
  const result = clientSchema.safeParse(clientValues(overrides));
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    errors[issue.path.join('.')] ??= issue.message;
  }
  return errors;
}

describe('clientSchema', () => {
  it('accepts a new client with no location, tax number or currency', () => {
    expect(errorsFor({})).toEqual({});
  });

  it('requires a name, email, phone and company, each well formed', () => {
    expect(errorsFor({ name: ' ' }).name).toBe('Name is required');
    expect(errorsFor({ email: '' }).email).toBe('Email is required');
    expect(errorsFor({ email: 'priya@' }).email).toBe('Enter a valid email');
    expect(errorsFor({ phone: '' }).phone).toBe('Phone is required');
    expect(errorsFor({ phone: 'call me' }).phone).toBe('Enter a valid phone');
    expect(errorsFor({ company: '' }).company).toBe('Company is required');
  });

  it('keeps region, city and postal code under 120 characters', () => {
    const long = 'x'.repeat(121);
    expect(errorsFor({ city: long }).city).toBe('Keep this under 120 characters');
    expect(errorsFor({ city: 'x'.repeat(120) })).toEqual({});
  });

  it('takes only listed countries, tax number kinds and currencies, or none', () => {
    expect(errorsFor({ country: 'IND' }).country).toBe('Choose a country from the list');
    expect(errorsFor({ taxIdType: 'MOON_TAX' }).taxIdType).toBe('Choose a tax number type');
    expect(errorsFor({ currency: 'EURO' }).currency).toBe('Choose a currency');
    expect(errorsFor({ country: 'DE', currency: 'EUR', taxIdType: ClientTaxIdType.EuVat })).toEqual(
      {},
    );
  });

  it('needs the kind of a typed tax number, and the number in that kind’s format', () => {
    expect(errorsFor({ taxId: 'DE123456789' }).taxIdType).toBe('Choose a tax number type');
    expect(errorsFor({ country: 'DE', taxIdType: ClientTaxIdType.EuVat, taxId: '12' }).taxId).toBe(
      'Enter the tax number in the format shown in the hint',
    );
    expect(
      errorsFor({ country: 'DE', taxIdType: ClientTaxIdType.EuVat, taxId: 'de 123456789' }),
    ).toEqual({});
  });

  it('only lets an Indian client carry a GST state', () => {
    expect(errorsFor({ country: 'DE', stateCode: '27' }).stateCode).toBe(
      'A GST state applies to Indian clients only',
    );
    expect(errorsFor({ country: GST_COUNTRY, stateCode: '27' })).toEqual({});
  });
});

describe('toClientValues', () => {
  it('starts a new client as a prospect with every field blank', () => {
    expect(toClientValues(null, [])).toEqual(
      clientValues({ name: '', email: '', phone: '', company: '' }),
    );
  });

  it('loads an existing client with the projects given', () => {
    const values = toClientValues(client(), ['project-1']);
    expect(values).toMatchObject({
      name: 'Priya Shah',
      status: ClientStatus.Active,
      country: 'IN',
      taxIdType: ClientTaxIdType.InGst,
      stateCode: '27',
      projectIds: ['project-1'],
    });
  });

  it('reads a client with no tax number kind as blank', () => {
    expect(toClientValues(client({ taxIdType: null }), []).taxIdType).toBe('');
  });
});

describe('toClientInput', () => {
  it('normalises the tax number and sends it with its kind', () => {
    const input = toClientInput(
      clientValues({ country: 'IN', taxIdType: ClientTaxIdType.InGst, taxId: '27aapfu 0939f1zv' }),
    );
    expect(input.taxId).toBe('27AAPFU0939F1ZV');
    expect(input.taxIdType).toBe(ClientTaxIdType.InGst);
    expect(input).not.toHaveProperty('projectIds');
  });

  it('sends no kind when there is no number', () => {
    const input = toClientInput(clientValues({ taxIdType: ClientTaxIdType.UsEin, taxId: '  ' }));
    expect(input.taxId).toBe('');
    expect(input.taxIdType).toBeNull();
  });

  it('keeps the GST state for an Indian client only', () => {
    expect(toClientInput(clientValues({ country: 'IN', stateCode: '27' })).stateCode).toBe('27');
    expect(toClientInput(clientValues({ country: 'DE', stateCode: '27' })).stateCode).toBe('');
  });
});
