import { NotificationModel } from './notification.model';
import { notificationsTypeDefs } from './notifications.typeDefs';
import { createMyRecordsResolver } from '../../lib/employeeScope';
import { assertAuthenticated, assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { broadcast, type BroadcastInput } from './notifications.service';
import { readPreferences, setPreference } from './preferences.service';
import type { GraphQLContext } from '../../middleware/auth';

export const notificationsResolvers = {
  Query: {
    myNotifications: createMyRecordsResolver(NotificationModel as never, { createdAt: -1 }),
    myUnreadNotificationCount: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return NotificationModel.countDocuments({ employeeId: user.id, read: false });
    },
    myNotificationPreferences: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return readPreferences(user.id);
    },
  },
  Mutation: {
    markNotificationRead: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const res = await NotificationModel.updateOne(
        { _id: id, employeeId: user.id },
        { read: true },
      );
      return res.matchedCount > 0;
    },
    sendNotification: async (
      _p: unknown,
      { input }: { input: BroadcastInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, [ROLES.HR]);
      return { recipients: await broadcast(input) };
    },
    setMyNotificationPreference: async (
      _p: unknown,
      { input }: { input: { kind: string; inPortal: boolean; email: boolean } },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      return setPreference(user.id, input.kind, {
        inPortal: input.inPortal,
        email: input.email,
      });
    },
    markAllNotificationsRead: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const res = await NotificationModel.updateMany(
        { employeeId: user.id, read: false },
        { read: true },
      );
      return res.modifiedCount;
    },
  },
};
export { notificationsTypeDefs, NotificationModel };
export { notify, notifyBestEffort, notifyEveryone } from './notifications.service';
export { deliver } from './delivery';
export { readPreferences, setPreference, channelsFor } from './preferences.service';
export { NotificationPreferenceModel } from './preference.model';
