import { describe, expect, it } from 'vitest';
import { MAX_COMMENT_LENGTH, commentSchema } from '../../../../../../src/pages/post/forms/comment';

const firstError = (body: string) => commentSchema.safeParse({ body }).error?.issues[0]?.message;

describe('commentSchema', () => {
  it('accepts a comment and trims it', () => {
    expect(commentSchema.parse({ body: '  Nice work  ' })).toEqual({ body: 'Nice work' });
  });

  it('requires words', () => {
    expect(firstError('')).toBe('Write something before you comment');
    expect(firstError('    ')).toBe('Write something before you comment');
  });

  it('allows exactly the ceiling and refuses one character more', () => {
    expect(MAX_COMMENT_LENGTH).toBe(2000);
    expect(firstError('x'.repeat(MAX_COMMENT_LENGTH))).toBeUndefined();
    expect(firstError('x'.repeat(MAX_COMMENT_LENGTH + 1))).toBe(
      'Keep a comment under 2000 characters',
    );
  });
});
