import mongoose from 'mongoose';
import { clientHubResolvers } from '../../../../src/modules/clienthub';
import { ClientContactModel } from '../../../../src/modules/clienthub/contact.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { emailer } from '../../../../src/modules/email/email.service';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';

const organizationId = useTestOrganization();
const MISSING = '64b000000000000000000099';

const staff = (roles: Role[]): GraphQLContext => ({
  user: { id: 'admin-1', email: 'admin@exyconn.com', roles, organizationId },
});

let clientId: string;

beforeEach(async () => {
  jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
  const client = await ClientModel.create({
    name: 'Dana',
    email: 'dana@acme.test',
    company: 'Acme',
  });
  clientId = String(client._id);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('client hub sign-in mutations', () => {
  it('rate-limits code requests per connection, pooling callers with no address', async () => {
    const { Mutation } = clientHubResolvers;
    const email = { email: 'ghost@acme.test' };
    const limited = (key: string) =>
      mongoose.connection.collection('rate_limits').findOne({ key: `clienthub_code_ip:${key}` });

    await expect(Mutation.requestClientHubCode(null, email, { user: null })).rejects.toThrow(
      /does not have client hub access/,
    );
    await expect(
      Mutation.requestClientHubCode(null, email, { user: null, ip: 'test-conn' }),
    ).rejects.toThrow(/does not have client hub access/);

    expect(await limited('unknown')).not.toBeNull();
    expect(await limited('test-conn')).not.toBeNull();
  });

  it('refuses a code for an address without access', async () => {
    await expect(
      clientHubResolvers.Mutation.verifyClientHubCode(null, {
        email: 'ghost@acme.test',
        code: '123456',
      }),
    ).rejects.toThrow(/expired/);
  });
});

describe('client hub access administration', () => {
  const { Query, Mutation } = clientHubResolvers;

  it('lets an administrator give access, and audits it', async () => {
    const input = { clientId, name: 'Dana Reyes', email: 'dana@acme.test' };

    const added = await Mutation.addClientContact(null, { input }, staff([ROLES.ADMIN]));

    expect(added).toMatchObject({ id: expect.any(String), email: 'dana@acme.test' });
    expect(await Query.clientContacts(null, { clientId }, staff([ROLES.ADMIN]))).toHaveLength(1);
    expect(await AuditLogModel.findOne({ entityId: added.id }).lean()).toMatchObject({
      action: 'CREATE',
      module: 'Client',
      summary: 'Gave dana@acme.test client hub access',
    });
  });

  it('audits switching access off and back on, then deletes it', async () => {
    const contact = await ClientContactModel.create({ clientId, name: 'D', email: 'd@acme.test' });
    const id = String(contact._id);
    const admin = staff([ROLES.ADMIN]);

    await Mutation.setClientContactActive(null, { id, active: false }, admin);
    await Mutation.setClientContactActive(null, { id, active: true }, admin);

    const summaries = await AuditLogModel.find({ entityId: id }).sort({ _id: 1 }).lean();
    expect(summaries.map((row) => row.summary)).toEqual([
      'Switched off client hub access for d@acme.test',
      'Restored client hub access for d@acme.test',
    ]);
    expect(await Mutation.deleteClientContact(null, { id }, admin)).toBe(true);
  });

  it('refuses anybody who is not an administrator', async () => {
    const hr = staff([ROLES.HR]);

    expect(await codeOf(Query.clientContacts(null, { clientId }, hr))).toBe('FORBIDDEN');
    expect(await codeOf(Mutation.deleteClientContact(null, { id: MISSING }, hr))).toBe('FORBIDDEN');
  });
});
