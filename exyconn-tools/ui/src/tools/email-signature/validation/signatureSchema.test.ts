import { describe, expect, it } from 'vitest';
import { defaultFormValues, type SignatureFormValues } from '../types';
import { signatureValidationSchema } from './signatureSchema';

const valid: SignatureFormValues = { ...defaultFormValues, fullName: 'Ada Lovelace' };

/** Validates and returns `path -> message` for every failure. */
const errorsFor = async (overrides: Partial<SignatureFormValues>) => {
  try {
    await signatureValidationSchema.validate({ ...valid, ...overrides }, { abortEarly: false });
    return {};
  } catch (error) {
    const { inner } = error as { inner: { path: string; message: string }[] };
    return Object.fromEntries(inner.map((item) => [item.path, item.message]));
  }
};

describe('signatureValidationSchema', () => {
  it('accepts a signature with only a name', async () => {
    expect(await errorsFor({})).toEqual({});
  });

  it('requires a name of 2 to 100 characters', async () => {
    expect(await errorsFor({ fullName: '' })).toEqual({ fullName: 'Full name is required' });
    expect(await errorsFor({ fullName: 'A' })).toEqual({ fullName: 'Name must be at least 2 characters' });
    expect(await errorsFor({ fullName: 'A'.repeat(101) })).toEqual({
      fullName: 'Name must be less than 100 characters',
    });
  });

  it('limits the length of the text fields', async () => {
    expect(
      await errorsFor({
        jobTitle: 'x'.repeat(101),
        department: 'x'.repeat(101),
        company: 'x'.repeat(101),
        phone: 'x'.repeat(31),
        mobile: 'x'.repeat(31),
        address: 'x'.repeat(201),
        ctaText: 'x'.repeat(51),
      })
    ).toEqual({
      jobTitle: 'Job title must be less than 100 characters',
      department: 'Department must be less than 100 characters',
      company: 'Company name must be less than 100 characters',
      phone: 'Phone number must be less than 30 characters',
      mobile: 'Mobile number must be less than 30 characters',
      address: 'Address must be less than 200 characters',
      ctaText: 'CTA text must be less than 50 characters',
    });
  });

  it('checks the email address', async () => {
    expect(await errorsFor({ email: 'not-an-email' })).toEqual({ email: 'Please enter a valid email address' });
    expect(await errorsFor({ email: 'ada@example.org' })).toEqual({});
  });

  it('accepts URLs with or without a scheme, a path or a hyphenated host', async () => {
    for (const url of ['https://example.com', 'example.com/logo.png', 'http://img.my-site.co.uk/a b/c_d.png']) {
      expect(await errorsFor({ logoUrl: url, profilePhotoUrl: url, bannerUrl: url, ctaUrl: url })).toEqual({});
    }
  });

  it('rejects text that is not a URL', async () => {
    const message = 'Please enter a valid URL';
    expect(
      await errorsFor({
        logoUrl: 'not a url',
        profilePhotoUrl: 'localhost',
        bannerUrl: 'https://exa$mple.com',
        ctaUrl: 'a.b',
      })
    ).toEqual({ logoUrl: message, profilePhotoUrl: message, bannerUrl: message, ctaUrl: message });
  });

  it('validates social link URLs only when the link is enabled', async () => {
    const errors = await errorsFor({
      socialLinks: [
        { platform: 'linkedin', url: 'nonsense', enabled: false },
        { platform: 'github', url: 'nonsense', enabled: true },
        { platform: 'website', url: 'https://ok.example', enabled: true },
      ],
    });
    expect(errors).toEqual({ 'socialLinks[1].url': 'Please enter a valid URL' });
  });

  it('requires a label and a value on every custom field', async () => {
    expect(await errorsFor({ customFields: [{ id: 'a', label: '', value: '', type: 'text' }] })).toEqual({
      'customFields[0].label': 'Label is required',
      'customFields[0].value': 'Value is required',
    });
    expect(
      await errorsFor({
        customFields: [{ id: 'a', label: 'x'.repeat(51), value: 'y'.repeat(201), type: 'link' }],
      })
    ).toEqual({ 'customFields[0].label': 'Label too long', 'customFields[0].value': 'Value too long' });
  });

  it('only allows the known templates, font sizes and a custom field type', async () => {
    const errors = await errorsFor({
      template: 'fancy' as SignatureFormValues['template'],
      fontSize: 'huge' as SignatureFormValues['fontSize'],
      customFields: [{ id: 'a', label: 'L', value: 'V', type: 'fax' as 'text' }],
    });
    const failing = Object.keys(errors);
    failing.sort((a, b) => a.localeCompare(b));
    expect(failing).toEqual(['customFields[0].type', 'fontSize', 'template']);
  });
});
