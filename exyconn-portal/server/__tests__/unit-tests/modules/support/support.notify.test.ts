import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { emailer } from '../../../../src/modules/email';
import { env } from '../../../../src/config/env';
import { logger } from '../../../../src/utils/logger';
import { notifyRequesterOfReply } from '../../../../src/modules/support/support.notify';

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn() },
}));

const send = jest.mocked(emailer.send);

const employeeTicket = (employeeId: string) => ({
  _id: 'ticket-1',
  employeeId,
  subject: 'Laptop will not boot',
});

const customerTicket = (over: Record<string, string | null> = {}) => ({
  _id: 'ticket-2',
  employeeId: '',
  subject: 'Portal will not load',
  requesterType: 'CLIENT',
  requesterName: 'Dana Reyes',
  requesterEmail: 'dana@acme.test',
  reference: 'EXY-ABC234',
  ...over,
});

let warn: jest.SpyInstance;
let error: jest.SpyInstance;

beforeEach(() => {
  warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
  error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  send.mockResolvedValue(undefined);
});

afterEach(() => {
  warn.mockRestore();
  error.mockRestore();
});

describe('notifyRequesterOfReply — employees', () => {
  it('writes to the employee with a link back to their support page', async () => {
    const user = await UserModel.create({
      name: 'Ravi Kumar',
      email: 'ravi@exyconn.com',
      passwordHash: 'x',
      roles: ['EMPLOYEE'],
    });

    await notifyRequesterOfReply(employeeTicket(String(user._id)), 'Try a restart.');

    expect(send).toHaveBeenCalledWith({
      template: 'support-reply',
      to: 'ravi@exyconn.com',
      variables: {
        employeeName: 'Ravi Kumar',
        ticketSubject: 'Laptop will not boot',
        replyBody: 'Try a restart.',
        link: env.employeeSupportUrl,
      },
      triggeredBy: 'support console',
    });
  });

  it('greets an account with no name by its address', async () => {
    const { insertedId } = await UserModel.collection.insertOne({
      name: '',
      email: 'legacy@exyconn.com',
      roles: ['EMPLOYEE'],
    });

    await notifyRequesterOfReply(employeeTicket(String(insertedId)), 'Done.');

    expect(send.mock.calls[0][0].variables).toMatchObject({ employeeName: 'legacy@exyconn.com' });
  });

  it('logs and sends nothing when the employee account is gone', async () => {
    await notifyRequesterOfReply(employeeTicket(String(new Types.ObjectId())), 'Hello?');

    expect(send).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('employee has no email'));
  });
});

describe('notifyRequesterOfReply — customers', () => {
  it('writes to the address the customer raised it from, quoting the reference', async () => {
    await notifyRequesterOfReply(customerTicket(), 'We are on it.');

    expect(send).toHaveBeenCalledWith({
      template: 'support-reply-client',
      to: 'dana@acme.test',
      variables: {
        name: 'Dana Reyes',
        ticketSubject: 'Portal will not load',
        replyBody: 'We are on it.',
        reference: 'EXY-ABC234',
      },
      triggeredBy: 'support console',
    });
  });

  it('falls back to the address for a nameless customer and an empty reference', async () => {
    await notifyRequesterOfReply(customerTicket({ requesterName: '', reference: null }), 'Hi.');

    expect(send.mock.calls[0][0].variables).toMatchObject({
      name: 'dana@acme.test',
      reference: '',
    });
  });

  it('logs and sends nothing when the customer left no address', async () => {
    await notifyRequesterOfReply(customerTicket({ requesterEmail: null }), 'Hi.');

    expect(send).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('customer has no email'));
  });

  it('swallows a mail failure so the saved reply stands', async () => {
    send.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(notifyRequesterOfReply(customerTicket(), 'Hi.')).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      expect.stringContaining('ticket-2'),
    );
  });
});
