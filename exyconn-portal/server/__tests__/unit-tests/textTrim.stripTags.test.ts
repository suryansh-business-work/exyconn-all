import { stripTags } from '../../src/utils/textTrim';

describe('stripTags', () => {
  it('removes every tag and keeps the text, with an empty replacement by default', () => {
    expect(stripTags('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('puts the replacement where each tag was', () => {
    expect(stripTags('a<br>b<hr/>c', ' ')).toBe('a b c');
  });

  it('keeps an unterminated "<" and everything after it as text', () => {
    expect(stripTags('<b>bold</b> then <oops')).toBe('bold then <oops');
  });

  it('leaves an empty "<>" alone when tags must have at least one character', () => {
    expect(stripTags('a<>b<i>c', '', 1)).toBe('a<>bc');
    expect(stripTags('a<>b<i>c')).toBe('abc');
  });
});
