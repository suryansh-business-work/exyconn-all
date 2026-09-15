import { randomUUID } from 'node:crypto';
import { print } from 'graphql';
import { UserModel } from '../../src/modules/admin/user.model';
import { AppSettingsModel } from '../../src/modules/admin/settings.model';
import { adminService } from '../../src/modules/admin/admin.service';
import { FALLBACK_LOCALE } from '../../src/modules/i18n/locale.constants';
import { ROLES } from '../../src/constants/roles';
import { trackerAdminService } from '../../src/modules/tracker/tracker.admin.service';
import { trackerResolvers } from '../../src/modules/tracker/tracker.resolvers';
import { trackerTypeDefs } from '../../src/modules/tracker/tracker.typeDefs';
import { TrackerDeviceModel } from '../../src/modules/tracker/models';
import type { GraphQLContext } from '../../src/middleware/auth';

jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendTrackerAccessEmail: jest.fn().mockResolvedValue(undefined) },
}));

const DEVICE_ID = 'device-me-fields';
let signedInUserId = '';

// The device token is not what is under test — the payload the resolver hands GraphQL is.
jest.mock('../../src/modules/tracker/tracker.auth', () => ({
  ...jest.requireActual('../../src/modules/tracker/tracker.auth'),
  assertTrackerDevice: jest.fn(async () => ({ userId: signedInUserId, deviceId: DEVICE_ID })),
}));

/** The non-null scalar fields a type declares, read from the SDL itself. */
function nonNullScalars(typeName: string): string[] {
  const body = new RegExp(String.raw`type ${typeName} \{([^}]*)\}`).exec(print(trackerTypeDefs));
  return [...(body?.[1] ?? '').matchAll(/^\s*(\w+): (?:String|Int|Float|Boolean)!/gm)].map(
    (match) => match[1],
  );
}

describe('trackerMe payload', () => {
  it('answers every non-null scalar TrackerMe declares', async () => {
    const user = await UserModel.create({
      name: 'Emp',
      email: 'me-fields@exyconn.com',
      passwordHash: randomUUID(),
      roles: [ROLES.EMPLOYEE],
    });
    signedInUserId = user.id;
    await trackerAdminService.grantAccess(user.id, 'admin');
    await TrackerDeviceModel.create({
      userId: user.id,
      deviceId: DEVICE_ID,
      tokenHash: 'hash',
      platform: 'win32',
    });

    const me = (await trackerResolvers.Query.trackerMe(
      undefined,
      undefined,
      {} as GraphQLContext,
    )) as unknown as Record<string, unknown>;

    // A field dropped by the serializer failed the whole query on production, which left the
    // desktop app with no workday — so no "Mark attendance" — and no projects.
    const fields = nonNullScalars('TrackerMe');
    expect(fields).toContain('locale');
    for (const field of fields) {
      expect([field, me[field]]).toEqual([field, expect.anything()]);
    }
  });
});

describe('app settings stored before the locale fields existed', () => {
  it('reads with the schema defaults instead of null', async () => {
    // Raw insert bypasses Mongoose defaults — how a record older than the field looks.
    await AppSettingsModel.collection.insertOne({ key: 'global', dateFormat: 'dd/MM/yyyy' });

    const settings = await adminService.getSettings();

    expect(settings.defaultLocale).toBe(FALLBACK_LOCALE);
    expect(settings.enabledLocales).toEqual([FALLBACK_LOCALE]);
    expect(settings.dateFormat).toBe('dd/MM/yyyy');
  });
});
