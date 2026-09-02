import { describe, expect, it } from 'vitest';
import { errorMessage } from '../../src/utils/errorMessage';

describe('errorMessage', () => {
  it("uses the Error's own message", () => {
    expect(errorMessage(new Error('Email already in use'), 'Save failed')).toBe(
      'Email already in use',
    );
  });

  it('falls back for values that are not Errors', () => {
    expect(errorMessage('boom', 'Save failed')).toBe('Save failed');
    expect(errorMessage(undefined, 'Save failed')).toBe('Save failed');
  });
});
