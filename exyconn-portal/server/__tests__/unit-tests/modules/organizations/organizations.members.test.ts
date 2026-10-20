import { Types } from 'mongoose';
import { OrganizationModel, organizationService } from '../../../../src/modules/organizations';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../src/constants/roles';
import { organizationOf, runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';

/** A company written straight to the model: these tests need one to exist, not provisioned. */
async function company(name: string): Promise<string> {
  const created = await runAsPlatform(() =>
    OrganizationModel.create({ name, slug: name.toLowerCase(), currency: 'USD' }),
  );
  return created._id.toHexString();
}

/** A hash nobody can sign in with, built at runtime rather than written in the source. */
const unusableHash = () => `hash-${new Types.ObjectId().toHexString()}`;

const DETAILS = {
  website: 'https://initech.example',
  phone: '+1 555 0100',
  industry: 'Software',
  companySize: '11-50',
  registrationNumber: 'EIN-12-3456789',
  taxId: 'VAT-1',
  addressLine1: '1 Infinite Loop',
  addressLine2: 'Floor 2',
  city: 'Austin',
  region: 'Texas',
  postalCode: '73301',
  description: 'Makes TPS reports.',
};

describe('organization details', () => {
  it('saves every detail on create and on update', async () => {
    const created = await organizationService.create({
      name: 'Initech',
      currency: 'USD',
      ...DETAILS,
    });
    expect(created).toMatchObject(DETAILS);

    const updated = await organizationService.update(created._id.toHexString(), {
      city: 'Dallas',
      website: '',
    });
    expect(updated).toMatchObject({ city: 'Dallas', website: '', industry: 'Software' });
  });

  it.each(['initech.example', 'ftp://initech.example'])(
    'refuses %s as a website',
    async (website) => {
      await expect(
        organizationService.create({ name: 'Initech', currency: 'USD', website }),
      ).rejects.toThrow(/website must be a web address/);
    },
  );

  it.each([
    ['postalCode', 20],
    ['phone', 40],
    ['description', 2000],
  ])('refuses a %s longer than %i characters', async (field, limit) => {
    await expect(
      organizationService.create({
        name: 'Initech',
        currency: 'USD',
        [field]: 'x'.repeat(limit + 1),
      }),
    ).rejects.toThrow(`Keep the ${field} under ${limit} characters.`);
    await expect(
      organizationService.create({ name: 'Initech', currency: 'USD', [field]: 'x'.repeat(limit) }),
    ).resolves.toMatchObject({ [field]: 'x'.repeat(limit) });
  });

  it('checks an update against the same limits', async () => {
    const id = await company('Alpha');
    await expect(organizationService.update(id, { city: 'x'.repeat(121) })).rejects.toThrow(
      'Keep the city under 120 characters.',
    );
  });
});

describe('organizationService.inviteMembers', () => {
  it('refuses an empty list', async () => {
    const id = await company('Alpha');
    await expect(organizationService.inviteMembers(id, [])).rejects.toThrow(
      'Add at least one person to invite.',
    );
  });

  it('invites one address listed twice once, with the roles it was given', async () => {
    const id = await company('Alpha');

    const added = await organizationService.inviteMembers(id, [
      { name: 'Kim', email: 'Kim@Alpha.Example ', roles: [ROLES.EMPLOYEE, ROLES.HR] },
      { name: 'Kim again', email: 'kim@alpha.example', roles: [ROLES.FINANCE] },
      { name: 'Pat', email: 'pat@alpha.example', roles: [ROLES.EMPLOYEE] },
    ]);

    expect(added.map((user) => user.email)).toEqual(['kim@alpha.example', 'pat@alpha.example']);
    expect(added[0].roles).toEqual([ROLES.EMPLOYEE, ROLES.HR]);
    expect(organizationOf(added[0])).toBe(id);
    const stored = await runAsPlatform(() => UserModel.find({ email: 'kim@alpha.example' }).lean());
    expect(stored).toHaveLength(1);
  });

  it('dedupes roles and never grants SUPER_ADMIN', async () => {
    const id = await company('Alpha');

    const [user] = await organizationService.inviteMembers(id, [
      {
        name: 'Kim',
        email: 'kim@alpha.example',
        roles: [ROLES.EMPLOYEE, ROLES.SUPER_ADMIN, ROLES.EMPLOYEE],
      },
    ]);

    expect(user.roles).toEqual([ROLES.EMPLOYEE]);
  });

  it('refuses somebody with no portal, or only SUPER_ADMIN', async () => {
    const id = await company('Alpha');

    await expect(
      organizationService.inviteMembers(id, [{ name: 'Kim', email: 'kim@a.example', roles: [] }]),
    ).rejects.toThrow('Pick at least one portal for each person.');
    await expect(
      organizationService.addMember(id, {
        name: 'Kim',
        email: 'kim@a.example',
        roles: [ROLES.SUPER_ADMIN],
      }),
    ).rejects.toThrow('Pick at least one portal for each person.');
    expect(await runAsPlatform(() => UserModel.countDocuments())).toBe(0);
  });

  it('gives somebody already in the company the new roles', async () => {
    const id = await company('Alpha');
    await runForOrganization(id, () =>
      UserModel.create({
        name: 'Lee',
        email: 'lee@alpha.example',
        passwordHash: unusableHash(),
        roles: [ROLES.EMPLOYEE],
      }),
    );

    const [user] = await organizationService.inviteMembers(id, [
      { name: 'Lee', email: 'lee@alpha.example', roles: [ROLES.EMPLOYEE, ROLES.FINANCE] },
    ]);

    expect(user.roles).toEqual([ROLES.EMPLOYEE, ROLES.FINANCE]);
    expect(await runAsPlatform(() => UserModel.countDocuments())).toBe(1);
  });

  it('refuses an address that belongs to another company', async () => {
    const alpha = await company('Alpha');
    const beta = await company('Beta');
    await runForOrganization(beta, () =>
      UserModel.create({
        name: 'Lee',
        email: 'lee@beta.example',
        passwordHash: unusableHash(),
        roles: [ROLES.EMPLOYEE],
      }),
    );

    await expect(
      organizationService.inviteMembers(alpha, [
        { name: 'Lee', email: 'lee@beta.example', roles: [ROLES.HR] },
      ]),
    ).rejects.toThrow('That email already belongs to somebody in another organization.');
    const raw = await UserModel.collection.findOne({ email: 'lee@beta.example' });
    expect(String(raw?.organizationId)).toBe(beta);
    expect(raw?.roles).toEqual([ROLES.EMPLOYEE]);
  });

  it('refuses a company that does not exist', async () => {
    await expect(
      organizationService.inviteMembers(new Types.ObjectId().toHexString(), [
        { name: 'Kim', email: 'kim@a.example', roles: [ROLES.EMPLOYEE] },
      ]),
    ).rejects.toThrow('Organization not found');
  });
});
