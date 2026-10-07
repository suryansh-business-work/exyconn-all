import { randomUUID } from 'node:crypto';
import { device, FROM, ME, signInAsTheEmployee, TO } from './resolverMocks';
import { trackerResolvers } from '../../../../src/modules/tracker/tracker.resolvers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const Mutation = trackerResolvers.Mutation;
const app: GraphQLContext = { user: null, ip: 'caller-address' };
// Built at runtime: nothing here is a real credential.
const PASSWORD = process.env.TEST_TRACKER_PASSWORD ?? randomUUID();
const DEVICE = { deviceId: 'laptop-1', platform: 'darwin' };

beforeEach(() => {
  signInAsTheEmployee();
});

describe('signing the app in', () => {
  it('signs in with the caller’s address and answers serialized ids', async () => {
    device.login.mockResolvedValue({
      token: 'device-token',
      user: { _id: ME, name: 'Asha' },
      consentRequired: true,
      settings: { _id: 'settings-1' },
    });

    const result = await Mutation.trackerLogin(
      null,
      { email: 'asha@exyconn.com', password: PASSWORD, device: DEVICE },
      app,
    );

    expect(device.login).toHaveBeenCalledWith('asha@exyconn.com', PASSWORD, DEVICE, app.ip);
    expect(result).toEqual({
      token: 'device-token',
      user: { _id: ME, id: ME, name: 'Asha' },
      consentRequired: true,
      settings: { _id: 'settings-1', id: 'settings-1' },
    });
  });

  it('allows one sign-in per request, so aliases cannot batch password guesses', async () => {
    device.login.mockResolvedValue({ token: 't', user: { _id: ME }, settings: { _id: 's' } });
    const request: GraphQLContext = { user: null };
    const args = { email: 'asha@exyconn.com', password: PASSWORD, device: DEVICE };

    await Mutation.trackerLogin(null, args, request);

    await expect(Mutation.trackerLogin(null, args, request)).rejects.toThrow(
      'Only one sign-in is allowed per request.',
    );
    expect(device.login).toHaveBeenCalledTimes(1);
  });
});

describe('what a device token may write', () => {
  it('accepts consent and marks attendance for the token’s own employee and zone', async () => {
    device.acceptConsent.mockResolvedValue(true);
    device.me.mockResolvedValue({ timezone: 'Asia/Kolkata' });
    device.markAttendance.mockResolvedValue({ attendanceMarked: true });

    await expect(Mutation.trackerAcceptConsent(null, { signedName: 'Asha' }, app)).resolves.toBe(
      true,
    );
    await expect(
      Mutation.trackerMarkAttendance(null, { status: 'PRESENT', note: null }, app),
    ).resolves.toEqual({ attendanceMarked: true });

    expect(device.acceptConsent).toHaveBeenCalledWith(ME, 'Asha');
    expect(device.me).toHaveBeenCalledWith(ME, 'laptop-1');
    expect(device.markAttendance).toHaveBeenCalledWith(ME, 'Asia/Kolkata', 'PRESENT', null);
  });

  it('keeps the device alive and answers the same payload as trackerMe', async () => {
    device.heartbeat.mockResolvedValue({
      user: { _id: ME },
      settings: { _id: 'settings-1' },
      notices: [],
      unreadMessages: 0,
    });

    const state = await Mutation.trackerHeartbeat(null, { device: DEVICE }, app);

    expect(device.heartbeat).toHaveBeenCalledWith(ME, 'laptop-1', DEVICE);
    expect(state).toMatchObject({ user: { id: ME }, settings: { id: 'settings-1' }, notices: [] });
  });

  it('starts, stops and fills sessions only as the token’s own employee', async () => {
    device.startSession.mockResolvedValue({ _id: 'session-1' });
    device.stopSession.mockResolvedValue({ _id: 'session-1', status: 'stopped' });
    device.syncIntervals.mockResolvedValue(4);
    device.uploadScreenshot.mockResolvedValue({ _id: 'shot-1' });
    const input = { sessionId: 'session-1', intervalStartedAt: FROM, capturedAt: FROM, image: 'x' };

    const started = await Mutation.trackerStartSession(
      null,
      { startedAt: FROM, projectId: 'p1', taskId: 't1' },
      app,
    );
    const stopped = await Mutation.trackerStopSession(
      null,
      { sessionId: 'session-1', endedAt: TO },
      app,
    );
    const synced = await Mutation.trackerSyncIntervals(
      null,
      { sessionId: 'session-1', intervals: [] },
      app,
    );
    const shot = await Mutation.trackerUploadScreenshot(null, { input }, app);

    expect(device.startSession).toHaveBeenCalledWith(ME, 'laptop-1', FROM, 'p1', 't1');
    expect(device.stopSession).toHaveBeenCalledWith(ME, 'session-1', TO);
    expect(device.syncIntervals).toHaveBeenCalledWith(ME, 'session-1', []);
    expect(device.uploadScreenshot).toHaveBeenCalledWith(ME, input);
    expect([started, stopped, shot].map((doc) => doc.id)).toEqual([
      'session-1',
      'session-1',
      'shot-1',
    ]);
    expect(synced).toBe(4);
  });

  it('sets the token’s own timezone', async () => {
    device.setTimezone.mockResolvedValue({ _id: 'g1', timezone: 'Europe/Paris' });

    await expect(
      Mutation.trackerSetTimezone(null, { timezone: 'Europe/Paris' }, app),
    ).resolves.toMatchObject({ id: 'g1', timezone: 'Europe/Paris' });
    expect(device.setTimezone).toHaveBeenCalledWith(ME, 'Europe/Paris');
  });
});
