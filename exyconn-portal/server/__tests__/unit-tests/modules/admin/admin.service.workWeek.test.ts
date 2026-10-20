import { adminService } from '../../../../src/modules/admin/admin.service';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../src/constants/roles';
import { codeOf } from '../codeOf';

const VERIFIED = new Date('2026-01-05T09:00:00.000Z');

/** A person whose two addresses were both proven by a code. */
async function verifiedPerson() {
  const user = await UserModel.create({
    name: 'Asha',
    email: 'asha@exyconn.com',
    emailVerifiedAt: VERIFIED,
    personalEmail: 'asha.home@example.com',
    personalEmailVerifiedAt: VERIFIED,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
  });
  return user._id.toHexString();
}

describe('creating a user with a week and a personal address', () => {
  it('stores a sorted week and a lower-cased personal address', async () => {
    const { user } = await adminService.createUser({
      name: 'Ravi',
      email: 'ravi@exyconn.com',
      roles: [ROLES.EMPLOYEE],
      workDays: [5, 1, 3],
      personalEmail: '  Ravi.Home@Example.com ',
    });

    await expect(UserModel.findById(user._id).lean()).resolves.toMatchObject({
      workDays: [1, 3, 5],
      personalEmail: 'ravi.home@example.com',
      personalEmailVerifiedAt: null,
      emailVerifiedAt: null,
    });
  });

  it('follows the workspace week and keeps no personal address when none is given', async () => {
    const { user } = await adminService.createUser({
      name: 'Ravi',
      email: 'ravi@exyconn.com',
      roles: [ROLES.EMPLOYEE],
      personalEmail: '   ',
    });

    const row = await UserModel.findById(user._id).lean();
    expect(row?.workDays).toBeUndefined();
    expect(row?.personalEmail).toBeNull();
  });

  it('refuses a personal address that is not one, creating nobody', async () => {
    await expect(
      adminService.createUser({
        name: 'Ravi',
        email: 'ravi@exyconn.com',
        roles: [ROLES.EMPLOYEE],
        personalEmail: 'ravi-at-home',
      }),
    ).rejects.toThrow('"ravi-at-home" is not an email address.');
    expect(await UserModel.countDocuments()).toBe(0);
  });
});

describe('updating the week', () => {
  it('sets a person’s own week, sorted', async () => {
    const id = await verifiedPerson();
    await adminService.updateUser(id, { workDays: [6, 0] });
    await expect(UserModel.findById(id).lean()).resolves.toMatchObject({ workDays: [0, 6] });
  });

  it('hands the person back to the workspace week on null', async () => {
    const id = await verifiedPerson();
    await adminService.updateUser(id, { workDays: [1, 2] });

    await adminService.updateUser(id, { workDays: null });

    const row = await UserModel.findById(id).lean();
    expect(row?.workDays).toBeUndefined();
  });

  it('leaves the week alone when the update does not mention it', async () => {
    const id = await verifiedPerson();
    await adminService.updateUser(id, { workDays: [1, 2] });
    await adminService.updateUser(id, { name: 'Asha K' });
    await expect(UserModel.findById(id).lean()).resolves.toMatchObject({ workDays: [1, 2] });
  });

  it.each([[[]], [[7]], [[2, 2]]])('refuses the week %j', async (workDays) => {
    const id = await verifiedPerson();
    await expect(codeOf(adminService.updateUser(id, { workDays }))).resolves.toBe('BAD_USER_INPUT');
  });
});

describe('updating addresses', () => {
  it('clears the personal stamp when the personal address changes', async () => {
    const id = await verifiedPerson();

    await adminService.updateUser(id, { personalEmail: 'ASHA.NEW@example.com' });

    await expect(UserModel.findById(id).lean()).resolves.toMatchObject({
      personalEmail: 'asha.new@example.com',
      personalEmailVerifiedAt: null,
      emailVerifiedAt: VERIFIED,
    });
  });

  it('keeps the stamp when the same personal address is saved again in other case', async () => {
    const id = await verifiedPerson();
    await adminService.updateUser(id, { personalEmail: ' Asha.Home@Example.com' });
    await expect(UserModel.findById(id).lean()).resolves.toMatchObject({
      personalEmailVerifiedAt: VERIFIED,
    });
  });

  it('removes the personal address and its stamp on an empty value', async () => {
    const id = await verifiedPerson();
    await adminService.updateUser(id, { personalEmail: '' });
    await expect(UserModel.findById(id).lean()).resolves.toMatchObject({
      personalEmail: null,
      personalEmailVerifiedAt: null,
    });
  });

  it('clears the official stamp only when the sign-in address really changes', async () => {
    const id = await verifiedPerson();

    await adminService.updateUser(id, { email: 'ASHA@exyconn.com' });
    await expect(UserModel.findById(id).lean()).resolves.toMatchObject({
      emailVerifiedAt: VERIFIED,
    });

    await adminService.updateUser(id, { email: 'asha.k@exyconn.com' });
    await expect(UserModel.findById(id).lean()).resolves.toMatchObject({
      email: 'asha.k@exyconn.com',
      emailVerifiedAt: null,
      personalEmailVerifiedAt: VERIFIED,
    });
  });

  it('refuses an invalid personal address and changes nothing', async () => {
    const id = await verifiedPerson();
    await expect(codeOf(adminService.updateUser(id, { personalEmail: 'not@' }))).resolves.toBe(
      'BAD_USER_INPUT',
    );
    await expect(UserModel.findById(id).lean()).resolves.toMatchObject({
      personalEmail: 'asha.home@example.com',
      personalEmailVerifiedAt: VERIFIED,
    });
  });
});
