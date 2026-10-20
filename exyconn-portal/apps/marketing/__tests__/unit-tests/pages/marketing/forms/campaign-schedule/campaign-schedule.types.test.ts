import { describe, expect, it } from 'vitest';
import {
  campaignScheduleSchema,
  SEND_TIMINGS,
} from '../../../../../../src/pages/marketing/forms/campaign-schedule';

const messages = (input: unknown) => {
  const result = campaignScheduleSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('campaignScheduleSchema', () => {
  it('offers sending now or later', () => {
    expect(SEND_TIMINGS).toEqual(['NOW', 'LATER']);
  });

  it('sends now without a time', () => {
    expect(messages({ timing: 'NOW', scheduledAt: null })).toEqual([]);
  });

  it('needs a future time to send later', () => {
    expect(messages({ timing: 'LATER', scheduledAt: '2099-01-01T00:00:00.000Z' })).toEqual([]);
    expect(messages({ timing: 'LATER', scheduledAt: null })).toEqual([
      'Choose when to send',
      'Choose a time in the future',
    ]);
    expect(messages({ timing: 'LATER', scheduledAt: '2000-01-01T00:00:00.000Z' })).toEqual([
      'Choose a time in the future',
    ]);
  });

  it('rejects an unknown timing', () => {
    expect(campaignScheduleSchema.safeParse({ timing: 'SOON', scheduledAt: null }).success).toBe(
      false,
    );
  });
});
