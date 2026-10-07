import { describe, expect, it } from 'vitest';
import { MAX_POST_LENGTH, postSchema } from '../../../../../../src/pages/feed/forms/post';

/** The first message Zod reports for each field — the one the form shows under it. */
function errorsFor(values: { body: string; imageUrl: string }): Record<string, string> {
  const result = postSchema.safeParse(values);
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    errors[issue.path.join('.')] ??= issue.message;
  }
  return errors;
}

describe('postSchema', () => {
  it('accepts words with no picture, trimming the words', () => {
    expect(postSchema.parse({ body: '  Hello  ', imageUrl: '' })).toEqual({
      body: 'Hello',
      imageUrl: '',
    });
  });

  it('accepts a full http(s) picture URL, trimmed', () => {
    expect(
      postSchema.parse({ body: 'Offsite', imageUrl: ' https://cdn.example.com/a.jpg ' }).imageUrl,
    ).toBe('https://cdn.example.com/a.jpg');
    expect(errorsFor({ body: 'Offsite', imageUrl: 'http://cdn.example.com/a.jpg' })).toEqual({});
  });

  it('requires words, even with a picture attached', () => {
    expect(errorsFor({ body: '   ', imageUrl: 'https://cdn.example.com/a.jpg' }).body).toBe(
      'Write something before you post',
    );
  });

  it('allows exactly the ceiling and refuses one character more', () => {
    expect(MAX_POST_LENGTH).toBe(5000);
    expect(errorsFor({ body: 'x'.repeat(MAX_POST_LENGTH), imageUrl: '' })).toEqual({});
    expect(errorsFor({ body: 'x'.repeat(MAX_POST_LENGTH + 1), imageUrl: '' }).body).toBe(
      'Keep a post under 5000 characters',
    );
  });

  it('refuses a picture that is not a full URL', () => {
    expect(errorsFor({ body: 'Offsite', imageUrl: 'cdn.example.com/a.jpg' }).imageUrl).toBe(
      'Enter a full URL starting with https://',
    );
    expect(errorsFor({ body: 'Offsite', imageUrl: 'ftp://cdn.example.com/a.jpg' }).imageUrl).toBe(
      'Enter a full URL starting with https://',
    );
  });
});
