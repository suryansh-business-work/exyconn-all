import { describe, expect, it } from 'vitest';
import { canonicalMeetUrl, meetingCodeFromUrl } from '../../../src/utils/meet-url';

describe('meetingCodeFromUrl', () => {
  it.each([
    ['https://meet.google.com/abc-defg-hij', 'abc-defg-hij'],
    ['https://meet.google.com/abc-defg-hij?authuser=1&hs=179', 'abc-defg-hij'],
    ['https://meet.google.com/abc-defg-hij/', 'abc-defg-hij'],
    ['https://meet.google.com/abc-defg-hij#chat', 'abc-defg-hij'],
    ['https://meet.google.com/meet/abc-defg-hij', 'abc-defg-hij'],
    ['https://meet.google.com/meet/abc-defg-hij?authuser=0', 'abc-defg-hij'],
  ])('reads the code from %s', (url, code) => {
    expect(meetingCodeFromUrl(url)).toBe(code);
  });

  it.each([
    'https://meet.google.com/',
    'https://meet.google.com/landing',
    'https://meet.google.com/new',
    'https://meet.google.com/meet/new',
    'https://meet.google.com/ABC-DEFG-HIJ',
    'https://evil.example/abc-defg-hij',
    'https://meet.google.com.evil.example/abc-defg-hij',
    'not a url',
  ])('finds no call in %s', (url) => {
    expect(meetingCodeFromUrl(url)).toBeNull();
  });
});

describe('canonicalMeetUrl', () => {
  it('drops everything but the code', () => {
    expect(canonicalMeetUrl('abc-defg-hij')).toBe('https://meet.google.com/abc-defg-hij');
  });
});
