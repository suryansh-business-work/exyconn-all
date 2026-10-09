import { randomUUID } from 'node:crypto';
import { ROLES } from '../../../src/constants/roles';
import { asArg } from '../../mockAs';

type UserModule = typeof import('../../../src/modules/admin/user.model');
type SettingsModule = typeof import('../../../src/modules/admin/settings.model');
type PasswordModule = typeof import('../../../src/utils/password');

/**
 * seed.ts runs on import, so each test loads a fresh copy. The models it writes to are the
 * suite's own (connected to the in-memory database); the boot steps it hands off to — the
 * employee data, the website content, the branding — are stubs, tested on their own.
 */
const mockUsers = jest.requireActual<UserModule>('../../../src/modules/admin/user.model');
const mockSettings = jest.requireActual<SettingsModule>(
  '../../../src/modules/admin/settings.model',
);
const mockPassword = jest.requireActual<PasswordModule>('../../../src/utils/password');
const mockEnv = {
  seedAdmin: { name: 'Seed Admin', email: 'Seed.Admin@Test.co', password: null as string | null },
};
const mockLogger = { info: jest.fn(), error: jest.fn() };
const mockSteps = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  employees: jest.fn(),
  website: jest.fn(),
  branding: jest.fn(),
};

jest.mock('../../../src/modules/admin/user.model', () => mockUsers);
jest.mock('../../../src/modules/admin/settings.model', () => mockSettings);
jest.mock('../../../src/utils/password', () => mockPassword);
jest.mock('../../../src/config/env', () => ({ env: mockEnv }));
jest.mock('../../../src/utils/logger', () => ({ logger: mockLogger }));
jest.mock('../../../src/config/database', () => ({
  database: { connect: () => mockSteps.connect(), disconnect: () => mockSteps.disconnect() },
}));
jest.mock('../../../src/seed/seedEmployee', () => ({
  seedEmployeeData: () => mockSteps.employees(),
}));
jest.mock('../../../src/modules/website/seed', () => ({
  seedWebsiteContent: () => mockSteps.website(),
}));
jest.mock('../../../src/modules/branding', () => ({ getBranding: () => mockSteps.branding() }));

const { UserModel } = mockUsers;
const { AppSettingsModel } = mockSettings;
const ADMIN_EMAIL = 'seed.admin@test.co';

let exit: jest.SpyInstance;

/** Loads seed.ts and waits until it has finished or failed. */
async function runSeed(): Promise<void> {
  jest.isolateModules(() => {
    jest.requireActual('../../../src/seed/seed');
  });
  for (let attempt = 0; attempt < 500; attempt += 1) {
    if (mockSteps.disconnect.mock.calls.length > 0 || exit.mock.calls.length > 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

const infoLines = () => mockLogger.info.mock.calls.map(([line]) => line);

beforeEach(() => {
  exit = jest.spyOn(process, 'exit').mockImplementation(asArg(() => undefined));
  mockEnv.seedAdmin.password = randomUUID();
  for (const step of Object.values(mockSteps)) {
    step.mockResolvedValue(undefined);
  }
});

afterEach(() => exit.mockRestore());

describe('seed script', () => {
  it('seeds the administrator and settings on a fresh database, then every other step', async () => {
    await runSeed();

    const admin = await UserModel.findOne({ email: ADMIN_EMAIL }).lean();
    expect(admin?.roles).toEqual([ROLES.ADMIN]);
    expect(admin?.isActive).toBe(true);
    await expect(
      mockPassword.verifyPassword(mockEnv.seedAdmin.password ?? '', admin?.passwordHash ?? ''),
    ).resolves.toBe(true);
    expect(await AppSettingsModel.countDocuments({ key: 'global' })).toBe(1);
    expect(mockSteps.employees).toHaveBeenCalledTimes(1);
    expect(mockSteps.website).toHaveBeenCalledTimes(1);
    expect(mockSteps.branding).toHaveBeenCalledTimes(1);
    expect(infoLines()).toEqual(
      expect.arrayContaining([
        'Seeded ADMIN user: Seed.Admin@Test.co',
        'Seeded global AppSettings',
        'Branding document ready',
        'Seed complete',
      ]),
    );
    expect(exit).not.toHaveBeenCalled();
  });

  it('seeds no administrator without a configured password', async () => {
    mockEnv.seedAdmin.password = null;

    await runSeed();

    expect(await UserModel.countDocuments()).toBe(0);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'SEED_ADMIN_PASSWORD is not set; the ADMIN user was not seeded',
    );
  });

  it('leaves an existing administrator and settings alone', async () => {
    await UserModel.create({
      name: 'Existing',
      email: ADMIN_EMAIL,
      passwordHash: 'kept',
      roles: [ROLES.HR],
      isActive: true,
    });
    await AppSettingsModel.create({ key: 'global', timezone: 'UTC' });

    await runSeed();

    const admin = await UserModel.findOne({ email: ADMIN_EMAIL }).lean();
    expect(admin?.passwordHash).toBe('kept');
    expect(admin?.roles).toEqual([ROLES.HR]);
    expect((await AppSettingsModel.findOne({ key: 'global' }).lean())?.timezone).toBe('UTC');
    expect(infoLines()).toContain('ADMIN user already exists, skipping');
    expect(infoLines()).not.toContain('Seeded global AppSettings');
  });

  it('migrates legacy accounts: a single role, retired roles and missing fields', async () => {
    await UserModel.collection.insertMany([
      { name: 'Legacy', email: 'legacy@test.co', role: ROLES.HR },
      { name: 'Retired', email: 'retired@test.co', roles: ['BUGS', 'CLIENTS', ROLES.ADMIN] },
    ]);

    await runSeed();

    const legacy = await UserModel.collection.findOne({ email: 'legacy@test.co' });
    expect(legacy).toEqual(
      expect.objectContaining({
        roles: [ROLES.HR],
        isActive: true,
        isBlocked: false,
        employmentStatus: 'ACTIVE',
      }),
    );
    expect(legacy).not.toHaveProperty('role');
    const retired = await UserModel.collection.findOne({ email: 'retired@test.co' });
    expect([...(retired?.roles ?? [])].sort((a: string, b: string) => a.localeCompare(b))).toEqual([
      ROLES.ADMIN,
      ROLES.PROJECTS,
    ]);
    expect(infoLines()).toEqual(
      expect.arrayContaining([
        'Migrated 1 user(s) from role to roles',
        'Consolidated roles for 1 user(s)',
        'Backfilled 2 user(s) with default required fields',
      ]),
    );
  });

  it('logs a failed step and exits with an error code', async () => {
    const failure = new Error('website seed broke');
    mockSteps.website.mockRejectedValue(failure);

    await runSeed();

    expect(mockLogger.error).toHaveBeenCalledWith(failure, 'Seed failed');
    expect(exit).toHaveBeenCalledWith(1);
    expect(mockSteps.disconnect).not.toHaveBeenCalled();
  });
});
