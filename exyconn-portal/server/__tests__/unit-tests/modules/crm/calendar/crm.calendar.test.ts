import { crmCalendarModuleResolvers } from '../../../../../src/modules/crm/calendar';
import { calendarWindow } from '../../../../../src/modules/crm/calendar/crm.calendar';
import { ActivityModel } from '../../../../../src/modules/crm/activity.model';
import { MeetingBookingModel } from '../../../../../src/modules/crm/meetings/meeting.models';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { asSales } from './reminder.fixtures';

const FROM = new Date('2026-10-01T00:00:00.000Z');
const TO = new Date('2026-11-01T00:00:00.000Z');
const at = (iso: string) => new Date(iso);

type Item = { id: string; kind: string; title: string; relatedType: string | null; person: string };
const calendar = (ctx: GraphQLContext = asSales, from: Date = FROM, to: Date = TO) =>
  crmCalendarModuleResolvers.Query.crmCalendar(null, { from, to }, ctx) as Promise<Item[]>;

const activity = (over: Record<string, unknown>) =>
  ActivityModel.create({ type: 'TASK', subject: 'Task', owner: 'Asha', ...over });

describe('the CRM calendar', () => {
  it('shows reminders, dated activities and bookings in the window, earliest first', async () => {
    await activity({
      subject: 'Reminder',
      remindAt: at('2026-10-03T09:00:00Z'),
      dueDate: at('2026-10-03T09:00:00Z'),
      assigneeName: 'Ravi',
    });
    await activity({ subject: 'Task', dueDate: at('2026-10-02T09:00:00Z') });
    await activity({ subject: 'Meeting', type: 'MEETING', dueDate: at('2026-10-04T09:00:00Z') });
    await activity({ subject: 'Call', type: 'CALL', dueDate: at('2026-10-05T09:00:00Z') });
    await MeetingBookingModel.create({
      meetingTypeId: 'mt-1',
      meetingTitle: 'Demo',
      hostUserId: 'u-1',
      hostName: 'Asha',
      startAt: at('2026-10-01T10:00:00Z'),
      endAt: at('2026-10-01T10:30:00Z'),
      name: 'Meera',
      email: 'meera@client.test',
      contactId: 'contact-9',
    });

    const items = await calendar();

    expect(items.map((item) => [item.kind, item.title])).toEqual([
      ['BOOKING', 'Demo · Meera'],
      ['TASK', 'Task'],
      ['REMINDER', 'Reminder'],
      ['MEETING', 'Meeting'],
      ['ACTIVITY', 'Call'],
    ]);
    expect(items[0]).toMatchObject({
      id: expect.stringMatching(/^booking:/),
      relatedType: 'CONTACT',
    });
    expect(items[2].person).toBe('Ravi');
  });

  it('leaves out what falls outside the window, undated work, archived work and cancellations', async () => {
    await activity({ subject: 'Next month', dueDate: at('2026-11-02T09:00:00Z') });
    await activity({ subject: 'Undated' });
    await activity({
      subject: 'Archived',
      dueDate: at('2026-10-02T09:00:00Z'),
      archivedAt: new Date(),
    });
    await MeetingBookingModel.create({
      meetingTypeId: 'mt-1',
      meetingTitle: 'Demo',
      hostUserId: 'u-1',
      hostName: 'Asha',
      startAt: at('2026-10-01T10:00:00Z'),
      endAt: at('2026-10-01T10:30:00Z'),
      name: 'Meera',
      email: 'meera@client.test',
      status: 'CANCELLED',
    });

    await expect(calendar()).resolves.toEqual([]);
  });

  it('places a reminder at its reminder time, not its due date', async () => {
    await activity({
      subject: 'Moved',
      remindAt: at('2026-11-03T09:00:00Z'),
      dueDate: at('2026-10-03T09:00:00Z'),
    });

    await expect(calendar()).resolves.toEqual([]);
  });

  it('is refused to somebody outside the CRM', async () => {
    const asEmployee: GraphQLContext = {
      user: { id: 'user-2', roles: [ROLES.EMPLOYEE], email: 'dev@acme.test' },
    };

    await expect(calendar(asEmployee)).rejects.toThrow();
  });
});

describe('the calendar window', () => {
  it('refuses a window that runs backwards, is not a date, or is wider than 62 days', () => {
    expect(() => calendarWindow(TO, FROM)).toThrow(
      'Choose a calendar range that ends after it starts.',
    );
    expect(() => calendarWindow('soon', TO)).toThrow('Choose a calendar range');
    expect(() => calendarWindow(FROM, at('2027-01-01T00:00:00Z'))).toThrow('at most 62 days');
    expect(calendarWindow(FROM.toISOString(), TO.toISOString())).toEqual({ from: FROM, to: TO });
  });
});
