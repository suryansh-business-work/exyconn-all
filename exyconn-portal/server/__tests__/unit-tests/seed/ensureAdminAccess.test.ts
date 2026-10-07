import { randomUUID } from 'node:crypto';
import { ensureAdminAccess } from '../../../src/seed/ensureAdminAccess';
import { UserModel } from '../../../src/modules/admin/user.model';
import { ROLES } from '../../../src/constants/roles';
import { env } from '../../../src/config/env';
import { logger } from '../../../src/utils/logger';
import { seedUser } from '../../helpers';

const ADMIN_EMAIL = env.seedAdmin.email.toLowerCase();

let warn: jest.SpyInstance;
let error: jest.SpyInstance;

beforeEach(() => {
  warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
  error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  jest.replaceProperty(env.seedAdmin, 'password', randomUUID());
});

afterEach(() => jest.restoreAllMocks());

describe('ensureAdminAccess: what it says it did', () => {
  it('creates the bootstrap account as both company and platform administrator', async () => {
    await ensureAdminAccess();

    const admin = await UserModel.findOne({ email: ADMIN_EMAIL }).lean();
    expect(admin?.roles).toEqual([ROLES.ADMIN, ROLES.SUPER_ADMIN]);
    expect(admin?.name).toBe(env.seedAdmin.name);
    expect(warn).toHaveBeenCalledWith(`Created the bootstrap ADMIN account ${ADMIN_EMAIL}`);
  });

  it('leaves an account that can already administer everything untouched', async () => {
    const user = await seedUser(ADMIN_EMAIL, randomUUID(), [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
    const before = (await UserModel.findById(user._id).lean())?.updatedAt;

    await ensureAdminAccess();

    expect((await UserModel.findById(user._id).lean())?.updatedAt).toEqual(before);
    expect(warn).not.toHaveBeenCalled();
  });

  it('restores SUPER_ADMIN to an administrator who lost it, and says so', async () => {
    await seedUser(ADMIN_EMAIL, randomUUID(), [ROLES.ADMIN]);

    await ensureAdminAccess();

    const admin = await UserModel.findOne({ email: ADMIN_EMAIL }).lean();
    expect(admin?.roles).toEqual([ROLES.ADMIN, ROLES.SUPER_ADMIN]);
    expect(warn).toHaveBeenCalledWith(
      `Restored ADMIN access on the bootstrap account ${ADMIN_EMAIL}`,
    );
  });

  it('warns that a blocked bootstrap account stays blocked', async () => {
    const user = await seedUser(ADMIN_EMAIL, randomUUID(), [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
    await UserModel.updateOne({ _id: user._id }, { isBlocked: true });

    await ensureAdminAccess();

    expect(warn).toHaveBeenCalledWith(
      `The bootstrap account ${ADMIN_EMAIL} is blocked or inactive; leaving it that way`,
    );
    expect((await UserModel.findById(user._id).lean())?.isBlocked).toBe(true);
  });
});

describe('ensureAdminAccess without SEED_ADMIN_PASSWORD', () => {
  beforeEach(() => jest.replaceProperty(env.seedAdmin, 'password', null));

  it('explains why nobody can administer an empty database', async () => {
    await ensureAdminAccess();

    expect(error).toHaveBeenCalledWith(expect.stringContaining('SEED_ADMIN_PASSWORD is not set'));
    expect(await UserModel.countDocuments()).toBe(0);
  });

  it('stays quiet when another administrator already exists', async () => {
    await seedUser('boss@test.co', randomUUID(), [ROLES.ADMIN]);

    await ensureAdminAccess();

    expect(error).not.toHaveBeenCalled();
    expect(await UserModel.countDocuments({ email: ADMIN_EMAIL })).toBe(0);
  });
});
