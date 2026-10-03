import { describe, expect, it } from 'vitest';
import { messageOf } from '../../src/portal/portal-error';

describe('messageOf', () => {
  it('uses the error’s own sentence when it has one', () => {
    expect(messageOf(new Error('Mark your attendance first.'), 'fallback')).toBe(
      'Mark your attendance first.',
    );
  });

  it('falls back for an empty message or something that is not an Error', () => {
    expect(messageOf(new Error(''), 'Could not start tracking.')).toBe('Could not start tracking.');
    expect(messageOf('offline', 'Could not start tracking.')).toBe('Could not start tracking.');
  });
});
