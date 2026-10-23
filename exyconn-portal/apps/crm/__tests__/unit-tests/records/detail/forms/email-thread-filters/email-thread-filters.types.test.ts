import { describe, expect, it } from 'vitest';
import { CrmEmailDirection } from '@exyconn/shell/graphql/generated';
import {
  EMPTY_EMAIL_FILTERS,
  activeFilterCount,
  emailThreadFiltersSchema,
  filterInput,
} from '../../../../../../src/records/detail/forms/email-thread-filters';

const NOW = Date.parse('2026-10-24T12:00:00.000Z');

describe('email thread filters', () => {
  it('turns no filters into an open query', () => {
    expect(filterInput(EMPTY_EMAIL_FILTERS, NOW)).toEqual({
      after: null,
      before: null,
      direction: null,
      accountId: null,
    });
    expect(activeFilterCount(EMPTY_EMAIL_FILTERS)).toBe(0);
  });

  it('counts back from now for a recent-mail preset, with the direction and mailbox', () => {
    const filters = {
      ...EMPTY_EMAIL_FILTERS,
      period: 'LAST_7_DAYS' as const,
      direction: CrmEmailDirection.Out,
      accountId: 'acc-1',
    };
    expect(filterInput(filters, NOW)).toEqual({
      after: '2026-10-17T12:00:00.000Z',
      before: null,
      direction: 'OUT',
      accountId: 'acc-1',
    });
    expect(activeFilterCount(filters)).toBe(3);
  });

  it('runs a custom range to the very end of its last day', () => {
    const custom = { ...EMPTY_EMAIL_FILTERS, period: 'CUSTOM' as const };
    expect(
      filterInput(
        { ...custom, after: '2026-10-01T00:00:00.000Z', before: '2026-10-10T00:00:00.000Z' },
        NOW,
      ),
    ).toMatchObject({ after: '2026-10-01T00:00:00.000Z', before: '2026-10-10T23:59:59.999Z' });
    expect(filterInput(custom, NOW)).toMatchObject({ after: null, before: null });
  });

  it('needs a date for a custom range and an end after its start', () => {
    const custom = { ...EMPTY_EMAIL_FILTERS, period: 'CUSTOM' as const };
    const messages = (values: object) =>
      emailThreadFiltersSchema.safeParse(values).error?.issues.map((issue) => issue.message);

    expect(messages(custom)).toEqual(['Pick a start or an end date']);
    expect(
      messages({
        ...custom,
        after: '2026-10-10T00:00:00.000Z',
        before: '2026-10-01T00:00:00.000Z',
      }),
    ).toEqual(['Pick an end on or after the start']);
    expect(emailThreadFiltersSchema.safeParse(EMPTY_EMAIL_FILTERS).success).toBe(true);
  });
});
