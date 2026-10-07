import { demoProfileSchema } from '../../../../../src/admin/workflows/forms/demo-profile/demo-profile.schema';
import { toDemoProfile } from '../../../../../src/admin/workflows/model/api';
import { demoRow } from './demo-profile.fixtures';

const VALID = toDemoProfile(demoRow());

const messagesFor = (value: unknown) => {
  const result = demoProfileSchema.safeParse(value);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('demoProfileSchema', () => {
  it('accepts a stored demo and coerces the position to a number', () => {
    const result = demoProfileSchema.safeParse({ ...VALID, order: '3' });
    expect(result.success && result.data.order).toBe(3);
  });

  it('allows empty contact fields', () => {
    const business = { ...VALID.business, phone: '', email: '', website: '' };
    expect(demoProfileSchema.safeParse({ ...VALID, business }).success).toBe(true);
  });

  it('checks phone, email and website look like one', () => {
    const business = { ...VALID.business, phone: 'call me', email: 'desk', website: 'clinic' };
    expect(messagesFor({ ...VALID, business })).toEqual([
      'Enter a valid phone number',
      'Enter a valid email address',
      'Enter a valid URL',
    ]);
  });

  it('keeps the key a short URL slug', () => {
    expect(messagesFor({ ...VALID, key: '' })).toContain('Key is required');
    expect(messagesFor({ ...VALID, key: 'Clinic One' })).toEqual([
      'Use lowercase letters, digits and hyphens only',
    ]);
    expect(messagesFor({ ...VALID, key: 'a'.repeat(65) })).toEqual([
      'Keep the key under 64 characters',
    ]);
  });

  it('wants a whole, non-negative position', () => {
    expect(messagesFor({ ...VALID, order: 1.5 })).toEqual(['Use a whole number']);
    expect(messagesFor({ ...VALID, order: -1 })).toEqual(['Use 0 or more']);
  });
});
