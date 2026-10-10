import { describe, expect, it } from 'vitest';
import { absoluteUrl, isAbsoluteUrl, toOgLocale } from '../../src';

describe('isAbsoluteUrl', () => {
  it.each([
    ['https://exyconn.com', true],
    ['HTTPS://x.y/z', true],
    ['/tools', false],
    ['//cdn.example.com/a.png', false],
    ['mailto:a@b.c', false],
  ])('%s -> %s', (value, expected) => {
    expect(isAbsoluteUrl(value)).toBe(expected);
  });
});

describe('absoluteUrl', () => {
  const origin = 'https://tools.exyconn.com/';

  it('joins a rooted path without doubling the slash', () => {
    expect(absoluteUrl(origin, '/tools/merge-pdf')).toBe(
      'https://tools.exyconn.com/tools/merge-pdf',
    );
  });

  it('adds the slash a relative path is missing', () => {
    expect(absoluteUrl(origin, 'og.png')).toBe('https://tools.exyconn.com/og.png');
  });

  it('drops trailing slashes except on the root', () => {
    expect(absoluteUrl(origin, '/tools/')).toBe('https://tools.exyconn.com/tools');
    expect(absoluteUrl(origin, '/')).toBe('https://tools.exyconn.com/');
    expect(absoluteUrl(origin, '')).toBe('https://tools.exyconn.com/');
  });

  it('returns an absolute URL unchanged', () => {
    expect(absoluteUrl(origin, 'https://cdn.example.com/a.png')).toBe(
      'https://cdn.example.com/a.png',
    );
  });
});

describe('toOgLocale', () => {
  it.each([
    ['en-us', 'en_US'],
    ['en-US', 'en_US'],
    ['pt_br', 'pt_BR'],
    ['EN', 'en'],
  ])('%s -> %s', (value, expected) => {
    expect(toOgLocale(value)).toBe(expected);
  });
});
