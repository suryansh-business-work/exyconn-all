import type { SocialCalendarQuery } from '@exyconn/shell/graphql/generated';

export type CalendarPostRow = SocialCalendarQuery['socialCalendar'][number];

/** Each status's colour and word — the word is always shown, so colour is never the only cue. */
export const STATUS_TONE: Readonly<Record<string, { tone: string; label: string }>> = {
  SCHEDULED: { tone: 'warning.main', label: 'Scheduled' },
  PUBLISHING: { tone: 'info.main', label: 'Publishing' },
  PUBLISHED: { tone: 'success.main', label: 'Published' },
  FAILED: { tone: 'error.main', label: 'Failed' },
};
