import { describe, expect, it } from 'vitest';
import {
  brandingSchema,
  toBrandingValues,
  type BrandingFormInput,
} from '../../../../src/pages/branding/forms/branding';
import { branding } from './branding.fixtures';

const valid = (): BrandingFormInput => toBrandingValues(branding());

/** The first message Zod reports for each field — the one the form shows under it. */
function errorsFor(overrides: Partial<BrandingFormInput>): Record<string, string> {
  const result = brandingSchema.safeParse({ ...valid(), ...overrides });
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    errors[issue.path.join('.')] ??= issue.message;
  }
  return errors;
}

describe('toBrandingValues', () => {
  it('maps every editable field and drops the id and type names', () => {
    const values = toBrandingValues(branding());
    expect(values).not.toHaveProperty('id');
    expect(values).not.toHaveProperty('__typename');
    expect(values.businessName).toBe('Acme');
    expect(values.defaultTaxPercent).toBe(18);
    expect(values.loginPages).toEqual([
      {
        app: 'finance',
        name: 'Finance',
        tagline: 'Invoices and billing',
        backgroundImageUrl: 'https://images.example.com/finance.jpg',
        accentColor: '#0ea5e9',
      },
    ]);
  });
});

describe('brandingSchema', () => {
  it('accepts the loaded record with every optional URL left empty', () => {
    expect(brandingSchema.safeParse(valid()).success).toBe(true);
  });

  it('trims text, upper-cases a GSTIN and turns a typed tax rate into a number', () => {
    const parsed = brandingSchema.parse({
      ...valid(),
      businessName: '  Acme  ',
      gstin: '27aapfu0939f1zv',
      defaultTaxPercent: '12.5',
    });
    expect(parsed.businessName).toBe('Acme');
    expect(parsed.gstin).toBe('27AAPFU0939F1ZV');
    expect(parsed.defaultTaxPercent).toBe(12.5);
  });

  it('requires a business name, an invoice prefix and a name for every portal login', () => {
    expect(errorsFor({ businessName: '   ' }).businessName).toBe('Business name is required');
    expect(errorsFor({ invoicePrefix: '' }).invoicePrefix).toBe('Invoice prefix is required');
    const blankPortal = { ...valid().loginPages[0], name: ' ' };
    expect(errorsFor({ loginPages: [blankPortal] })['loginPages.0.name']).toBe(
      'Portal name is required',
    );
  });

  it('rejects malformed URLs, emails and colours', () => {
    expect(errorsFor({ websiteUrl: 'acme.example' }).websiteUrl).toBe('Enter a valid URL');
    expect(errorsFor({ logoUrl: 'ftp://acme.example/logo.png' }).logoUrl).toBe('Enter a valid URL');
    expect(errorsFor({ supportEmail: 'support@' }).supportEmail).toBe(
      'Enter a valid email address',
    );
    expect(errorsFor({ primaryColor: 'blue' }).primaryColor).toBe(
      'Use a 6-digit hex colour, e.g. #155dfc',
    );
    const badBackground = { ...valid().loginPages[0], backgroundImageUrl: 'nope' };
    expect(errorsFor({ loginPages: [badBackground] })['loginPages.0.backgroundImageUrl']).toBe(
      'Enter a valid URL',
    );
  });

  it('keeps the default tax rate between 0 and 100', () => {
    expect(errorsFor({ defaultTaxPercent: -1 }).defaultTaxPercent).toBe('Must be ≥ 0');
    expect(errorsFor({ defaultTaxPercent: 101 }).defaultTaxPercent).toBe('Must be ≤ 100');
    expect(errorsFor({ defaultTaxPercent: 'abc' }).defaultTaxPercent).toBe('Must be a number');
    expect(errorsFor({ defaultTaxPercent: 0 })).toEqual({});
    expect(errorsFor({ defaultTaxPercent: 100 })).toEqual({});
  });

  it('accepts a blank GSTIN and state, and rejects a malformed one', () => {
    expect(errorsFor({ gstin: '', stateCode: '' })).toEqual({});
    expect(errorsFor({ gstin: '27AAPFU0939' }).gstin).toBeDefined();
    expect(errorsFor({ stateCode: 'MH' }).stateCode).toBeDefined();
  });
});
