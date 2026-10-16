import { describe, expect, it } from 'vitest';
import { fieldHeading } from '../src/fieldHeading';

describe('fieldHeading', () => {
  it('splits camel case into a sentence-case heading', () => {
    expect(fieldHeading('billingAddress')).toBe('Billing address');
    expect(fieldHeading('postalCode2Line')).toBe('Postal code2 line');
  });

  it('capitalises a single word and leaves an empty name empty', () => {
    expect(fieldHeading('email')).toBe('Email');
    expect(fieldHeading('')).toBe('');
  });
});
