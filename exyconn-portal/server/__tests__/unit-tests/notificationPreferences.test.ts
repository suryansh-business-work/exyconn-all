import { deliver } from '../../src/modules/notifications/delivery';
import {
  readPreferences,
  setPreference,
} from '../../src/modules/notifications/preferences.service';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import { broadcast } from '../../src/modules/notifications/notifications.service';
import { UserModel } from '../../src/modules/admin/user.model';
import { emailer } from '../../src/modules/email';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';

jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const sent = emailer.send as jest.Mock;

async function seedEmployee(email: string) {
  const user = await UserModel.create({
    name: email.split('@')[0],
    email,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
    isActive: true,
  });
  return String(user._id);
}

const notice = { kind: 'LEAVE', title: 'Leave approved', body: 'Enjoy it.', link: '/me/leave' };

describe('what a person is told, and where', () => {
  useTestOrganization();

  it('gives everyone the portal and nobody email until they ask', async () => {
    const employeeId = await seedEmployee('asha@exyconn.com');

    const delivered = await deliver([employeeId], notice);

    expect(delivered).toBe(1);
    expect(await NotificationModel.countDocuments({ employeeId })).toBe(1);
    expect(sent).not.toHaveBeenCalled();
  });

  it('lists every kind, choice or default', async () => {
    const employeeId = await seedEmployee('dev@exyconn.com');

    const preferences = await readPreferences(employeeId);

    expect(preferences.length).toBeGreaterThan(10);
    expect(preferences.every((row) => row.inPortal && !row.email)).toBe(true);
  });

  it('stops sending a kind somebody turned off', async () => {
    const employeeId = await seedEmployee('meera@exyconn.com');
    await setPreference(employeeId, 'LEAVE', { inPortal: false, email: false });

    await deliver([employeeId], notice);
    await deliver([employeeId], { ...notice, kind: 'PAYROLL', title: 'Payslip ready' });

    const titles = (await NotificationModel.find({ employeeId }).select('title').lean()).map(
      (row) => row.title,
    );
    expect(titles).toEqual(['Payslip ready']);
  });

  it('emails the kinds somebody asked to be emailed', async () => {
    const employeeId = await seedEmployee('sam@exyconn.com');
    await setPreference(employeeId, 'LEAVE', { inPortal: true, email: true });

    await deliver([employeeId], notice);

    expect(sent).toHaveBeenCalledTimes(1);
    expect(sent.mock.calls[0][0]).toMatchObject({
      template: 'notification',
      to: 'sam@exyconn.com',
      variables: expect.objectContaining({ title: 'Leave approved' }),
    });
  });

  it('keeps each person to their own choice in one fan-out', async () => {
    const wants = await seedEmployee('wants@exyconn.com');
    const doesNot = await seedEmployee('quiet@exyconn.com');
    await setPreference(doesNot, 'ANNOUNCEMENT', { inPortal: false, email: false });

    const reached = await broadcast({
      audience: 'ALL',
      kind: 'ANNOUNCEMENT',
      title: 'Office closed on Friday',
    });

    expect(reached).toBe(1);
    expect(await NotificationModel.countDocuments({ employeeId: wants })).toBe(1);
    expect(await NotificationModel.countDocuments({ employeeId: doesNot })).toBe(0);
  });

  it('does not let a failed email lose the notification', async () => {
    const employeeId = await seedEmployee('bounce@exyconn.com');
    await setPreference(employeeId, 'LEAVE', { inPortal: true, email: true });
    sent.mockRejectedValueOnce(new Error('mailbox full'));

    const delivered = await deliver([employeeId], notice);

    expect(delivered).toBe(1);
    expect(await NotificationModel.countDocuments({ employeeId })).toBe(1);
  });
});
