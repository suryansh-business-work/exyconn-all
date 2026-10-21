import {
  dispatchDueCrmReminders,
  MAX_REMINDER_ATTEMPTS,
  reminderLink,
  startCrmReminderEmails,
} from '../../../../../src/modules/crm/calendar/crm.reminder.email';
import { ActivityModel } from '../../../../../src/modules/crm/activity.model';
import { AppSettingsModel } from '../../../../../src/modules/admin/settings.model';
import { NotificationModel } from '../../../../../src/modules/notifications';
import { emailer } from '../../../../../src/modules/email';
import { findBackgroundJob } from '../../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../../src/utils/logger';
import { MINUTE, seedPerson, seedReminder } from './reminder.fixtures';

let send: jest.SpyInstance;

beforeEach(() => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined as never);
  jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
  jest.spyOn(logger, 'info').mockImplementation(() => undefined);
  clearJobRuns();
});

afterEach(() => jest.restoreAllMocks());

describe('emailing a due reminder', () => {
  it('emails the assignee once, with a link to the record, and rings their bell', async () => {
    const asha = await seedPerson('Asha');
    const reminder = await seedReminder(asha);

    await expect(dispatchDueCrmReminders()).resolves.toBe(1);
    await expect(dispatchDueCrmReminders()).resolves.toBe(0);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'notification',
        to: 'asha@acme.test',
        variables: expect.objectContaining({
          title: 'Reminder: Call back about the renewal (Ravi)',
          actionUrl: 'https://crm.exyconn.com/contacts/contact-1',
        }),
      }),
    );
    const stored = await ActivityModel.findById(reminder._id).lean();
    expect(stored?.reminderSentAt).toBeInstanceOf(Date);
    await expect(NotificationModel.countDocuments({ employeeId: asha, kind: 'CRM' })).resolves.toBe(
      1,
    );
  });

  it('writes the time in the admin-configured zone and format', async () => {
    await AppSettingsModel.create({
      timezone: 'Asia/Kolkata',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: 'HH:mm',
    });
    const asha = await seedPerson('Asha');
    // 04:30 UTC is 10:00 in Kolkata.
    await seedReminder(asha, { remindAt: new Date('2026-01-05T04:30:00.000Z'), notes: '' });

    await dispatchDueCrmReminders();

    const { variables } = send.mock.calls[0][0] as { variables: { body: string } };
    expect(variables.body).toBe('Due 05/01/2026 10:00 (Asia/Kolkata).');
  });

  it('falls back to UTC when the stored zone is not a real one', async () => {
    await AppSettingsModel.create({ timezone: 'Mars/Olympus', timeFormat: 'HH:mm' });
    const asha = await seedPerson('Asha');
    await seedReminder(asha, { remindAt: new Date('2026-01-05T04:30:00.000Z') });

    await dispatchDueCrmReminders();

    const { variables } = send.mock.calls[0][0] as { variables: { body: string } };
    expect(variables.body).toBe('Due 05 Jan 2026 04:30 (UTC).');
  });

  it('waits for a reminder whose time has not come', async () => {
    const asha = await seedPerson('Asha');
    await seedReminder(asha, { remindAt: new Date(Date.now() + 5 * MINUTE) });

    await expect(dispatchDueCrmReminders()).resolves.toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('sends at most 50 in one tick and leaves the rest for the next', async () => {
    const asha = await seedPerson('Asha');
    await Promise.all(Array.from({ length: 51 }, () => seedReminder(asha)));

    await expect(dispatchDueCrmReminders()).resolves.toBe(50);
    await expect(dispatchDueCrmReminders()).resolves.toBe(1);
    expect(send).toHaveBeenCalledTimes(51);
  });

  it('never chases a task already done, an archived one or a deleted one', async () => {
    const asha = await seedPerson('Asha');
    await seedReminder(asha, { done: true });
    await seedReminder(asha, { archivedAt: new Date() });
    const deleted = await seedReminder(asha);
    await ActivityModel.deleteOne({ _id: deleted._id });

    await expect(dispatchDueCrmReminders()).resolves.toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('puts a failed email back in the queue and gives up after the last attempt', async () => {
    send.mockRejectedValue(new Error('SMTP down'));
    const asha = await seedPerson('Asha');
    const reminder = await seedReminder(asha);

    for (let attempt = 0; attempt < MAX_REMINDER_ATTEMPTS + 2; attempt += 1) {
      await dispatchDueCrmReminders();
    }

    expect(send).toHaveBeenCalledTimes(MAX_REMINDER_ATTEMPTS);
    const stored = await ActivityModel.findById(reminder._id).lean();
    expect(stored).toMatchObject({ reminderSentAt: null, reminderAttempts: MAX_REMINDER_ATTEMPTS });
  });

  it('retries and sends once the mail server is back', async () => {
    send.mockRejectedValueOnce(new Error('SMTP down'));
    const asha = await seedPerson('Asha');
    await seedReminder(asha);

    await expect(dispatchDueCrmReminders()).resolves.toBe(0);
    await expect(dispatchDueCrmReminders()).resolves.toBe(1);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('does not retry for ever when the assignee has been deactivated', async () => {
    const gone = await seedPerson('Gone', false);
    const reminder = await seedReminder(gone);

    await expect(dispatchDueCrmReminders()).resolves.toBe(0);
    await expect(dispatchDueCrmReminders()).resolves.toBe(0);

    expect(send).not.toHaveBeenCalled();
    const stored = await ActivityModel.findById(reminder._id).lean();
    expect(stored?.reminderSentAt).toBeInstanceOf(Date);
  });

  it('sends a reminder whose time was moved after it went out, at the new time', async () => {
    const asha = await seedPerson('Asha');
    const reminder = await seedReminder(asha, {
      reminderSentAt: new Date(Date.now() - 2 * MINUTE),
    });

    await expect(dispatchDueCrmReminders()).resolves.toBe(0);
    await ActivityModel.updateOne({ _id: reminder._id }, { reminderSentAt: null });
    await expect(dispatchDueCrmReminders()).resolves.toBe(1);
  });
});

describe('the reminder link', () => {
  it('opens the contact, the company, the deals board or the calendar', () => {
    expect(reminderLink({ relatedType: 'COMPANY', relatedId: 'c1' })).toBe(
      'https://crm.exyconn.com/companies/c1',
    );
    expect(reminderLink({ relatedType: 'DEAL', relatedId: 'd1' })).toBe(
      'https://crm.exyconn.com/deals',
    );
    expect(reminderLink({ relatedType: 'CONTACT', relatedId: '' })).toBe(
      'https://crm.exyconn.com/calendar',
    );
  });
});

describe('the background job', () => {
  it('is registered for Tech > Jobs and reports each tick', async () => {
    const asha = await seedPerson('Asha');
    await seedReminder(asha);

    await findBackgroundJob(JOB_KEYS.crmReminders)?.runOnce();
    expect(send).toHaveBeenCalledTimes(1);

    jest.spyOn(globalThis, 'setInterval').mockReturnValue({ unref: jest.fn() } as never);
    startCrmReminderEmails();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(readJobRuns().get(JOB_KEYS.crmReminders)?.summary).toMatch(/CRM reminder\(s\) emailed/);
  });
});
