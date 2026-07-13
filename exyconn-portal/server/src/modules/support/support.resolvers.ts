import { SupportTicketModel } from '../employee/support.model';
import { UserModel } from '../admin/user.model';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { notFound } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';

const supportTeam = [ROLES.SUPPORT];

/** Support-team console: read every ticket (with employee names) and update status. */
export const supportResolvers = {
  Query: {
    listSupportTickets: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, supportTeam);
      const tickets = await SupportTicketModel.find().sort({ createdAt: -1 }).lean();

      // Resolve employee display names in one query (avoids N+1).
      const ids = [...new Set(tickets.map((t) => t.employeeId))];
      const users = await UserModel.find({ _id: { $in: ids } })
        .select('name')
        .lean();
      const nameById = new Map(users.map((u) => [u._id.toString(), u.name]));

      return withIds(
        tickets.map((t) => ({ ...t, employeeName: nameById.get(t.employeeId) ?? null })),
      );
    },
  },
  Mutation: {
    setSupportTicketStatus: async (
      _p: unknown,
      { id, status }: { id: string; status: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, supportTeam);
      const doc = await SupportTicketModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
      if (!doc) notFound('SupportTicket');
      return withId(doc);
    },
  },
};
