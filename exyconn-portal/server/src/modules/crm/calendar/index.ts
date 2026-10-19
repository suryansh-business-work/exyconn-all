import { crmCalendarResolvers } from './crm.calendar';

/** Rows saved before reminders existed come back from `.lean()` without these fields. */
const activityReminderResolvers = {
  remindAt: (row: { remindAt?: Date | null }) => row.remindAt ?? null,
  assigneeId: (row: { assigneeId?: string | null }) => row.assigneeId ?? '',
  assigneeName: (row: { assigneeName?: string | null }) => row.assigneeName ?? '',
  reminderSentAt: (row: { reminderSentAt?: Date | null }) => row.reminderSentAt ?? null,
};

export const crmCalendarModuleResolvers = {
  Activity: activityReminderResolvers,
  Query: crmCalendarResolvers.Query,
};

export { crmCalendarTypeDefs } from './crm.calendar.typeDefs';
export { withReminderOnCreate, withReminderOnUpdate } from './crm.reminder.input';
export { dispatchDueCrmReminders, startCrmReminderEmails } from './crm.reminder.email';
