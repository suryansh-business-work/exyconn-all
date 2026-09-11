import { describe, expect, it } from 'vitest';
import {
  CODE,
  DOMAIN,
  EMAIL,
  FINANCIAL_YEAR,
  GITHUB_NAME,
  GSTIN,
  GST_STATE_CODE,
  HEX_COLOR,
  HTTP_URL,
  INDIAN_MOBILE,
  LINK,
  PHONE,
  REPORT_REFERENCE,
  SITE_PATH,
  SLUG,
  UPPER_SNAKE,
  YEAR_MONTH,
} from '../../src';

/** Each pattern with values it must take and values it must turn away. */
const CASES: ReadonlyArray<{
  name: string;
  pattern: RegExp;
  valid: readonly string[];
  invalid: readonly string[];
}> = [
  {
    name: 'EMAIL',
    pattern: EMAIL,
    valid: ['ana@exyconn.com', 'first.last+tag@mail.co.in', "o'neil@example.org"],
    invalid: [
      '',
      'ana',
      'ana@',
      '@exyconn.com',
      'ana@exyconn',
      'a..b@x.com',
      '.a@x.com',
      'a b@x.com',
    ],
  },
  {
    name: 'HTTP_URL',
    pattern: HTTP_URL,
    valid: ['https://exyconn.com', 'http://localhost:3000/health', 'https://x.io/a?b=1#c'],
    invalid: [
      '',
      'exyconn.com',
      '/about',
      'ftp://x.com',
      'javascript:alert(1)',
      'https://',
      'https://a b.com',
    ],
  },
  {
    name: 'SITE_PATH',
    pattern: SITE_PATH,
    valid: ['/', '/about-us', '/me/announcements?tab=all'],
    invalid: ['', 'about', '//evil.com', '/with space', 'https://exyconn.com'],
  },
  {
    name: 'LINK',
    pattern: LINK,
    valid: ['/', '/tools/foo', 'https://exyconn.com/blog', 'http://x.io'],
    invalid: ['', 'tools/foo', '//evil.com', 'javascript:alert(1)', 'https://'],
  },
  {
    name: 'PHONE',
    pattern: PHONE,
    valid: ['9876543210', '+91 98765 43210', '+1 (415) 555-0100', '(022) 2345 6789'],
    invalid: ['', '12345', 'call me', '+91-98765-4321x', '---------'],
  },
  {
    name: 'INDIAN_MOBILE',
    pattern: INDIAN_MOBILE,
    valid: ['9876543210', '6000000000'],
    invalid: ['', '5876543210', '987654321', '98765432100', '+919876543210', '98765 43210'],
  },
  {
    name: 'HEX_COLOR',
    pattern: HEX_COLOR,
    valid: ['#155dfc', '#FFFFFF', '#000000'],
    invalid: ['', '155dfc', '#fff', '#12345g', 'orange'],
  },
  {
    name: 'SLUG',
    pattern: SLUG,
    valid: ['ai-writing', 'scaling-graphql', 'v2'],
    invalid: ['', 'AI-Writing', 'ai writing', 'ai_writing', 'ai/writing'],
  },
  {
    name: 'CODE',
    pattern: CODE,
    valid: ['CC-OPS', 'acme-01', 'X'],
    invalid: ['', 'CC OPS', 'CC_OPS', 'CC.OPS'],
  },
  {
    name: 'UPPER_SNAKE',
    pattern: UPPER_SNAKE,
    valid: ['NEW', 'OLD_2025'],
    invalid: ['', 'new', 'NEW-OLD', 'NEW OLD'],
  },
  {
    name: 'DOMAIN',
    pattern: DOMAIN,
    valid: ['exyconn.com', 'mail.exyconn.co.in', 'EXYCONN.COM'],
    invalid: ['', 'exyconn', 'https://exyconn.com', 'exyconn.com/about', 'exy conn.com'],
  },
  {
    name: 'GITHUB_NAME',
    pattern: GITHUB_NAME,
    valid: ['exyconn', 'exyconn-all', 'my.repo_2'],
    invalid: ['', 'owner/repo', 'has space'],
  },
  {
    name: 'YEAR_MONTH',
    pattern: YEAR_MONTH,
    valid: ['2026-04', '2026-12', '2026-01'],
    invalid: ['', '2026-4', '2026-13', '2026-00', '26-04', '2026/04'],
  },
  {
    name: 'FINANCIAL_YEAR',
    pattern: FINANCIAL_YEAR,
    valid: ['2026-27', '2025-26'],
    invalid: ['', '2026', '2026-2027', '26-27'],
  },
  {
    name: 'GSTIN',
    pattern: GSTIN,
    valid: ['27AAPFU0939F1ZV', '29ABCDE1234F1Z5'],
    invalid: ['', '27aapfu0939f1zv', '27AAPFU0939F0ZV', '27AAPFU0939F1XV', '27AAPFU0939F1Z'],
  },
  {
    name: 'GST_STATE_CODE',
    pattern: GST_STATE_CODE,
    valid: ['27', '07'],
    invalid: ['', '7', '277', 'MH'],
  },
  {
    name: 'REPORT_REFERENCE',
    pattern: REPORT_REFERENCE,
    valid: ['EXY-4KQ7W2', 'EXY-ABCDEF'],
    invalid: ['', 'exy-4kq7w2', 'EXY-4KQ7W', 'EXY-4KQ0W2', 'EXY-4KQ1W2'],
  },
];

describe.each(CASES)('$name', ({ pattern, valid, invalid }) => {
  it.each(valid)('accepts %j', (value) => {
    expect(pattern.test(value)).toBe(true);
  });

  it.each(invalid)('rejects %j', (value) => {
    expect(pattern.test(value)).toBe(false);
  });
});
