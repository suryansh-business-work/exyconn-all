import { Types } from 'mongoose';
import { OrganizationModel, organizationsResolvers } from '../../../../src/modules/organizations';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { runAsPlatform } from '../../../../src/lib/tenant';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const { Query, Mutation, Organization } = organizationsResolvers;

const ctxAs = (roles: Role[]): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), email: 'root@platform.example', roles },
});
const superAdmin = ctxAs([ROLES.SUPER_ADMIN]);
const companyAdmin = ctxAs([ROLES.ADMIN]);

async function company(name: string): Promise<string> {
  const created = await runAsPlatform(() =>
    OrganizationModel.create({ name, slug: name.toLowerCase(), currency: 'USD' }),
  );
  return created._id.toHexString();
}

/** The audit rows written for one organization, oldest first. */
const auditOf = (id: string) =>
  runAsPlatform(() =>
    AuditLogModel.find({ module: 'Organization', entityId: id }).sort({ _id: 1 }).lean(),
  );

describe('every organization change is audited', () => {
  it('records a create', async () => {
    const created = await Mutation.createOrganization(
      null,
      { input: { name: 'Initech', currency: 'USD' } },
      superAdmin,
    );

    const [row] = await auditOf(created.id);
    expect(row).toMatchObject({
      action: 'CREATE',
      entityLabel: 'Initech',
      summary: 'Created organization Initech',
      actorEmail: 'root@platform.example',
      changes: '',
    });
  });

  it('records an update with what changed', async () => {
    const id = await company('Alpha');

    await Mutation.updateOrganization(
      null,
      { id, input: { name: 'Alpha Group', city: 'Pune', currency: 'USD' } },
      superAdmin,
    );

    const [row] = await auditOf(id);
    expect(row).toMatchObject({ action: 'UPDATE', summary: 'Updated organization Alpha Group' });
    expect(JSON.parse(row.changes ?? '')).toEqual({
      name: { from: 'Alpha', to: 'Alpha Group' },
      city: { from: '', to: 'Pune' },
    });
  });

  it('records a suspension and a reactivation', async () => {
    const id = await company('Alpha');

    await Mutation.setOrganizationStatus(null, { id, status: 'SUSPENDED' }, superAdmin);
    await Mutation.setOrganizationStatus(null, { id, status: 'ACTIVE' }, superAdmin);

    expect((await auditOf(id)).map((row) => row.summary)).toEqual([
      'Suspended organization Alpha',
      'Reactivated organization Alpha',
    ]);
  });

  it('records an appointed administrator as a role change', async () => {
    const id = await company('Alpha');

    await Mutation.assignOrganizationAdmin(
      null,
      { organizationId: id, input: { name: 'Dana', email: 'dana@alpha.example' } },
      superAdmin,
    );

    const [row] = await auditOf(id);
    expect(row).toMatchObject({
      action: 'ROLE_CHANGE',
      entityLabel: 'dana@alpha.example',
      summary: 'Appointed dana@alpha.example as administrator',
    });
  });

  it('records each invited person with their portals', async () => {
    const id = await company('Alpha');

    const invited = await Mutation.inviteOrganizationMembers(
      null,
      {
        organizationId: id,
        members: [
          { name: 'Kim', email: 'kim@alpha.example', roles: [ROLES.EMPLOYEE, ROLES.HR] },
          { name: 'Pat', email: 'pat@alpha.example', roles: [ROLES.FINANCE] },
        ],
      },
      superAdmin,
    );

    expect(invited.map((user) => user.id)).toEqual([expect.any(String), expect.any(String)]);
    expect((await auditOf(id)).map((row) => row.summary)).toEqual([
      'Invited kim@alpha.example with EMPLOYEE, HR',
      'Invited pat@alpha.example with FINANCE',
    ]);
  });

  it('refuses an invite from a company administrator, recording nothing', async () => {
    const id = await company('Alpha');

    await expect(
      Mutation.inviteOrganizationMembers(
        null,
        {
          organizationId: id,
          members: [{ name: 'Kim', email: 'kim@alpha.example', roles: [ROLES.EMPLOYEE] }],
        },
        companyAdmin,
      ),
    ).rejects.toThrow(/do not have access/);
    expect(await auditOf(id)).toHaveLength(0);
  });
});

describe('organizationHistory', () => {
  it('returns one organization’s rows, newest first, to a platform administrator only', async () => {
    const id = await company('Alpha');
    const other = await company('Beta');
    const row = (
      entityId: string,
      summary: string,
      createdAt: string,
      module = 'Organization',
    ) => ({
      action: 'UPDATE',
      module,
      entityId,
      summary,
      createdAt: new Date(createdAt),
    });
    await AuditLogModel.collection.insertMany([
      row(id, 'first', '2026-10-01T00:00:00Z'),
      row(id, 'third', '2026-10-03T00:00:00Z'),
      row(id, 'second', '2026-10-02T00:00:00Z'),
      row(other, 'another company', '2026-10-04T00:00:00Z'),
      row(id, 'another module', '2026-10-05T00:00:00Z', 'Invoice'),
    ]);

    const history = await Query.organizationHistory(null, { id }, superAdmin);

    expect(history.map((entry) => entry.summary)).toEqual(['third', 'second', 'first']);
    expect(history[0].id).toEqual(expect.any(String));
    await expect(Query.organizationHistory(null, { id }, companyAdmin)).rejects.toThrow(
      /do not have access/,
    );
  });
});

describe('details on a row written before they existed', () => {
  // The detail resolvers are built from a list, so their names are not in the static type.
  const detail = Organization as unknown as Record<string, (row: object) => string>;

  it('reads a missing detail as empty and passes a stored one through', () => {
    expect(detail.website({})).toBe('');
    expect(detail.description({ description: null })).toBe('');
    expect(detail.city({ city: 'Pune' })).toBe('Pune');
  });
});
