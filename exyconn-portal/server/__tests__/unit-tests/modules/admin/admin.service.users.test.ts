import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { adminService } from '../../../../src/modules/admin/admin.service';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { mailer } from '../../../../src/utils/mailer';
import { logger } from '../../../../src/utils/logger';
import { verifyPassword } from '../../../../src/utils/password';
import { ROLES } from '../../../../src/constants/roles';

/** Stubbed in __tests__/setup.ts so no SMTP is needed. */
const welcome = mailer.sendWelcomeEmail as jest.Mock;

const missingId = () => new Types.ObjectId().toHexString();
const flushBackground = () => new Promise((resolve) => setImmediate(resolve));

const joiner = (email = 'asha@exyconn.com') => ({
  name: 'Asha',
  email,
  roles: [ROLES.EMPLOYEE],
});

async function stored(name: string, email: string) {
  const user = await UserModel.create({ name, email, passwordHash: 'x', roles: [ROLES.EMPLOYEE] });
  return user._id.toHexString();
}

afterEach(() => jest.restoreAllMocks());

describe('creating a user', () => {
  it('stores the account with HR defaults and mails the temporary password it returns', async () => {
    const { user, password } = await adminService.createUser(joiner('Asha@Exyconn.com'));

    const row = await UserModel.findById(user._id).lean();
    expect(row).toMatchObject({
      email: 'asha@exyconn.com',
      isActive: true,
      employmentStatus: 'ACTIVE',
      probationEndDate: null,
      managerId: null,
      timezone: null,
    });
    expect(await verifyPassword(password, row?.passwordHash ?? '')).toBe(true);
    expect(welcome).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'asha@exyconn.com', password, roles: [ROLES.EMPLOYEE] }),
    );
  });

  it('keeps an explicit inactive flag and employment status', async () => {
    const { user } = await adminService.createUser({
      ...joiner(),
      isActive: false,
      employmentStatus: 'ON_LEAVE',
    });

    expect(user.toObject()).toMatchObject({ isActive: false, employmentStatus: 'ON_LEAVE' });
  });

  it('refuses an email somebody already has, whatever its case', async () => {
    await stored('Asha', 'asha@exyconn.com');

    await expect(adminService.createUser(joiner('ASHA@exyconn.com'))).rejects.toThrow(
      'A user with this email already exists',
    );
  });

  it('refuses an account with no role', async () => {
    await expect(adminService.createUser({ ...joiner(), roles: [] })).rejects.toThrow(
      'At least one role is required',
    );
  });

  it('refuses a manager who is not an account', async () => {
    await expect(adminService.createUser({ ...joiner(), managerId: missingId() })).rejects.toThrow(
      'The selected manager does not exist',
    );
  });

  it('still creates the user when the mailer throws on the spot, and logs it', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    welcome.mockImplementationOnce(() => {
      throw new Error('no SMTP configured');
    });

    const { user } = await adminService.createUser(joiner());

    expect(user.email).toBe('asha@exyconn.com');
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
      expect.stringContaining('Welcome email failed'),
    );
  });

  it('still creates the user when the email fails later, and logs it', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    welcome.mockRejectedValueOnce(new Error('SMTP timeout'));

    await adminService.createUser(joiner());
    await flushBackground();

    expect(error).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('credentials still available to copy'),
    );
  });
});

describe('reading users', () => {
  it('lists newest first and gets one by id', async () => {
    const first = await stored('First', 'first@exyconn.com');
    await stored('Second', 'second@exyconn.com');

    const rows = await adminService.listUsers();

    expect(rows.map((row) => row.name)).toEqual(['Second', 'First']);
    expect((await adminService.getUser(first)).email).toBe('first@exyconn.com');
  });

  it('says so when the user does not exist', async () => {
    await expect(adminService.getUser(missingId())).rejects.toThrow('User not found');
  });

  it('pages, searches and counts users for the grid', async () => {
    await stored('Asha', 'asha@exyconn.com');
    await stored('Ravi', 'ravi@exyconn.com');
    await UserModel.create({
      name: 'Boss',
      email: 'boss@exyconn.com',
      passwordHash: 'x',
      roles: [ROLES.ADMIN, ROLES.EMPLOYEE],
      isActive: false,
    });

    const page = await adminService.listUsersPaged({ page: 0, pageSize: 10, search: 'ravi' });
    const stats = await adminService.listUsersStats();

    expect(page.totalCount).toBe(1);
    expect(stats.total).toBe(3);
    const roles = stats.counts.find((count) => count.field === 'roles');
    expect(roles?.buckets).toEqual(
      expect.arrayContaining([
        { value: ROLES.EMPLOYEE, count: 3 },
        { value: ROLES.ADMIN, count: 1 },
      ]),
    );
  });
});

describe('changing a password from the admin console', () => {
  it('hashes the new password and signs the person out everywhere', async () => {
    const id = await stored('Asha', 'asha@exyconn.com');
    const password = randomUUID();

    const user = await adminService.updateUser(id, { password });

    const row = await UserModel.findById(id).lean();
    expect(await verifyPassword(password, row?.passwordHash ?? '')).toBe(true);
    expect(row?.tokenVersion).toBe(1);
    expect(user).not.toHaveProperty('password');
  });

  it('applies the password policy, against the new email when one is sent', async () => {
    const id = await stored('Asha', 'asha@exyconn.com');

    await expect(adminService.updateUser(id, { password: 'short' })).rejects.toThrow(
      /at least 10 characters/,
    );
    await expect(
      adminService.updateUser(id, {
        email: 'meenakshi@exyconn.com',
        password: `meenakshi-${randomUUID()}`,
      }),
    ).rejects.toThrow('New password must not contain your email address');
  });

  it('reports a missing user, with or without a password', async () => {
    await expect(adminService.updateUser(missingId(), { name: 'Ghost' })).rejects.toThrow(
      'User not found',
    );
    await expect(adminService.updateUser(missingId(), { password: randomUUID() })).rejects.toThrow(
      'User not found',
    );
  });
});
