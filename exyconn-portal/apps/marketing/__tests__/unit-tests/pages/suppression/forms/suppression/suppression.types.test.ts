import { describe, expect, it } from 'vitest';
import { SuppressionReason } from '@exyconn/shell/graphql/generated';
import {
  MAX_NOTE,
  REASON_OPTIONS,
  suppressionSchema,
} from '../../../../../../src/pages/suppression/forms/suppression';
import { EMPTY_SUPPRESSION } from '../../../../../../src/pages/suppression/forms/suppression/suppression.types';

const messages = (value: unknown) => {
  const result = suppressionSchema.safeParse(value);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('suppressionSchema', () => {
  it('accepts a valid address and trims the email and note', () => {
    const result = suppressionSchema.parse({
      ...EMPTY_SUPPRESSION,
      email: '  gone@acme.io ',
      note: '  asked by phone ',
    });

    expect(result).toEqual({
      email: 'gone@acme.io',
      reason: SuppressionReason.Manual,
      note: 'asked by phone',
      archived: false,
    });
  });

  it('requires an email, treating blanks as empty', () => {
    expect(messages({ ...EMPTY_SUPPRESSION, email: '   ' })).toContain('Email is required');
  });

  it('rejects a malformed email', () => {
    expect(messages({ ...EMPTY_SUPPRESSION, email: 'not-an-email' })).toEqual([
      'Enter a valid email address',
    ]);
  });

  it('allows a note of exactly the limit and rejects one character more', () => {
    const base = { ...EMPTY_SUPPRESSION, email: 'gone@acme.io' };

    expect(messages({ ...base, note: 'x'.repeat(MAX_NOTE) })).toEqual([]);
    expect(messages({ ...base, note: 'x'.repeat(MAX_NOTE + 1) })).toEqual([
      'Keep the note under 500 characters',
    ]);
  });

  it('rejects a reason the server does not know', () => {
    expect(messages({ ...EMPTY_SUPPRESSION, email: 'gone@acme.io', reason: 'BORED' })).toHaveLength(
      1,
    );
  });
});

describe('suppression form defaults', () => {
  it('starts blank, manual and active', () => {
    expect(EMPTY_SUPPRESSION).toEqual({
      email: '',
      reason: SuppressionReason.Manual,
      note: '',
      archived: false,
    });
  });

  it('offers every reason once, each with a hint', () => {
    expect(REASON_OPTIONS.map((option) => option.value).toSorted()).toEqual(
      Object.values(SuppressionReason).toSorted(),
    );
    expect(REASON_OPTIONS.every((option) => option.label && option.hint)).toBe(true);
  });
});
