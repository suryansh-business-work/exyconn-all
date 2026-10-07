import { describe, expect, it } from 'vitest';
import { BRIEF_MAX_LENGTH, profileSchema } from '@/pages/Profile/forms/profile';

const VALID = {
  name: 'Asha Rao',
  phone: '+91 98765 43210',
  brief: 'Builds the payroll engine.',
  socialLinks: {
    linkedin: 'https://www.linkedin.com/in/asha',
    github: '',
    twitter: '',
    website: 'https://asha.example.com',
  },
  timezone: 'Asia/Kolkata',
  locale: 'en-IN',
};

/** The first message the schema gives for one field, or undefined when it passes. */
function messageFor(patch: Record<string, unknown>, path: string): string | undefined {
  const result = profileSchema.safeParse({ ...VALID, ...patch });
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path.join('.') === path)?.message;
}

describe('the profile schema', () => {
  it('accepts a complete, well-formed profile', () => {
    expect(profileSchema.safeParse(VALID).success).toBe(true);
  });

  it('accepts every optional field left empty, meaning "follow the default"', () => {
    const empty = {
      name: 'Asha Rao',
      phone: '',
      brief: '',
      socialLinks: { linkedin: '', github: '', twitter: '', website: '' },
      timezone: '',
      locale: '',
    };

    expect(profileSchema.safeParse(empty).success).toBe(true);
  });

  it('requires a name of at least two characters, ignoring surrounding space', () => {
    expect(messageFor({ name: '   ' }, 'name')).toBe('Name is required');
    expect(messageFor({ name: ' A ' }, 'name')).toBe('Minimum 2 characters');
    expect(messageFor({ name: 'Al' }, 'name')).toBeUndefined();
  });

  it('refuses a phone number that is not one', () => {
    expect(messageFor({ phone: 'call me' }, 'phone')).toBe('Enter a valid phone number');
  });

  it('caps the bio at the length the API accepts', () => {
    expect(messageFor({ brief: 'x'.repeat(BRIEF_MAX_LENGTH) }, 'brief')).toBeUndefined();
    expect(messageFor({ brief: 'x'.repeat(BRIEF_MAX_LENGTH + 1) }, 'brief')).toBe(
      `Keep your bio under ${BRIEF_MAX_LENGTH} characters`,
    );
  });

  it('wants a full web address for a shared profile', () => {
    const links = { ...VALID.socialLinks, github: 'github.com/asha' };

    expect(messageFor({ socialLinks: links }, 'socialLinks.github')).toBe(
      'Enter a full address starting with https://',
    );
  });

  it('only takes a timezone and a language it knows', () => {
    expect(messageFor({ timezone: 'Mars/Olympus' }, 'timezone')).toBe(
      'Choose a timezone from the list',
    );
    expect(messageFor({ locale: 'not a locale!' }, 'locale')).toBe('Choose a language');
  });
});
