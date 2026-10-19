import { describe, expect, it } from 'vitest';
import {
  MAX_GUESTS,
  bookMeetingSchema,
} from '../../../../../../src/pages/book/forms/book-meeting';

const valid = { name: 'Sam Lee', email: 'sam@globex.com', guests: [], notes: '' };

function messages(patch: Record<string, unknown>) {
  const result = bookMeetingSchema.safeParse({ ...valid, ...patch });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('bookMeetingSchema', () => {
  it('accepts a name and email, trimming them', () => {
    expect(bookMeetingSchema.parse({ ...valid, name: ' Sam Lee ', email: ' sam@globex.com ' })).toEqual(
      valid,
    );
  });

  it('wants a name of at most 120 characters', () => {
    expect(messages({ name: '  ' })).toEqual(['Enter your name']);
    expect(messages({ name: 'x'.repeat(120) })).toEqual([]);
    expect(messages({ name: 'x'.repeat(121) })).toEqual(['Keep your name under 120 characters']);
  });

  it('wants a real email address', () => {
    expect(messages({ email: '' })).toEqual(['Enter your email', 'Enter a valid email']);
    expect(messages({ email: 'sam@globex' })).toEqual(['Enter a valid email']);
  });

  it('takes up to ten guests, each with a valid email', () => {
    const guests = Array.from({ length: MAX_GUESTS }, (_, i) => `guest${i}@globex.com`);

    expect(MAX_GUESTS).toBe(10);
    expect(messages({ guests })).toEqual([]);
    expect(messages({ guests: [...guests, 'one@more.com'] })).toEqual(['Invite up to 10 guests']);
    expect(messages({ guests: ['not-an-email'] })).toEqual(['Each guest needs a valid email']);
  });

  it('keeps the note under 2000 characters', () => {
    expect(messages({ notes: 'x'.repeat(2001) })).toEqual(['Keep it under 2000 characters']);
  });
});
