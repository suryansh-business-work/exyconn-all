import { describe, expect, it } from 'vitest';
import {
  EMPTY_MAIL_FILTERS,
  mailFilterCount,
  mailFilterInput,
  mailFiltersSchema,
} from '../../../../../src/pages/mail/forms/mail-filters';

const NOW = Date.parse('2026-10-24T12:00:00.000Z');

describe('mail filters', () => {
  it('sends nothing for no filters, and counts none', () => {
    expect(mailFilterInput(EMPTY_MAIL_FILTERS, NOW)).toEqual({
      after: null,
      before: null,
      unreadOnly: null,
      withAttachments: null,
    });
    expect(mailFilterCount(EMPTY_MAIL_FILTERS)).toBe(0);
  });

  it('sends a preset range and the switches, and counts each', () => {
    const filters = {
      ...EMPTY_MAIL_FILTERS,
      period: 'LAST_90_DAYS' as const,
      unreadOnly: true,
      withAttachments: true,
    };
    expect(mailFilterInput(filters, NOW)).toEqual({
      after: '2026-07-26T12:00:00.000Z',
      before: null,
      unreadOnly: true,
      withAttachments: true,
    });
    expect(mailFilterCount(filters)).toBe(3);
  });

  it('refuses a custom range with no dates', () => {
    expect(mailFiltersSchema.safeParse({ ...EMPTY_MAIL_FILTERS, period: 'CUSTOM' }).success).toBe(
      false,
    );
  });
});
