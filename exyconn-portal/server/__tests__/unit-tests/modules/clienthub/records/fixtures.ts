import { ClientModel } from '../../../../../src/modules/clients/clients.model';
import { ClientContactModel } from '../../../../../src/modules/clienthub/contact.model';
import { ROLES, type Role } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import type { ClientHubContact } from '../../../../../src/modules/clienthub/clienthub.auth';

/** A client with one active and one switched-off hub contact. */
export async function seedClient(company: string, contactEmail: string) {
  const client = await ClientModel.create({
    name: `${company} Ltd`,
    email: `billing@${company.toLowerCase()}.test`,
    company,
  });
  const clientId = client._id.toHexString();
  await ClientContactModel.create([
    { clientId, name: `${company} Contact`, email: contactEmail },
    { clientId, name: 'Former', email: `former@${company.toLowerCase()}.test`, active: false },
  ]);
  return clientId;
}

export const staffContext = (
  organizationId: string,
  roles: Role[] = [ROLES.ADMIN],
  id = 'staff-1',
): GraphQLContext => ({
  user: { id, email: 'staff@exyconn.test', roles, organizationId },
});

export function contactContext(
  organizationId: string,
  clientId: string,
  email: string,
): GraphQLContext {
  const contact: ClientHubContact = {
    id: `contact-${clientId}`,
    clientId,
    name: 'Hub Contact',
    email,
    organizationId,
  };
  return { user: null, clientContact: contact };
}
