import { Types } from 'mongoose';
import {
  OrganizationModel,
  migrateLegacyDataIntoFirstOrganization,
} from '../../../../src/modules/organizations';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { AppSettingsModel } from '../../../../src/modules/admin/settings.model';
import { BrandingModel } from '../../../../src/modules/branding/branding.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { ROLES } from '../../../../src/constants/roles';
import { env } from '../../../../src/config/env';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { logger } from '../../../../src/utils/logger';

/** A person as they were stored before companies existed: no organization at all. */
function legacyPerson(email: string) {
  return UserModel.collection.insertOne({
    name: email.split('@')[0],
    email,
    passwordHash: `hash-${new Types.ObjectId().toHexString()}`,
    roles: [ROLES.ADMIN],
    isActive: true,
  });
}

async function onlyOrganization() {
  const all = await runAsPlatform(() => OrganizationModel.find().lean());
  expect(all).toHaveLength(1);
  return all[0];
}

beforeEach(() => {
  jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('migrating an install with no branding or settings', () => {
  it('creates the company from the workspace defaults', async () => {
    await legacyPerson('someone@old.example');

    await migrateLegacyDataIntoFirstOrganization();

    expect(await onlyOrganization()).toMatchObject({
      name: 'Exyconn',
      slug: 'exyconn',
      legalName: '',
      currency: 'INR',
      locale: 'en',
      timezone: 'UTC',
      fiscalYearStartMonth: 4,
      taxSystem: 'INDIA_GST',
      contactEmail: '',
    });
  });

  it('makes the bootstrap account a platform administrator inside that company', async () => {
    const email = env.seedAdmin.email.toLowerCase();
    await legacyPerson(email);
    await legacyPerson('other@old.example');

    await migrateLegacyDataIntoFirstOrganization();

    const organization = await onlyOrganization();
    const bootstrap = await UserModel.collection.findOne({ email });
    const other = await UserModel.collection.findOne({ email: 'other@old.example' });
    expect(bootstrap?.roles).toEqual([ROLES.ADMIN, ROLES.SUPER_ADMIN]);
    expect(String(bootstrap?.organizationId)).toBe(String(organization._id));
    expect(other?.roles).toEqual([ROLES.ADMIN]);
    expect(String(other?.organizationId)).toBe(String(organization._id));
  });
});

describe('migrating an install with its own branding and settings', () => {
  it('reads the language, clock, legal name and contact from what it already says', async () => {
    await legacyPerson('someone@old.example');
    await BrandingModel.collection.insertOne({
      key: 'global',
      businessName: '   ',
      legalName: 'Old Co Private Limited',
      supportEmail: 'help@old.example',
    });
    await AppSettingsModel.collection.insertOne({
      key: 'global',
      defaultLocale: 'de',
      timezone: 'Europe/Berlin',
    });

    await migrateLegacyDataIntoFirstOrganization();

    expect(await onlyOrganization()).toMatchObject({
      // A blank business name is no name: the workspace default stands in.
      name: 'Exyconn',
      legalName: 'Old Co Private Limited',
      contactEmail: 'help@old.example',
      locale: 'de',
      timezone: 'Europe/Berlin',
    });
  });
});

describe('rebuilding indexes during the migration', () => {
  it('logs a collection whose indexes cannot be rebuilt and finishes the rest', async () => {
    await legacyPerson('someone@old.example');
    await ClientModel.collection.insertOne({ name: 'Their client', email: 'c@old.example' });
    const failure = new Error('index build failed');
    jest.spyOn(ClientModel, 'syncIndexes').mockRejectedValueOnce(failure);
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    await migrateLegacyDataIntoFirstOrganization();

    const organization = await onlyOrganization();
    expect(logged).toHaveBeenCalledWith(failure, 'Could not rebuild the indexes of Client');
    const client = await ClientModel.collection.findOne({ email: 'c@old.example' });
    expect(String(client?.organizationId)).toBe(String(organization._id));
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringMatching(/^Migrated \d+ records into Exyconn, and rebuilt the indexes$/),
    );
  });
});
