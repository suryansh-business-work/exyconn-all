import { Types } from 'mongoose';
import { ROLES } from '../../../../src/constants/roles';
import {
  assertEmployee,
  assertTrackerDevice,
  deviceMayRun,
  deviceTokenIsLive,
  hashToken,
} from '../../../../src/modules/tracker/tracker.auth';
import { TrackerAccessModel, TrackerDeviceModel } from '../../../../src/modules/tracker/models';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

const TOKEN = `device-token-${new Types.ObjectId().toHexString()}`;

/** A device row for `userId`, holding the hash of TOKEN unless told otherwise. */
function device(userId: string, overrides: Record<string, unknown> = {}) {
  return TrackerDeviceModel.create({
    userId,
    deviceId: 'laptop-1',
    tokenHash: hashToken(TOKEN),
    platform: 'darwin',
    ...overrides,
  });
}

const deviceCtx = (userId: string, deviceId = 'laptop-1'): GraphQLContext => ({
  user: { id: userId, roles: [ROLES.EMPLOYEE], email: 'emp@exyconn.com', deviceId },
});

describe('which requests a device token may run', () => {
  it('lets through a document that selects only tracker root fields', () => {
    expect(
      deviceMayRun('query Me { trackerMe { user { id } } myTrackerTotals { activeMs } }'),
    ).toBe(true);
    expect(deviceMayRun('mutation { trackerHeartbeat { timezone } }')).toBe(true);
  });

  it('ignores fragment definitions sitting beside a tracker operation', () => {
    const query = 'query { trackerMe { ...Me } } fragment Me on TrackerMe { timezone }';
    expect(deviceMayRun(query)).toBe(true);
  });

  it('refuses a portal field, even next to a tracker one', () => {
    expect(deviceMayRun('query { trackerMe { timezone } users { id } }')).toBe(false);
  });

  it('refuses a fragment spread at the root, which could hide any field', () => {
    expect(deviceMayRun('query { ...Root } fragment Root on Query { users { id } }')).toBe(false);
  });

  it('refuses a request with no readable document', () => {
    expect(deviceMayRun(undefined)).toBe(false);
    expect(deviceMayRun(['query { trackerMe { timezone } }'])).toBe(false);
    expect(deviceMayRun('query { trackerMe {')).toBe(false);
  });
});

describe('whether a device token is still live', () => {
  it('is live while the row holds this token and is in service', async () => {
    const userId = new Types.ObjectId().toHexString();
    await device(userId);

    await expect(deviceTokenIsLive(userId, 'laptop-1', TOKEN)).resolves.toBe(true);
  });

  it('is dead once a later sign-in replaced the token on the same device', async () => {
    const userId = new Types.ObjectId().toHexString();
    await device(userId, { tokenHash: hashToken(`${TOKEN}-newer`) });

    await expect(deviceTokenIsLive(userId, 'laptop-1', TOKEN)).resolves.toBe(false);
  });

  it('is dead for a revoked device, or one bound to somebody else', async () => {
    const userId = new Types.ObjectId().toHexString();
    await device(userId, { isActive: false, revokedAt: new Date() });

    await expect(deviceTokenIsLive(userId, 'laptop-1', TOKEN)).resolves.toBe(false);
    await expect(
      deviceTokenIsLive(new Types.ObjectId().toHexString(), 'laptop-1', TOKEN),
    ).resolves.toBe(false);
  });

  it('is dead for an active row that still carries a revocation date', async () => {
    const userId = new Types.ObjectId().toHexString();
    await device(userId, { revokedAt: new Date() });

    await expect(deviceTokenIsLive(userId, 'laptop-1', TOKEN)).resolves.toBe(false);
  });
});

describe('assertTrackerDevice', () => {
  it('refuses a portal session that carries no device', async () => {
    const ctx: GraphQLContext = {
      user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.EMPLOYEE], email: 'a@b.co' },
    };

    await expect(codeOf(assertTrackerDevice(ctx))).resolves.toBe('UNAUTHENTICATED');
    await expect(codeOf(assertTrackerDevice({ user: null }))).resolves.toBe('UNAUTHENTICATED');
  });

  it('refuses a device whose row no longer exists', async () => {
    const userId = new Types.ObjectId().toHexString();
    await TrackerAccessModel.create({ userId, grantedBy: 'admin' });

    await expect(assertTrackerDevice(deviceCtx(userId))).rejects.toThrow(/revoked/);
  });

  it('refuses a device that is active but carries a revocation date', async () => {
    const userId = new Types.ObjectId().toHexString();
    await TrackerAccessModel.create({ userId, grantedBy: 'admin' });
    await device(userId, { revokedAt: new Date() });

    await expect(codeOf(assertTrackerDevice(deviceCtx(userId)))).resolves.toBe('UNAUTHENTICATED');
  });

  it('refuses a device whose employee never had a tracker grant', async () => {
    const userId = new Types.ObjectId().toHexString();
    await device(userId);

    await expect(codeOf(assertTrackerDevice(deviceCtx(userId)))).resolves.toBe('FORBIDDEN');
  });

  it('answers with the employee and device the token names', async () => {
    const userId = new Types.ObjectId().toHexString();
    await TrackerAccessModel.create({ userId, grantedBy: 'admin' });
    await device(userId);

    await expect(assertTrackerDevice(deviceCtx(userId))).resolves.toEqual({
      userId,
      deviceId: 'laptop-1',
    });
  });
});

describe('assertEmployee on a portal session', () => {
  it('answers with the signed-in user without asking for a device', async () => {
    const id = new Types.ObjectId().toHexString();
    const ctx: GraphQLContext = { user: { id, roles: [ROLES.EMPLOYEE], email: 'emp@exyconn.com' } };

    await expect(assertEmployee(ctx)).resolves.toMatchObject({ id });
  });
});
