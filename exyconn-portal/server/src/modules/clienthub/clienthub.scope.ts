import { ROLES } from '../../constants/roles';
import { runForOrganization } from '../../lib/tenant';
import { assertPermission } from '../../lib/permissions';
import { unauthenticated } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';
import type { PermissionAction } from '../permissions/permission.model';
import type { ClientHubContact } from './clienthub.auth';

/**
 * Runs client hub work for the signed-in contact, inside their client's company. The request
 * context itself carries no company (see middleware/auth), so nothing else a contact can reach
 * ever sees company data.
 */
export function asContact<T>(ctx: GraphQLContext, work: (contact: ClientHubContact) => Promise<T>) {
  const contact = ctx.clientContact;
  if (!contact) {
    unauthenticated('Sign in to the client hub.');
  }
  return runForOrganization(contact.organizationId, () => work(contact));
}

/** What a client sees in the hub, and who may see it, is an administrator's call (Clients). */
export const clientStaffGuard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, 'Client', [ROLES.ADMIN], action);
