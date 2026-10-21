import { describe, expect, it } from 'vitest';
import { visibleText } from '@/utils/visibleText';

describe('visibleText', () => {
  it('drops the tags and trims what is left', () => {
    expect(visibleText('<p> Steps to <strong>reproduce</strong> </p>')).toBe('Steps to reproduce');
  });

  it('counts an editor holding only empty tags as empty', () => {
    expect(visibleText('<p></p><p><br></p>')).toBe('');
    expect(visibleText('')).toBe('');
  });

  it('keeps a "<" that never closes as text', () => {
    expect(visibleText('<p>a <b')).toBe('a <b');
  });

  it('reads a tag that holds another "<" as one tag', () => {
    expect(visibleText('x<a<b>y')).toBe('xy');
  });
});
