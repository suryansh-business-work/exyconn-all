import { describe, expect, it } from 'vitest';
import { Role, TaxSystem } from '@/graphql/generated';
import { MODULES } from '@/config/modules';
import {
  COMPANY_SIZE_OPTIONS,
  MONTH_OPTIONS,
  TAX_SYSTEM_OPTIONS,
} from '@/pages/organizations/forms/organization/organization.options';
import {
  PORTAL_OPTIONS,
  organizationSchema,
  toCreateInput,
  toInitial,
  toUpdateInput,
} from '@/pages/organizations/forms/organization';
import { organization } from '../../organizations.fixtures';

const valid = () => ({ ...toInitial(null), name: 'Acme', currency: 'NOK' });

function errorsOf(values: Record<string, unknown>) {
  const result = organizationSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('organization options', () => {
  it('names all twelve months, January first', () => {
    expect(MONTH_OPTIONS).toHaveLength(12);
    expect(MONTH_OPTIONS[0].value).toBe('1');
    expect(MONTH_OPTIONS[11].value).toBe('12');
  });

  it('offers every tax system and the headcount bands', () => {
    expect(new Set(TAX_SYSTEM_OPTIONS.map((o) => o.value))).toEqual(
      new Set(Object.values(TaxSystem)),
    );
    expect(COMPANY_SIZE_OPTIONS.map((o) => o.value)).toEqual([
      '1-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1000+',
    ]);
  });

  it('offers each portal once, by the role that opens it', () => {
    const roles = PORTAL_OPTIONS.map((o) => o.value);
    expect(new Set(roles).size).toBe(roles.length);
    expect(new Set(roles)).toEqual(new Set(MODULES.map((m) => m.role)));
  });
});

describe('organizationSchema', () => {
  it('accepts a company with only a name and a currency', () => {
    expect(errorsOf(valid())).toEqual([]);
  });

  it('keeps every free-text detail under its limit', () => {
    expect(errorsOf({ ...valid(), postalCode: 'x'.repeat(21) })).toEqual([
      'Keep this under 20 characters',
    ]);
    expect(errorsOf({ ...valid(), description: 'x'.repeat(2001) })).toEqual([
      'Keep this under 2000 characters',
    ]);
  });

  it('wants a two-letter country when one is given', () => {
    expect(errorsOf({ ...valid(), country: 'Norway' })).toEqual(['Pick a country from the list']);
  });

  it('wants each invited person to have at least one portal', () => {
    const members = [{ name: 'Kari', email: 'kari@fjord.example', roles: [] }];
    expect(errorsOf({ ...valid(), members })).toEqual(['Pick at least one portal']);
    members[0].roles = [Role.Employee] as never[];
    expect(errorsOf({ ...valid(), members })).toEqual([]);
  });
});

describe('toInitial and the inputs', () => {
  it('starts a new company blank, in this browser’s timezone, in January', () => {
    const initial = toInitial(null);
    expect(initial).toMatchObject({
      name: '',
      website: '',
      locale: 'en',
      fiscalYearStartMonth: '1',
      taxSystem: TaxSystem.None,
      members: [],
    });
  });

  it('fills an edit from the row and sends everything but the handle', () => {
    const row = organization();
    const values = toInitial(row);
    expect(values.city).toBe('Oslo');
    expect(values.fiscalYearStartMonth).toBe('4');
    const update = toUpdateInput(values);
    expect(update).not.toHaveProperty('slug');
    expect(update.fiscalYearStartMonth).toBe(4);
    expect(toCreateInput(values).slug).toBe('acme');
    expect(toCreateInput({ ...values, slug: '' }).slug).toBeUndefined();
  });
});
