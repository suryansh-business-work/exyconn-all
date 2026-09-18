import { isValidObjectId } from 'mongoose';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import { withId } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import { UserModel } from '../admin/user.model';
import { adminService } from '../admin/admin.service';
import { recordAudit } from '../audit';
import { ExitRecordModel } from '../exit/exit.model';
import { ACCESS_MODULE } from './access';

/** Accounts IT may never switch off: those that administer the company or the platform. */
const PROTECTED_ROLES: ReadonlySet<string> = new Set([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

/**
 * Switches off a LEAVER's portal account from IT's offboarding screen.
 *
 * Deliberately narrow: Admin's own `setUserActive` stays the way to deactivate anybody; IT
 * may only disable someone HR has an exit on record for, never an administrator, and never
 * itself — so the power to lock people out does not quietly become IT's in general. It runs
 * Admin's service and writes the same audit entry, so the record is identical either way.
 */
export async function itDisableLeaverAccount(
  _p: unknown,
  { employeeId }: { employeeId: string },
  ctx: GraphQLContext,
) {
  const caller = await assertPermission(ctx, ACCESS_MODULE, [ROLES.IT], 'EDIT');
  if (!isValidObjectId(employeeId)) {
    notFound('Employee');
  }
  if (caller.id === employeeId) {
    badRequest('You cannot disable your own account');
  }
  const [user, exit] = await Promise.all([
    UserModel.findById(employeeId).select('name email roles').lean(),
    ExitRecordModel.findOne({ employeeId, stage: { $ne: 'WITHDRAWN' } }).lean(),
  ]);
  if (!user) {
    notFound('Employee');
  }
  if (!exit) {
    badRequest('Only an employee HR has recorded as leaving can be disabled from IT');
  }
  if (user.roles.some((role) => PROTECTED_ROLES.has(role))) {
    forbidden("An administrator's account can only be disabled in Admin");
  }
  const updated = await adminService.setUserActive(employeeId, false);
  await recordAudit(ctx, {
    action: 'UPDATE',
    module: 'User',
    entityId: employeeId,
    entityLabel: user.email,
    summary: `Deactivated leaver ${user.name} from IT offboarding`,
  });
  return withId(updated);
}
