import {
  claimReminder,
  sendReminder,
  sendReminders,
  type Reminder,
} from '../../../../src/modules/reminders/reminders.notify';
import { ReminderLogModel } from '../../../../src/modules/reminders/reminder-log.model';
import { deliver } from '../../../../src/modules/notifications/delivery';
import { logger } from '../../../../src/utils/logger';
import { ROLES } from '../../../../src/constants/roles';
import { seedUser } from '../../../helpers';

jest.mock('../../../../src/modules/notifications/delivery', () => ({ deliver: jest.fn() }));

const delivered = deliver as jest.Mock;
const PASSWORD = process.env.TEST_USER_PASSWORD ?? `pw-${'x'.repeat(12)}`;

const reminder = (dedupeKey: string, extra: Partial<Reminder> = {}): Reminder => ({
  dedupeKey,
  kind: 'GENERAL',
  title: 'Something is due',
  body: 'Have a look.',
  link: '/me',
  ...extra,
});

afterEach(() => jest.restoreAllMocks());

describe('claiming a reminder', () => {
  it('hands a key to the first caller only', async () => {
    expect(await claimReminder('test', 'thing:1', 3)).toBe(true);
    expect(await claimReminder('test', 'thing:1', 3)).toBe(false);

    const [row] = await ReminderLogModel.find().lean();
    expect(row).toMatchObject({ source: 'test', dedupeKey: 'thing:1', recipients: 3 });
  });

  it('records no recipients when the caller does not say how many', async () => {
    await claimReminder('invoices', 'invoice:9:stage-1');

    expect((await ReminderLogModel.findOne().lean())?.recipients).toBe(0);
  });
});

describe('sending a reminder', () => {
  it('sends nothing and claims nothing when nobody is to be told', async () => {
    expect(await sendReminder('test', reminder('empty:1'))).toBe(0);

    expect(delivered).not.toHaveBeenCalled();
    expect(await ReminderLogModel.countDocuments()).toBe(0);
  });

  it('tells each person once, even when named directly and through a role', async () => {
    const user = await seedUser('asha@exyconn.com', PASSWORD, [ROLES.LEGAL]);
    const id = user._id.toHexString();
    delivered.mockResolvedValueOnce(1);

    const told = await sendReminder(
      'test',
      reminder('both:1', { employeeIds: [id], roles: [ROLES.LEGAL] }),
    );

    expect(told).toBe(1);
    expect(delivered).toHaveBeenCalledWith([id], {
      kind: 'GENERAL',
      title: 'Something is due',
      body: 'Have a look.',
      link: '/me',
    });
  });

  it('logs a delivery failure, counts nobody told, and does not chase again', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    delivered.mockRejectedValueOnce(new Error('store down'));

    const told = await sendReminder('test', reminder('fail:1', { employeeIds: ['u1'] }));
    const again = await sendReminder('test', reminder('fail:1', { employeeIds: ['u1'] }));

    expect(told).toBe(0);
    expect(again).toBe(0);
    expect(delivered).toHaveBeenCalledTimes(1);
    expect(logged).toHaveBeenCalledWith(
      expect.any(Error),
      'Reminder fail:1 could not be delivered',
    );
  });

  it('adds up how many people a batch reached', async () => {
    delivered.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

    const total = await sendReminders('test', [
      reminder('batch:1', { employeeIds: ['u1', 'u2'] }),
      reminder('batch:2', { employeeIds: ['u3'] }),
      reminder('batch:3'),
    ]);

    expect(total).toBe(3);
    expect(await ReminderLogModel.countDocuments()).toBe(2);
  });
});
