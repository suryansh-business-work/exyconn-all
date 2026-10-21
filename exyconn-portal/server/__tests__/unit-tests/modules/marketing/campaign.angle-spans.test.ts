import { angleSpans, htmlToText } from '../../../../src/modules/marketing/campaign.mjml';
import { addressOf } from '../../../../src/modules/marketing/campaign.sender';

/** The regexes the linear scans replaced; the scans must agree with them on every input. */
const TAG = /<[^>]+>/g;
const ADDRESS_IN_ANGLES = /<([^>]+)>/;

const SAMPLES = [
  '',
  'plain text',
  '<p>Hello</p>',
  'a <b>bold</b> word',
  '<>',
  'x <> y <i>z</i>',
  '<<a>>',
  '<a<b>c>',
  'open < never closed',
  '<p>tail <',
  '> stray <span>s</span> >',
  '<br/><br />',
];

describe('angleSpans', () => {
  it.each(SAMPLES)('finds the same spans as /<[^>]+>/g in %j', (text) => {
    const expected = [...text.matchAll(TAG)].map((m) => [m.index, m.index + m[0].length - 1]);
    expect([...angleSpans(text)]).toEqual(expected);
  });

  it('stays linear on many unclosed brackets', () => {
    const text = '<'.repeat(200_000);
    const started = Date.now();
    expect([...angleSpans(text)]).toHaveLength(0);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});

describe('htmlToText', () => {
  it('drops tags and keeps the text between them', () => {
    expect(htmlToText('<p>Hi <b>there</b></p><p>a < b <> c</p>')).toBe('Hi there\na < b <> c');
  });
});

describe('addressOf', () => {
  it.each([
    'Team <Team@Example.com>',
    'team@example.com',
    '  Bare@Example.com  ',
    'Odd <> <real@example.com>',
    'Nested <a<b@example.com>',
    'Unclosed <x@example.com',
  ])('reads the same address as the old regex from %j', (from) => {
    const expected = (ADDRESS_IN_ANGLES.exec(from)?.[1] ?? from).trim().toLowerCase();
    expect(addressOf(from)).toBe(expected);
  });
});
