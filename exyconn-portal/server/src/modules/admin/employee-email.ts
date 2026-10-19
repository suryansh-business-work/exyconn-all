import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import { EMAIL_CODE_TTL_LABEL, consumeEmailCode, issueEmailCode } from '../../lib/emailCode';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { withId } from '../../utils/serialize';
import { emailer } from '../email/email.service';
import { recordAudit } from '../audit';
import { adminService } from './admin.service';
import { UserModel } from './user.model';
import type { GraphQLContext } from '../../middleware/auth';

/**
 * Proving an employee's addresses are theirs: HR sends a six-digit code to the official or the
 * personal address, the employee reads it back, and the address is stamped verified. The stamp
 * is cleared by `updateUser` whenever that address changes.
 */

export type EmployeeEmailKind = 'OFFICIAL' | 'PERSONAL';

/** Which record fields each kind reads and stamps. */
const FIELDS: Readonly<
  Record<EmployeeEmailKind, { address: 'email' | 'personalEmail'; stamp: string; label: string }>
> = {
  OFFICIAL: { address: 'email', stamp: 'emailVerifiedAt', label: 'official' },
  PERSONAL: { address: 'personalEmail', stamp: 'personalEmailVerifiedAt', label: 'personal' },
};

const requestLimiter = createLimiter({
  keyPrefix: 'employee_email_code',
  points: 5,
  durationSec: 60 * 60,
});
const verifyLimiter = createLimiter({
  keyPrefix: 'employee_email_verify',
  points: 15,
  durationSec: 15 * 60,
});

/** The employee and the address of this kind on their record; refuses when there is none. */
async function addressOf(employeeId: string, kind: EmployeeEmailKind) {
  const user = await adminService.getUser(employeeId);
  const address = user[FIELDS[kind].address];
  if (!address) {
    badRequest('This employee has no personal email on file.');
  }
  return { user, address };
}

async function requestCode(employeeId: string, kind: EmployeeEmailKind) {
  await enforceLimit(requestLimiter, `${employeeId}:${kind}`, 'codes for this address');
  const { user, address } = await addressOf(employeeId, kind);
  const code = await issueEmailCode('employee-email', address);
  try {
    await emailer.send({
      template: 'employee-email-code',
      to: address,
      variables: { name: user.name, code, expiresIn: EMAIL_CODE_TTL_LABEL },
      triggeredBy: 'Employee email verification',
    });
  } catch (error) {
    logger.error({ err: error, employeeId, kind }, 'Employee email code failed to send');
    badRequest('We could not send the code just now. Try again in a minute.');
  }
  return user;
}

async function verifyCode(employeeId: string, kind: EmployeeEmailKind, code: string) {
  await enforceLimit(verifyLimiter, `${employeeId}:${kind}`, 'code attempts');
  const { address } = await addressOf(employeeId, kind);
  await consumeEmailCode('employee-email', address, code);
  const { address: field, stamp } = FIELDS[kind];
  // Matched on the address too: one changed while the code was out proves nothing about it.
  const user = await UserModel.findOneAndUpdate(
    { _id: employeeId, [field]: address },
    { [stamp]: new Date() },
    { new: true },
  ).lean();
  if (!user) {
    badRequest('The address changed after the code was sent. Send a new code.');
  }
  return user;
}

export const employeeEmailResolvers = {
  Mutation: {
    requestEmployeeEmailCode: async (
      _p: unknown,
      { employeeId, kind }: { employeeId: string; kind: EmployeeEmailKind },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, 'User', [ROLES.HR], 'EDIT');
      const user = await requestCode(employeeId, kind);
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: 'User',
        entityId: employeeId,
        entityLabel: user.email,
        summary: `Sent a verification code to the ${FIELDS[kind].label} email of ${user.name}`,
      });
      return true;
    },
    verifyEmployeeEmailCode: async (
      _p: unknown,
      { employeeId, kind, code }: { employeeId: string; kind: EmployeeEmailKind; code: string },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, 'User', [ROLES.HR], 'EDIT');
      const user = withId(await verifyCode(employeeId, kind, code));
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: 'User',
        entityId: employeeId,
        entityLabel: user.email,
        summary: `Verified the ${FIELDS[kind].label} email of ${user.name}`,
      });
      return user;
    },
  },
};
