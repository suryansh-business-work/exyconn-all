import { describe, expect, it } from 'vitest';
import { LicenceBillingCycle, LicenceStatus } from '@exyconn/shell/graphql/generated';
import { licenceSchema, toLicenceValues } from '../../../../../../src/pages/licences/forms/licence';
import { licenceRow } from '../../../page-kit/fixtures';

const valid = { ...toLicenceValues(null), name: 'Figma', vendor: 'Figma Inc' };

function firstError(value: unknown): string | null {
  const result = licenceSchema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? 'invalid');
}

describe('licenceSchema', () => {
  it('accepts a complete licence and coerces typed numbers', () => {
    const result = licenceSchema.parse({ ...valid, seatsTotal: '4', cost: '99.5' });
    expect(result).toMatchObject({ seatsTotal: 4, cost: 99.5 });
  });

  it('needs a name and a vendor', () => {
    expect(firstError({ ...valid, name: '  ' })).toBe('Name is required');
    expect(firstError({ ...valid, vendor: '' })).toBe('Vendor is required');
  });

  it('needs at least one whole seat', () => {
    expect(firstError({ ...valid, seatsTotal: 0 })).toBe('A licence needs at least one seat');
    expect(firstError({ ...valid, seatsTotal: 2.5 })).toBe('Seats must be a whole number');
    expect(firstError({ ...valid, seatsTotal: 'many' })).toBe('Seats must be a number');
  });

  it('refuses a negative cost', () => {
    expect(firstError({ ...valid, cost: -1 })).toBe('Cost cannot be negative');
    expect(firstError({ ...valid, cost: 'free' })).toBe('Cost must be a number');
  });

  it('needs a renewal date', () => {
    expect(firstError({ ...valid, renewalDate: '' })).toBe('A renewal date is required');
  });

  it('refuses more assignees than seats, on the seat list', () => {
    const result = licenceSchema.safeParse({ ...valid, seatsTotal: 1, assigneeIds: ['a', 'b'] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      message: 'More people are assigned than this licence has seats',
      path: ['assigneeIds'],
    });
  });

  it('allows every seat to be taken', () => {
    expect(firstError({ ...valid, seatsTotal: 2, assigneeIds: ['a', 'b'] })).toBeNull();
  });
});

describe('toLicenceValues', () => {
  it('starts a new licence as one active yearly seat renewing today', () => {
    const values = toLicenceValues(null);
    expect(values).toMatchObject({
      name: '',
      vendor: '',
      seatsTotal: 1,
      assigneeIds: [],
      cost: 0,
      billingCycle: LicenceBillingCycle.Yearly,
      status: LicenceStatus.Active,
      notes: '',
    });
    expect(Number.isNaN(Date.parse(values.renewalDate))).toBe(false);
  });

  it('copies an existing licence into the form', () => {
    const row = licenceRow({
      assigneeIds: ['a'],
      billingCycle: LicenceBillingCycle.Monthly,
      status: LicenceStatus.Cancelled,
      notes: 'Team plan',
    });
    expect(toLicenceValues(row)).toEqual({
      name: 'Figma',
      vendor: 'Figma Inc',
      seatsTotal: 5,
      assigneeIds: ['a'],
      cost: 1500,
      billingCycle: LicenceBillingCycle.Monthly,
      renewalDate: '2026-12-01T00:00:00.000Z',
      status: LicenceStatus.Cancelled,
      notes: 'Team plan',
    });
  });
});
