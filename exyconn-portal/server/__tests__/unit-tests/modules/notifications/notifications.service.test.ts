import { randomUUID } from 'node:crypto';
import {
  notify,
  notifyBestEffort,
  notifyEveryone,
  resolveRecipients,
} from '../../../../src/modules/notifications/notifications.service';
import { deliver } from '../../../../src/modules/notifications/delivery';
import {
  channelsFor,
  setPreference,
} from '../../../../src/modules/notifications/preferences.service';
import { NotificationModel } from '../../../../src/modules/notifications/notification.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { emailer } from '../../../../src/modules/email';
import { env } from '../../../../src/config/env';
import { logger } from '../../../../src/utils/logger';
import { ROLES } from '../../../../src/constants/roles';

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const sent = emailer.send as jest.Mock;

async function seedEmployee(email: string, isActive = true) {
  const user = await UserModel.create({
    name: email.split('@')[0],
    email,
    passwordHash: randomUUID(),
    roles: [ROLES.EMPLOYEE],
    isActive,
  });
  return user._id.toHexString();
}

const emailOnly = (employeeId: string) =>
  setPreference(employeeId, 'GENERAL', { inPortal: false, email: true });

let logError: jest.SpyInstance;

beforeEach(() => {
  logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  sent.mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('notify', () => {
  it('drops one notification for one person, with empty body and link when none given', async () => {
    const employeeId = await seedEmployee('ada@exyconn.com');

    await notify(employeeId, { kind: 'GENERAL', title: 'Hello' });

    const row = await NotificationModel.findOne({ employeeId }).lean();
    expect(row).toMatchObject({ title: 'Hello', body: '', link: null, read: false });
  });
});

describe('notifyBestEffort', () => {
  it('logs a failed notification instead of throwing it at the caller', async () => {
    jest.spyOn(NotificationModel, 'insertMany').mockRejectedValueOnce(new Error('store down'));

    await expect(
      notifyBestEffort('emp-1', { kind: 'GENERAL', title: 'Approved' }),
    ).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      'Failed to notify employee of a decision',
    );
  });
});

describe('notifyEveryone', () => {
  it('reaches every active user and nobody deactivated', async () => {
    const active = await seedEmployee('on@exyconn.com');
    const inactive = await seedEmployee('off@exyconn.com', false);

    await notifyEveryone({ kind: 'ANNOUNCEMENT', title: 'Office closed' });

    await expect(NotificationModel.countDocuments({ employeeId: active })).resolves.toBe(1);
    await expect(NotificationModel.countDocuments({ employeeId: inactive })).resolves.toBe(0);
  });

  it('logs a failed fan-out instead of failing the action that caused it', async () => {
    jest.spyOn(UserModel, 'find').mockImplementationOnce(() => {
      throw new Error('db down');
    });

    await expect(notifyEveryone({ kind: 'GENERAL', title: 'Hi' })).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledWith(expect.any(Error), 'Failed to fan out notification');
  });
});

describe('resolveRecipients', () => {
  it('needs the employees for an EMPLOYEES audience', async () => {
    await expect(
      resolveRecipients({ audience: 'EMPLOYEES', kind: 'GENERAL', title: 'x', employeeIds: [] }),
    ).rejects.toThrow(/employeeIds is required/);
    await expect(
      resolveRecipients({ audience: 'EMPLOYEES', kind: 'GENERAL', title: 'x' }),
    ).rejects.toThrow(/employeeIds is required/);
  });

  it('never picks a chosen employee whose account is deactivated', async () => {
    const active = await seedEmployee('on@exyconn.com');
    const inactive = await seedEmployee('off@exyconn.com', false);

    await expect(
      resolveRecipients({
        audience: 'EMPLOYEES',
        kind: 'GENERAL',
        title: 'x',
        employeeIds: [active, inactive],
      }),
    ).resolves.toEqual([active]);
  });
});

describe('deliver', () => {
  it('does nothing for nobody', async () => {
    const lookup = jest.spyOn(UserModel, 'find');

    await expect(deliver([], { kind: 'GENERAL', title: 'x' })).resolves.toBe(0);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('emails without a bell entry for somebody who chose email only, linking the portal', async () => {
    const employeeId = await seedEmployee('mail@exyconn.com');
    await emailOnly(employeeId);

    const reached = await deliver([employeeId], { kind: 'GENERAL', title: 'Hi', link: 'me/leave' });

    expect(reached).toBe(0);
    await expect(NotificationModel.countDocuments()).resolves.toBe(0);
    expect(sent).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'mail@exyconn.com',
        triggeredBy: 'notification preferences',
        variables: { name: 'mail', title: 'Hi', body: '', actionUrl: `${env.appUrl}/me/leave` },
      }),
    );
  });

  it('points an email with no link at the portal itself, and keeps a leading slash', async () => {
    const employeeId = await seedEmployee('mail@exyconn.com');
    await emailOnly(employeeId);

    await deliver([employeeId], { kind: 'GENERAL', title: 'No link' });
    await deliver([employeeId], { kind: 'GENERAL', title: 'Slash', link: '/me/goals' });

    const urls = sent.mock.calls.map(
      ([input]) => (input as { variables: { actionUrl: string } }).variables.actionUrl,
    );
    expect(urls).toEqual([env.appUrl, `${env.appUrl}/me/goals`]);
  });

  it('does not email a deactivated account even when it asked for email', async () => {
    const employeeId = await seedEmployee('gone@exyconn.com', false);
    await emailOnly(employeeId);

    await deliver([employeeId], { kind: 'GENERAL', title: 'Hi' });

    expect(sent).not.toHaveBeenCalled();
  });
});

describe('channelsFor', () => {
  it('gives each person their own choice, and the default to anyone without one', async () => {
    await setPreference('emp-1', 'LEAVE', { inPortal: false, email: true });

    const channels = await channelsFor(['emp-1', 'emp-2'], 'LEAVE');

    expect(channels.get('emp-1')).toEqual({ inPortal: false, email: true });
    expect(channels.get('emp-2')).toEqual({ inPortal: true, email: false });
  });

  it('applies a choice only to the kind it was made for', async () => {
    await setPreference('emp-1', 'LEAVE', { inPortal: false, email: true });

    const channels = await channelsFor(['emp-1'], 'PAYROLL');

    expect(channels.get('emp-1')).toEqual({ inPortal: true, email: false });
  });
});
