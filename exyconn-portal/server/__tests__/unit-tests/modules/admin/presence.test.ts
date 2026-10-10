import {
  ONLINE_WINDOW_MS,
  isOnline,
  presenceResolvers,
  recordActivity,
  resetPresenceThrottle,
} from '../../../../src/modules/admin/presence';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { logger } from '../../../../src/utils/logger';
import { ROLES } from '../../../../src/constants/roles';

const T0 = Date.UTC(2026, 0, 5, 9);

async function person() {
  const user = await UserModel.create({
    name: 'Asha',
    email: 'asha@exyconn.com',
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
  });
  return user._id.toHexString();
}

const lastActive = async (id: string) => (await UserModel.findById(id).lean())?.lastActiveAt;

beforeEach(() => resetPresenceThrottle());
afterEach(() => jest.restoreAllMocks());

describe('recordActivity', () => {
  it('stamps when the person last used the API', async () => {
    const id = await person();

    await recordActivity(id, T0);

    expect(await lastActive(id)).toEqual(new Date(T0));
  });

  it('writes at most once a minute per person', async () => {
    const id = await person();

    await recordActivity(id, T0);
    await recordActivity(id, T0 + 59_999);
    expect(await lastActive(id)).toEqual(new Date(T0));

    await recordActivity(id, T0 + 60_000);
    expect(await lastActive(id)).toEqual(new Date(T0 + 60_000));
  });

  it('writes again once the throttle is reset', async () => {
    const id = await person();
    await recordActivity(id, T0);

    resetPresenceThrottle();
    await recordActivity(id, T0 + 1_000);

    expect(await lastActive(id)).toEqual(new Date(T0 + 1_000));
  });

  it('logs a failed write instead of failing the request', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    jest.spyOn(UserModel, 'updateOne').mockImplementationOnce(() => {
      throw new Error('db down');
    });

    await expect(recordActivity('65b000000000000000000001', T0)).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ userId: '65b000000000000000000001' }),
      'Could not record user activity',
    );
  });

  it('uses the current time when none is given', async () => {
    const id = await person();
    const before = Date.now();

    await recordActivity(id);

    expect((await lastActive(id))?.getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe('isOnline', () => {
  it('is online inside the window and offline at its edge', () => {
    expect(isOnline(new Date(T0), T0 + ONLINE_WINDOW_MS - 1)).toBe(true);
    expect(isOnline(new Date(T0), T0 + ONLINE_WINDOW_MS)).toBe(false);
  });

  it('is offline for somebody never seen', () => {
    expect(isOnline(null, T0)).toBe(false);
    expect(isOnline(undefined, T0)).toBe(false);
  });

  it('answers the User.isOnline field against the clock', () => {
    expect(presenceResolvers.User.isOnline({ lastActiveAt: new Date() })).toBe(true);
    expect(presenceResolvers.User.isOnline({ lastActiveAt: new Date(T0) })).toBe(false);
    expect(presenceResolvers.User.isOnline({})).toBe(false);
  });
});
