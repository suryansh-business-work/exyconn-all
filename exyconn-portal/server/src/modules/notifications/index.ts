import { NotificationModel } from './notification.model';
import { notificationsTypeDefs } from './notifications.typeDefs';
import { createMyRecordsResolver } from '../../lib/employeeScope';
import { assertAuthenticated } from '../../middleware/roleGuard';
import type { GraphQLContext } from '../../middleware/auth';

export const notificationsResolvers = {
  Query: {
    myNotifications: createMyRecordsResolver(NotificationModel as never, { createdAt: -1 }),
    myUnreadNotificationCount: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return NotificationModel.countDocuments({ employeeId: user.id, read: false });
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
export { notify, notifyEveryone } from './notifications.service';
