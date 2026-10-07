import { resetWorkspaceStatusCache } from '../../../src/middleware/auth';
import { deviceMayRun, deviceTokenIsLive } from '../../../src/modules/tracker/tracker.auth';
import { sessionIsLive } from '../../../src/modules/auth/session.service';
import { signDeviceToken, signToken } from '../../../src/utils/jwt';
import { ROLES } from '../../../src/constants/roles';
import { contextOf, requestWith, seedCompany, seedPerson } from './authHarness';

jest.mock('../../../src/modules/admin/presence', () => ({
  recordActivity: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../src/modules/auth/session.service', () => ({
  sessionIsLive: jest.fn(),
}));
jest.mock('../../../src/modules/tracker/tracker.auth', () => ({
  deviceMayRun: jest.fn(),
  deviceTokenIsLive: jest.fn(),
}));

const TRACKER_QUERY = 'query TrackerMe { trackerMe { id } }';

async function employee() {
  const org = await seedCompany('acme');
  const person = await seedPerson(org, [ROLES.EMPLOYEE]);
  const claims = { id: person.id, email: person.email, roles: [ROLES.EMPLOYEE] };
  return { person, claims };
}

beforeEach(() => resetWorkspaceStatusCache());

describe('buildContext for a tracker device token', () => {
  it('stands for a tracker operation while its device row holds it', async () => {
    jest.mocked(deviceMayRun).mockReturnValue(true);
    jest.mocked(deviceTokenIsLive).mockResolvedValue(true);
    const { person, claims } = await employee();
    const token = signDeviceToken({ ...claims, deviceId: 'laptop-1' });
    const req = requestWith({
      headers: { authorization: `Bearer ${token}` },
      body: { query: TRACKER_QUERY },
    });
    const { ctx } = await contextOf(req);
    expect(ctx.deviceId).toBe('laptop-1');
    expect(ctx.user?.id).toBe(person.id);
    expect(deviceMayRun).toHaveBeenCalledWith(TRACKER_QUERY);
    expect(deviceTokenIsLive).toHaveBeenCalledWith(person.id, 'laptop-1', token);
  });

  it('reads the operation from the URL when there is no body', async () => {
    jest.mocked(deviceMayRun).mockReturnValue(true);
    jest.mocked(deviceTokenIsLive).mockResolvedValue(true);
    const { claims } = await employee();
    const token = signDeviceToken({ ...claims, deviceId: 'laptop-1' });
    const req = requestWith({
      headers: { authorization: `Bearer ${token}` },
      query: { query: TRACKER_QUERY },
    });
    await expect(contextOf(req)).resolves.toMatchObject({ ctx: { deviceId: 'laptop-1' } });
    expect(deviceMayRun).toHaveBeenCalledWith(TRACKER_QUERY);
  });

  it('never opens a portal operation, without even checking the device row', async () => {
    jest.mocked(deviceMayRun).mockReturnValue(false);
    const { claims } = await employee();
    const token = signDeviceToken({ ...claims, deviceId: 'laptop-1' });
    const req = requestWith({
      headers: { authorization: `Bearer ${token}` },
      body: { query: '{ me { id } }' },
    });
    await expect(contextOf(req)).resolves.toMatchObject({ ctx: { user: null } });
    expect(deviceTokenIsLive).not.toHaveBeenCalled();
  });

  it('stops working once the device is revoked', async () => {
    jest.mocked(deviceMayRun).mockReturnValue(true);
    jest.mocked(deviceTokenIsLive).mockResolvedValue(false);
    const { claims } = await employee();
    const token = signDeviceToken({ ...claims, deviceId: 'laptop-1' });
    const req = requestWith({ headers: { authorization: `Bearer ${token}` }, body: {} });
    await expect(contextOf(req)).resolves.toMatchObject({ ctx: { user: null } });
  });
});

describe('buildContext for a session-bound token', () => {
  it('stands only while its session does', async () => {
    const { person, claims } = await employee();
    const token = signToken({ ...claims, sid: 'session-1' });
    const req = requestWith({ headers: { authorization: `Bearer ${token}` } });

    jest.mocked(sessionIsLive).mockResolvedValueOnce(true);
    await expect(contextOf(req)).resolves.toMatchObject({ ctx: { user: { id: person.id } } });

    jest.mocked(sessionIsLive).mockResolvedValueOnce(false);
    await expect(contextOf(req)).resolves.toMatchObject({ ctx: { user: null } });
    expect(sessionIsLive).toHaveBeenCalledWith('session-1');
  });

  it('keeps a pre-session token working without asking about a session', async () => {
    const { person, claims } = await employee();
    const req = requestWith({ headers: { authorization: `Bearer ${signToken(claims)}` } });
    await expect(contextOf(req)).resolves.toMatchObject({ ctx: { user: { id: person.id } } });
    expect(sessionIsLive).not.toHaveBeenCalled();
  });
});
