import { ROLES } from '../../constants/roles';
import { currentOrganizationId } from '../../lib/tenant';
import { badRequest } from '../../utils/errors';
import { UserModel } from '../admin/user.model';
import { planAccessFor } from './access';

/**
 * Seats: the active people a company has, against its plan's limit. Runs in the company's own
 * scope (Admin › Users, an invitation, a sign-up), so the count is that company's alone. A
 * platform administrator is not a seat.
 */
export function seatsUsed(): Promise<number> {
  return UserModel.countDocuments({ isActive: true, roles: { $ne: ROLES.SUPER_ADMIN } });
}

/** The plan's seat limit for the company in scope; 0 is unlimited. */
async function seatLimit(): Promise<number> {
  return (await planAccessFor(currentOrganizationId())).seatLimit;
}

function refuse(limit: number): never {
  badRequest(
    `Your plan seats ${limit} active people and every seat is taken. Deactivate someone or upgrade the plan in Admin › Billing.`,
  );
}

/** Refuses up front when adding one more active person would pass the limit. */
export async function assertSeatAvailable(): Promise<void> {
  const limit = await seatLimit();
  if (limit > 0 && (await seatsUsed()) >= limit) {
    refuse(limit);
  }
}

/**
 * The second half of the check, after the person has been made active. Two administrators
 * adding people at the same moment both pass `assertSeatAvailable`; recounting after the write
 * catches that, and `undo` puts this one back before the refusal, so the limit is never passed.
 */
export async function confirmSeatOrUndo(undo: () => Promise<unknown>): Promise<void> {
  const limit = await seatLimit();
  if (limit > 0 && (await seatsUsed()) > limit) {
    await undo();
    refuse(limit);
  }
}
