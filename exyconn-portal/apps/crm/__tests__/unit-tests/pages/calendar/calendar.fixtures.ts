import {
  ActivitySubject,
  CrmCalendarKind,
  type CrmCalendarQuery,
} from '@exyconn/shell/graphql/generated';

type Item = CrmCalendarQuery['crmCalendar'][number];

/** One calendar entry: a reminder on Ravi's contact, unless overridden. */
export const calendarItem = (over: Partial<Item> = {}): Item => ({
  id: 'a1',
  kind: CrmCalendarKind.Reminder,
  title: 'Call Ravi',
  startAt: '2026-10-19T09:00:00.000Z',
  endAt: null,
  done: false,
  relatedType: ActivitySubject.Contact,
  relatedId: 'c1',
  relatedName: 'Ravi',
  person: 'Asha',
  ...over,
});
