import { color } from '@exyconn/shell/components/ui';
import {
  ActivitySubject,
  CrmCalendarKind,
  type CrmCalendarQuery,
} from '@exyconn/shell/graphql/generated';

export type CalendarItem = CrmCalendarQuery['crmCalendar'][number];

/** Each kind's colour (a design token) and its name in the legend. */
export const KIND_STYLE: Readonly<Record<CrmCalendarKind, { tone: string; label: string }>> = {
  [CrmCalendarKind.Reminder]: { tone: color.amber[500], label: 'Reminder' },
  [CrmCalendarKind.Task]: { tone: color.blue[500], label: 'Task' },
  [CrmCalendarKind.Meeting]: { tone: color.violet[500], label: 'Meeting' },
  [CrmCalendarKind.Activity]: { tone: color.slate[500], label: 'Other activity' },
  [CrmCalendarKind.Booking]: { tone: color.green[500], label: 'Booked meeting' },
};

/** Where clicking an item goes: the contact or company it is about, else the list it lives in. */
export function itemLink(item: CalendarItem): string {
  if (item.relatedId && item.relatedType === ActivitySubject.Contact) {
    return `/contacts/${item.relatedId}`;
  }
  if (item.relatedId && item.relatedType === ActivitySubject.Company) {
    return `/companies/${item.relatedId}`;
  }
  if (item.kind === CrmCalendarKind.Booking) {
    return '/meetings/bookings';
  }
  return item.relatedType === ActivitySubject.Deal ? '/deals' : '/activities';
}
