import { describe, expect, it } from 'vitest';
import { PRESENCE_OPTIONS } from '@exyconn/tracker-core';
import { PRESENCE_NOTE_MAX, presenceSchema } from '../../../src/forms/presence/presence.schema';

function errorsOf(input: unknown): Record<string, string> {
  const result = presenceSchema.safeParse(input);
  if (result.success) {
    return {};
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    errors[String(issue.path[0])] ??= issue.message;
  }
  return errors;
}

describe('presenceSchema', () => {
  it('accepts every presence the picker offers', () => {
    for (const option of PRESENCE_OPTIONS) {
      expect(errorsOf({ status: option.status, note: '' })).toEqual({});
    }
  });

  it('refuses a presence the portal does not know', () => {
    expect(errorsOf({ status: 'ASLEEP', note: '' }).status).toBe('Choose what you are doing.');
    expect(errorsOf({ note: '' }).status).toBe('Choose what you are doing.');
  });

  it('keeps the note optional and trims it', () => {
    expect(presenceSchema.parse({ status: 'LUNCH', note: '  Back at 2 ' }).note).toBe('Back at 2');
    expect(presenceSchema.parse({ status: 'WORKING', note: '' }).note).toBe('');
  });

  it('holds the note to the characters the portal keeps', () => {
    expect(errorsOf({ status: 'AWAY', note: 'a'.repeat(PRESENCE_NOTE_MAX) })).toEqual({});
    expect(errorsOf({ status: 'AWAY', note: 'a'.repeat(PRESENCE_NOTE_MAX + 1) }).note).toBe(
      `Keep the note to ${PRESENCE_NOTE_MAX} characters.`,
    );
  });
});
