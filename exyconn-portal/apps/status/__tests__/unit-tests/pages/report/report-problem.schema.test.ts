import { describe, expect, it } from 'vitest';
import {
  REPORT_DEFAULTS,
  reportProblemSchema,
} from '../../../../src/pages/report/forms/report-problem';
import { reportInput } from './report.fixtures';

const messagesFor = (overrides: Record<string, unknown>) => {
  const result = reportProblemSchema.safeParse({ ...reportInput, ...overrides });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('reportProblemSchema', () => {
  it('starts a fresh report as a platform-wide outage of medium severity', () => {
    expect(REPORT_DEFAULTS).toMatchObject({
      serviceKey: '',
      category: 'OUTAGE',
      severity: 'MEDIUM',
      pageUrl: '',
    });
  });

  it('accepts a report with no page address, or with an http(s) one', () => {
    expect(messagesFor({ pageUrl: '' })).toEqual([]);
    expect(messagesFor({ pageUrl: 'http://hr.exyconn.com/x' })).toEqual([]);
    expect(messagesFor({ pageUrl: '  https://hr.exyconn.com  ' })).toEqual([]);
  });

  it('refuses a page address that is too long', () => {
    expect(messagesFor({ pageUrl: `https://x.io/${'p'.repeat(500)}` })).toEqual([
      'That URL is too long',
    ]);
  });

  it.each([
    ['subject', 's'.repeat(120), 's'.repeat(121), 'Keep the title under 120 characters'],
    [
      'description',
      'd'.repeat(4000),
      'd'.repeat(4001),
      'Keep the description under 4000 characters',
    ],
    ['reporterName', 'n'.repeat(80), 'n'.repeat(81), 'Keep your name under 80 characters'],
  ])('caps %s at the API limit', (field, longest, tooLong, message) => {
    expect(messagesFor({ [field]: longest })).toEqual([]);
    expect(messagesFor({ [field]: tooLong })).toEqual([message]);
  });

  it('refuses an address that cannot be replied to', () => {
    expect(messagesFor({ reporterEmail: 'ada@' })).toEqual([
      'Enter a valid email address so we can reply',
    ]);
  });
});
