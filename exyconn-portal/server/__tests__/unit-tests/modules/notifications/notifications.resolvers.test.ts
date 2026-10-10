import { print } from 'graphql';
import {
  NotificationModel,
  NotificationPreferenceModel,
  notificationsResolvers,
  notificationsTypeDefs,
} from '../../../../src/modules/notifications';
import { DEFAULT_CHANNELS } from '../../../../src/modules/notifications/preferences.service';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { Types } from 'mongoose';

const Q = notificationsResolvers.Query;
const M = notificationsResolvers.Mutation;

const ME = 'emp-1';
const asMe: GraphQLContext = {
  user: { id: ME, roles: [ROLES.EMPLOYEE], email: 'me@exyconn.com' },
};
const anonymous: GraphQLContext = { user: null };

const seedNote = (employeeId: string, title: string, read = false) =>
  NotificationModel.create({ employeeId, kind: 'GENERAL', title, read });

describe('the signed-in person’s notifications', () => {
  it('lists only their own, newest first', async () => {
    await seedNote(ME, 'Older');
    await new Promise((resolve) => setTimeout(resolve, 5));
    await seedNote(ME, 'Newer');
    await seedNote('someone-else', 'Not mine');

    const rows = (await Q.myNotifications(null, {}, asMe)) as unknown as Array<{
      title: string;
      id: string;
    }>;

    expect(rows.map((row) => row.title)).toEqual(['Newer', 'Older']);
    expect(rows.every((row) => typeof row.id === 'string')).toBe(true);
  });

  it('counts only their unread ones', async () => {
    await seedNote(ME, 'Unread');
    await seedNote(ME, 'Read', true);
    await seedNote('someone-else', 'Not mine');

    await expect(Q.myUnreadNotificationCount(null, {}, asMe)).resolves.toBe(1);
  });

  it('reads their preferences, defaults included', async () => {
    const preferences = await Q.myNotificationPreferences(null, {}, asMe);

    expect(preferences.find((row) => row.kind === 'LEAVE')).toEqual({
      kind: 'LEAVE',
      ...DEFAULT_CHANNELS,
    });
  });

  it('refuses somebody who is not signed in', async () => {
    await expect(Q.myUnreadNotificationCount(null, {}, anonymous)).rejects.toThrow(
      'Authentication required',
    );
    await expect(Q.myNotificationPreferences(null, {}, anonymous)).rejects.toThrow(
      'Authentication required',
    );
  });
});

describe('marking notifications read', () => {
  it('marks one of their own as read', async () => {
    const note = await seedNote(ME, 'Hello');

    await expect(M.markNotificationRead(null, { id: note._id.toHexString() }, asMe)).resolves.toBe(
      true,
    );

    expect((await NotificationModel.findById(note._id).lean())?.read).toBe(true);
  });

  it('will not touch somebody else’s, and says nothing matched', async () => {
    const note = await seedNote('someone-else', 'Hello');

    await expect(M.markNotificationRead(null, { id: note._id.toHexString() }, asMe)).resolves.toBe(
      false,
    );
    expect((await NotificationModel.findById(note._id).lean())?.read).toBe(false);
  });

  it('reports false for a notification that does not exist', async () => {
    const id = new Types.ObjectId().toHexString();

    await expect(M.markNotificationRead(null, { id }, asMe)).resolves.toBe(false);
  });

  it('marks all of their unread ones and returns how many changed', async () => {
    await seedNote(ME, 'One');
    await seedNote(ME, 'Two');
    await seedNote(ME, 'Already', true);
    await seedNote('someone-else', 'Not mine');

    await expect(M.markAllNotificationsRead(null, {}, asMe)).resolves.toBe(2);

    await expect(NotificationModel.countDocuments({ read: false })).resolves.toBe(1);
  });
});

describe('setMyNotificationPreference', () => {
  it('stores the choice for the signed-in person and returns the full set', async () => {
    const preferences = await M.setMyNotificationPreference(
      null,
      { input: { kind: 'PAYROLL', inPortal: false, email: true } },
      asMe,
    );

    expect(preferences.find((row) => row.kind === 'PAYROLL')).toEqual({
      kind: 'PAYROLL',
      inPortal: false,
      email: true,
    });
    const stored = await NotificationPreferenceModel.find({ employeeId: ME }).lean();
    expect(stored).toHaveLength(1);
  });

  it('updates the same row when the choice changes again', async () => {
    const input = { kind: 'PAYROLL', inPortal: false, email: true };
    await M.setMyNotificationPreference(null, { input }, asMe);
    await M.setMyNotificationPreference(null, { input: { ...input, inPortal: true } }, asMe);

    const stored = await NotificationPreferenceModel.find({ employeeId: ME }).lean();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ inPortal: true, email: true });
  });
});

describe('the notifications schema', () => {
  it('declares the operations the resolvers serve', () => {
    const schema = print(notificationsTypeDefs);

    for (const operation of [...Object.keys(Q), ...Object.keys(M)]) {
      expect(schema).toContain(operation);
    }
  });
});
