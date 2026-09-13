import {
  OrganizationModel,
  migrateLegacyDataIntoFirstOrganization,
  organizationService,
} from '../../src/modules/organizations';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { EmailTemplateModel } from '../../src/modules/email/email-template.model';
import { OnboardingTemplateModel } from '../../src/modules/onboarding/onboarding.model';
import { BrandingModel } from '../../src/modules/branding/branding.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { authService } from '../../src/modules/auth/auth.service';
import { ROLES } from '../../src/constants/roles';
import { organizationOf, runAsPlatform, runForOrganization } from '../../src/lib/tenant';
import { hashPassword } from '../../src/utils/password';

const ACME = {
  name: 'Acme Manufacturing',
  currency: 'EUR',
  country: 'DE',
  timezone: 'Europe/Berlin',
};

describe('creating a company', () => {
  it('files it under a handle, in the standards it was given', async () => {
    const organization = await organizationService.create(ACME);
    expect(organization.slug).toBe('acme-manufacturing');
    expect(organization).toMatchObject({ currency: 'EUR', country: 'DE', status: 'ACTIVE' });
  });

  it('refuses a currency, country, timezone or language that is not a real one', async () => {
    await expect(organizationService.create({ ...ACME, currency: 'XYZ' })).rejects.toThrow(
      /ISO 4217/,
    );
    await expect(organizationService.create({ ...ACME, country: 'XX' })).rejects.toThrow(
      /ISO 3166-1/,
    );
    await expect(organizationService.create({ ...ACME, timezone: 'Mars/Olympus' })).rejects.toThrow(
      /timezone/,
    );
    await expect(organizationService.create({ ...ACME, locale: '!!not a tag' })).rejects.toThrow(
      /language tag/,
    );
  });

  it('refuses a handle another company already has', async () => {
    await organizationService.create(ACME);
    await expect(organizationService.create(ACME)).rejects.toThrow(/already taken/);
  });

  it('provisions its own defaults, inside its own scope', async () => {
    const organization = await organizationService.create(ACME);
    const id = String(organization._id);

    const templates = await runForOrganization(id, () => EmailTemplateModel.countDocuments());
    const checklists = await runForOrganization(id, () => OnboardingTemplateModel.countDocuments());
    const branding = await runForOrganization(id, () => BrandingModel.findOne().lean());

    expect(templates).toBeGreaterThan(0);
    expect(checklists).toBeGreaterThan(0);
    expect(branding?.businessName).toBe('Acme Manufacturing');
  });
});

describe('handing a company over to its administrator', () => {
  it('creates the person inside that company, as its ADMIN', async () => {
    const organization = await organizationService.create(ACME);
    const admin = await organizationService.assignAdmin(String(organization._id), {
      name: 'Dana',
      email: 'dana@acme.example',
    });

    expect(admin.roles).toContain(ROLES.ADMIN);
    expect(organizationOf(admin)).toBe(String(organization._id));
  });

  it('will not take somebody who already belongs to another company', async () => {
    const acme = await organizationService.create(ACME);
    const globex = await organizationService.create({ ...ACME, name: 'Globex', currency: 'USD' });
    await organizationService.assignAdmin(String(acme._id), {
      name: 'Dana',
      email: 'dana@acme.example',
    });

    await expect(
      organizationService.assignAdmin(String(globex._id), {
        name: 'Dana',
        email: 'dana@acme.example',
      }),
    ).rejects.toThrow(/another organization/);
  });
});

describe('suspending a company', () => {
  it('stops everyone in it signing in, and lets them back in when it is lifted', async () => {
    const organization = await organizationService.create(ACME);
    const id = String(organization._id);
    const password = `Pw-${process.env.JWT_SECRET ?? 'test'}-1`;
    await runForOrganization(id, async () =>
      UserModel.create({
        name: 'Sam',
        email: 'sam@acme.example',
        passwordHash: await hashPassword(password),
        roles: [ROLES.EMPLOYEE],
        isActive: true,
      }),
    );

    await organizationService.setStatus(id, 'SUSPENDED');
    await expect(authService.login('sam@acme.example', password)).rejects.toThrow(/suspended/);

    await organizationService.setStatus(id, 'ACTIVE');
    const session = await authService.login('sam@acme.example', password);
    expect(session.token).toBeTruthy();
  });
});

describe('an install that predates the tenancy', () => {
  it('moves every existing record into its first organization, once', async () => {
    // A database as it was before companies existed: records with no organization at all.
    await BrandingModel.collection.insertOne({ key: 'global', businessName: 'Old Co' });
    await UserModel.collection.insertOne({
      name: 'Existing',
      email: 'existing@old.example',
      passwordHash: 'x',
      roles: [ROLES.ADMIN],
      isActive: true,
    });
    await ClientModel.collection.insertOne({ name: 'Their client', email: 'c@old.example' });

    await migrateLegacyDataIntoFirstOrganization();

    const [organization] = await runAsPlatform(() => OrganizationModel.find().lean());
    expect(organization.name).toBe('Old Co');
    const id = String(organization._id);
    // The company can now see what was always its own.
    const clients = await runForOrganization(id, () => ClientModel.find().lean());
    expect(clients).toHaveLength(1);
    const people = await runForOrganization(id, () => UserModel.countDocuments());
    expect(people).toBe(1);

    // Running again changes nothing: one company, not two.
    await migrateLegacyDataIntoFirstOrganization();
    const all = await runAsPlatform(() => OrganizationModel.countDocuments());
    expect(all).toBe(1);
  });

  it('leaves a fresh install alone, so the first company is created in Admin', async () => {
    await migrateLegacyDataIntoFirstOrganization();
    expect(await runAsPlatform(() => OrganizationModel.countDocuments())).toBe(0);
  });
});
