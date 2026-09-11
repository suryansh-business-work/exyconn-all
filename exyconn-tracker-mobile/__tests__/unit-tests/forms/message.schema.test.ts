import { describe, expect, it } from 'vitest';
import { MESSAGE_MAX_CHARS, messageSchema } from '../../../src/forms/message/message.schema';

function bodyError(body: string): string | undefined {
  const result = messageSchema.safeParse({ body });
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('messageSchema', () => {
  it('accepts a line and trims it before sending', () => {
    expect(messageSchema.parse({ body: '  Running late today \n' }).body).toBe(
      'Running late today',
    );
  });

  it('refuses an empty line, and one that is only whitespace', () => {
    expect(bodyError('')).toBe('Write a message first.');
    expect(bodyError('   \n\t ')).toBe('Write a message first.');
  });

  it('holds the portal limit of 2000 characters', () => {
    expect(MESSAGE_MAX_CHARS).toBe(2000);
    expect(bodyError('a'.repeat(2000))).toBeUndefined();
    expect(bodyError('a'.repeat(2001))).toBe('A message cannot be longer than 2000 characters.');
  });

  it('measures the limit after trimming, as the portal does', () => {
    expect(bodyError(`  ${'a'.repeat(2000)}  `)).toBeUndefined();
  });

  it('keeps the lines inside a message', () => {
    expect(messageSchema.parse({ body: 'one\ntwo' }).body).toBe('one\ntwo');
  });
});
