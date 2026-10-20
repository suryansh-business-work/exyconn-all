import { Types } from 'mongoose';
import { employeeEmailResolvers } from '../../../../src/modules/admin/employee-email';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { emailer } from '../../../../src/modules/email/email.service';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

const { Mutation } = employeeEmailResolvers;
const send = jest.spyOn(emailer, 'send');

const ctxAs = (roles: Role[]): GraphQLContext =>
  ({
    user: { id: new Types.ObjectId().toHexString(), email: 'hr@exyconn.com', roles },
  }) as unknown as GraphQLContext;
const hr = ctxAs([ROLES.HR]);

async function employee(personalEmail: string | null = 'asha.home@example.com') {
  const user = await UserModel.create({
    name: 'Asha',
    email: 'asha@exyconn.com',
    personalEmail,
    passwordHash: 'x',
  });
  return user._id.toHexString();
}

/** Asks for a code and answers with the one the email carried. */
async function codeSentTo(employeeId: string, kind: 'OFFICIAL' | 'PERSONAL') {
  await Mutation.requestEmployeeEmailCode(null, { employeeId, kind }, hr);
  const variables = send.mock.calls.at(-1)?.[0].variables as { code: string };
  return variables.code;
}

beforeEach(() => send.mockResolvedValue(undefined as never));
afterAll(() => send.mockRestore());

describe('requestEmployeeEmailCode', () => {
  it('emails a six-digit code to the personal address and audits it', async () => {
    const id = await employee();

    await expect(
      Mutation.requestEmployeeEmailCode(null, { employeeId: id, kind: 'PERSONAL' }, hr),
    ).resolves.toBe(true);

    expect(send).toHaveBeenCalledWith({
      template: 'employee-email-code',
      to: 'asha.home@example.com',
      variables: { name: 'Asha', code: expect.stringMatching(/^\d{6}$/), expiresIn: '10 minutes' },
      triggeredBy: 'Employee email verification',
    });
    await expect(AuditLogModel.findOne().lean()).resolves.toMatchObject({
      action: 'UPDATE',
      module: 'User',
      entityId: id,
      summary: 'Sent a verification code to the personal email of Asha',
    });
  });

  it('sends the official code to the sign-in address', async () => {
    const id = await employee();
    await Mutation.requestEmployeeEmailCode(null, { employeeId: id, kind: 'OFFICIAL' }, hr);
    expect(send.mock.calls[0][0].to).toBe('asha@exyconn.com');
  });

  it('refuses a personal code when there is no personal address', async () => {
    const id = await employee(null);
    await expect(
      codeOf(Mutation.requestEmployeeEmailCode(null, { employeeId: id, kind: 'PERSONAL' }, hr)),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(send).not.toHaveBeenCalled();
  });

  it('says so plainly when the email cannot be sent, and audits nothing', async () => {
    const id = await employee();
    send.mockRejectedValueOnce(new Error('SMTP down'));
    await expect(
      Mutation.requestEmployeeEmailCode(null, { employeeId: id, kind: 'PERSONAL' }, hr),
    ).rejects.toThrow('We could not send the code just now.');
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });

  it('is HR’s: an employee is refused', async () => {
    const id = await employee();
    await expect(
      codeOf(
        Mutation.requestEmployeeEmailCode(
          null,
          { employeeId: id, kind: 'PERSONAL' },
          ctxAs([ROLES.EMPLOYEE]),
        ),
      ),
    ).resolves.toBe('FORBIDDEN');
    expect(send).not.toHaveBeenCalled();
  });

  it('stops after five codes an hour for one address', async () => {
    const id = await employee();
    for (let i = 0; i < 5; i += 1) {
      await Mutation.requestEmployeeEmailCode(null, { employeeId: id, kind: 'PERSONAL' }, hr);
    }
    await expect(
      codeOf(Mutation.requestEmployeeEmailCode(null, { employeeId: id, kind: 'PERSONAL' }, hr)),
    ).resolves.toBe('TOO_MANY_REQUESTS');
    // The official address has its own allowance.
    await expect(
      Mutation.requestEmployeeEmailCode(null, { employeeId: id, kind: 'OFFICIAL' }, hr),
    ).resolves.toBe(true);
  });
});

describe('verifyEmployeeEmailCode', () => {
  it('stamps the address verified with the code the employee read back', async () => {
    const id = await employee();
    const code = await codeSentTo(id, 'PERSONAL');

    const user = await Mutation.verifyEmployeeEmailCode(
      null,
      { employeeId: id, kind: 'PERSONAL', code },
      hr,
    );

    expect(user.id).toBe(id);
    expect(user.personalEmailVerifiedAt).toBeInstanceOf(Date);
    expect(user.emailVerifiedAt).toBeNull();
    await expect(AuditLogModel.findOne({ summary: /Verified/ }).lean()).resolves.toMatchObject({
      summary: 'Verified the personal email of Asha',
    });
  });

  it('stamps only the official address for an official code', async () => {
    const id = await employee();
    const code = await codeSentTo(id, 'OFFICIAL');
    const user = await Mutation.verifyEmployeeEmailCode(
      null,
      { employeeId: id, kind: 'OFFICIAL', code },
      hr,
    );
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(user.personalEmailVerifiedAt).toBeNull();
  });

  it('refuses a wrong code and a code for the other address', async () => {
    const id = await employee();
    const code = await codeSentTo(id, 'PERSONAL');
    const wrong = code === '000000' ? '111111' : '000000';

    await expect(
      Mutation.verifyEmployeeEmailCode(null, { employeeId: id, kind: 'PERSONAL', code: wrong }, hr),
    ).rejects.toThrow('That code is not right.');
    await expect(
      codeOf(
        Mutation.verifyEmployeeEmailCode(null, { employeeId: id, kind: 'OFFICIAL', code }, hr),
      ),
    ).resolves.toBe('BAD_USER_INPUT');
    const user = await UserModel.findById(id).lean();
    expect(user?.personalEmailVerifiedAt).toBeNull();
    expect(user?.emailVerifiedAt).toBeNull();
  });

  it('refuses a code once the address has changed since it was sent', async () => {
    const id = await employee();
    const code = await codeSentTo(id, 'PERSONAL');
    await UserModel.updateOne({ _id: id }, { personalEmail: 'asha.new@example.com' });

    await expect(
      codeOf(
        Mutation.verifyEmployeeEmailCode(null, { employeeId: id, kind: 'PERSONAL', code }, hr),
      ),
    ).resolves.toBe('BAD_USER_INPUT');
    await expect(UserModel.findById(id).lean()).resolves.toMatchObject({
      personalEmailVerifiedAt: null,
    });
  });

  it('works once: the same code cannot verify twice', async () => {
    const id = await employee();
    const code = await codeSentTo(id, 'PERSONAL');
    await Mutation.verifyEmployeeEmailCode(null, { employeeId: id, kind: 'PERSONAL', code }, hr);
    await expect(
      Mutation.verifyEmployeeEmailCode(null, { employeeId: id, kind: 'PERSONAL', code }, hr),
    ).rejects.toThrow('Ask for a new one');
  });

  it('is refused to an employee before any code is checked', async () => {
    const id = await employee();
    await expect(
      codeOf(
        Mutation.verifyEmployeeEmailCode(
          null,
          { employeeId: id, kind: 'PERSONAL', code: '123456' },
          ctxAs([ROLES.EMPLOYEE]),
        ),
      ),
    ).resolves.toBe('FORBIDDEN');
  });
});
