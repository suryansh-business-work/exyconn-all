import { isValidObjectId } from 'mongoose';
import { assertPermission } from '../../lib/permissions';
import { notFound } from '../../utils/errors';
import { withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import { UserModel } from '../admin/user.model';
import { AssetModel } from '../assets/asset.model';
import { LicenceModel } from '../assets/licence.model';
import { SupportTicketModel } from '../employee/support.model';
import { ItAccessRequestModel } from './models';
import { activeAccessOf, ACCESS_AWAITING } from './access';
import { INSIGHTS_MODULE, itOnly } from './dashboard';
import { IT_TICKET, OPEN_TICKET } from './itsm.queries';

/** Requests still in flight: waiting on a decision, or approved and not yet carried out. */
const IN_FLIGHT = [...ACCESS_AWAITING, 'APPROVED'];

/**
 * One employee as IT sees them: their account, the devices they hold, the licence seats and
 * application access they have, and what is still being worked on for them.
 */
export async function itEmployeeProfile(
  _p: unknown,
  { employeeId }: { employeeId: string },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, INSIGHTS_MODULE, itOnly, 'VIEW');
  const user = isValidObjectId(employeeId)
    ? await UserModel.findById(employeeId)
        .select('name email department designation roles isActive isBlocked lastActiveAt')
        .lean()
    : null;
  if (!user) {
    notFound('Employee');
  }
  const [assets, licences, access, openRequests, openTickets] = await Promise.all([
    AssetModel.find({ assignedToId: employeeId }).sort({ assetTag: 1 }).lean(),
    LicenceModel.find({ assigneeIds: employeeId })
      .select('name vendor renewalDate status')
      .sort({ renewalDate: 1 })
      .lean(),
    activeAccessOf([employeeId]),
    ItAccessRequestModel.find({ employeeId, status: { $in: IN_FLIGHT } })
      .sort({ createdAt: -1 })
      .lean(),
    SupportTicketModel.countDocuments({ employeeId, ...IT_TICKET, ...OPEN_TICKET }),
  ]);
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    department: user.department ?? null,
    designation: user.designation ?? null,
    roles: user.roles ?? [],
    isActive: user.isActive,
    isBlocked: user.isBlocked ?? false,
    lastActiveAt: user.lastActiveAt ?? null,
    assets: withIds(assets),
    licences: withIds(licences),
    access,
    openRequests: withIds(openRequests),
    openTickets,
  };
}
