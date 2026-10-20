import { Types } from 'mongoose';
import { googleMapsResolvers } from '../../../../src/modules/google-maps/google-maps.resolvers';
import { GoogleMapsConfigModel } from '../../../../src/modules/google-maps/google-maps-config.model';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ActivityModel } from '../../../../src/modules/crm/activity.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { assertPlatformStaff } from '../../../../src/lib/platformAccess';
import { assertPermission } from '../../../../src/lib/permissions';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import ips from '../../../fixtures/ips.json';

jest.mock('../../../../src/lib/platformAccess', () => ({
  ...jest.requireActual('../../../../src/lib/platformAccess'),
  assertPlatformStaff: jest.fn(),
}));
jest.mock('../../../../src/lib/permissions', () => ({
  ...jest.requireActual('../../../../src/lib/permissions'),
  assertPermission: jest.fn(),
}));
jest.mock('node:dns/promises', () => ({
  lookup: jest.fn(async () => [{ address: ips.ip10_0_0_1, family: 4 }]),
}));

type Resolver = (parent: unknown, args: Record<string, unknown>, ctx: GraphQLContext) => unknown;
const Query = googleMapsResolvers.Query as unknown as Record<string, Resolver>;
const Mutation = googleMapsResolvers.Mutation as unknown as Record<string, Resolver>;

const KEY = process.env.TEST_GOOGLE_KEY ?? 'AIzaTestServerKey000000000000000000';
const sales: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};
const employee: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.EMPLOYEE], email: 'e@exyconn.com' },
};

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('the Google Maps config (Tech)', () => {
  it('is for platform Tech staff, and never returns either key', async () => {
    await GoogleMapsConfigModel.create({
      label: 'Main',
      browserKey: `${KEY}browser`,
      serverKey: KEY,
      isActive: true,
    });

    const rows = (await Query.googleMapsConfigs(null, {}, sales)) as Array<Record<string, unknown>>;

    expect(assertPlatformStaff).toHaveBeenCalledWith(sales, 'TechConfig', [ROLES.TECH], 'VIEW');
    const fields = googleMapsResolvers.GoogleMapsConfig;
    expect(fields.hasServerKey(rows[0])).toBe(true);
    expect(fields.serverKeyHint(rows[0])).toBe(KEY.slice(-4));
    expect(Object.keys(googleMapsResolvers.GoogleMapsConfig)).not.toContain('serverKey');
  });

  it('keeps the stored keys when an edit leaves them blank', async () => {
    const created = (await Mutation.createGoogleMapsConfig(
      null,
      { input: { label: 'Main', browserKey: 'b-key', serverKey: KEY, isActive: true } },
      sales,
    )) as { id: string };

    await Mutation.updateGoogleMapsConfig(
      null,
      { id: created.id, input: { label: 'Renamed', browserKey: '', serverKey: '' } },
      sales,
    );

    expect(assertPlatformStaff).toHaveBeenCalledWith(sales, 'TechConfig', [ROLES.TECH], 'EDIT');
    const stored = await GoogleMapsConfigModel.findById(created.id).lean();
    expect(stored).toMatchObject({ label: 'Renamed', browserKey: 'b-key', serverKey: KEY });
  });

  it('refuses a new config without a server key', async () => {
    await expect(
      Mutation.createGoogleMapsConfig(
        null,
        { input: { label: 'Main', browserKey: '', serverKey: ' ' } },
        sales,
      ),
    ).rejects.toThrow(/server key is required/);
  });
});

describe('the CRM side', () => {
  it('gives CRM and HR users the browser key only, and nobody else', async () => {
    await GoogleMapsConfigModel.create({
      label: 'Main',
      browserKey: 'b-key',
      serverKey: KEY,
      isActive: true,
    });
    // HR reads it to show where employees marked attendance.
    const hr: GraphQLContext = {
      user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.HR], email: 'hr@exyconn.com' },
    };

    for (const ctx of [sales, hr]) {
      await expect(Query.googleMapsClientConfig(null, {}, ctx)).resolves.toEqual({
        browserKey: 'b-key',
        placesReady: true,
      });
    }
    expect(() => Query.googleMapsClientConfig(null, {}, employee)).toThrow();
  });

  it('searches through the server key and marks places already filed', async () => {
    await GoogleMapsConfigModel.create({ label: 'Main', serverKey: KEY, isActive: true });
    const filed = await CompanyModel.create({
      name: 'Smile',
      domain: 'smile.example',
      owner: 'Asha',
      placeId: 'place-1',
    });
    globalThis.fetch = jest.fn().mockResolvedValue(
      Response.json({
        places: [
          { id: 'place-1', location: { latitude: 1, longitude: 2 } },
          { id: 'place-2', location: { latitude: 3, longitude: 4 } },
        ],
      }),
    );

    const page = (await Query.searchLeadPlaces(
      null,
      { input: { query: 'dentists', location: 'Pune' } },
      sales,
    )) as { places: Array<{ placeId: string; existingCompanyId: string | null }> };

    expect(page.places).toEqual([
      expect.objectContaining({ placeId: 'place-1', existingCompanyId: filed._id.toHexString() }),
      expect.objectContaining({ placeId: 'place-2', existingCompanyId: null }),
    ]);
  });

  it('refuses search to non-CRM users and too-short queries', async () => {
    await expect(
      Query.searchLeadPlaces(null, { input: { query: 'x', location: 'Pune' } }, sales),
    ).rejects.toThrow(/2–200/);
    await expect(
      Query.searchLeadPlaces(null, { input: { query: 'dentists', location: 'Pune' } }, employee),
    ).rejects.toThrow();
  });

  it('reports a website on a private address as unreachable, without fetching it', async () => {
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;

    await expect(
      Mutation.findLeadEmails(null, { website: 'https://intranet.example' }, sales),
    ).resolves.toMatchObject({ status: 'UNREACHABLE', emails: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('imports under the Company create permission and audits the import', async () => {
    const result = await Mutation.importLeadsToCrm(
      null,
      { leads: [{ placeId: 'p1', name: 'Smile', lat: 1, lng: 2 }] },
      sales,
    );

    expect(assertPermission).toHaveBeenCalledWith(sales, 'Company', [ROLES.CRM], 'CREATE');
    expect(result).toMatchObject({ created: 1, skipped: 0 });
    const audit = await AuditLogModel.findOne({ action: 'IMPORT', module: 'Company' }).lean();
    expect(audit?.summary).toBe('Imported 1 companies from Google Places (0 skipped)');
  });

  it('leaves the imported account unowned and records the importer as its lead owner', async () => {
    await Mutation.importLeadsToCrm(
      null,
      { leads: [{ placeId: 'p2', name: 'Bright Dental', lat: 1, lng: 2 }] },
      sales,
    );

    const company = await CompanyModel.findOne({ name: 'Bright Dental' }).lean();
    expect(company?.owner).toBe('');
    // The importer has no user record here, so there is no name to show as the lead owner.
    expect(company?.leadOwner).toBe('Google Places');
    expect(company?.origin).toMatchObject({
      source: 'GOOGLE_PLACES',
      userId: sales.user?.id,
      userName: '',
      userEmail: 'sales@exyconn.com',
    });
    const note = await ActivityModel.findOne({ relatedId: String(company?._id) }).lean();
    expect(note?.owner).toBe('sales@exyconn.com');
  });
});
