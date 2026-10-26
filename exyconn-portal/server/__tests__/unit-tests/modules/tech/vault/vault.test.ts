import { Types } from 'mongoose';
import { emailer } from '../../../../../src/modules/email/email.service';
import { techVaultResolvers } from '../../../../../src/modules/tech/vault/vault.resolvers';
import { VaultSessionModel } from '../../../../../src/modules/tech/vault/vault-session.model';
import { AuditLogModel } from '../../../../../src/modules/audit/audit.model';
import { assertPlatformStaff } from '../../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../../src/lib/tenant';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import type { UnlockInput } from '../../../../../src/modules/tech/vault/vault.service';

// The shared setup opens the vault for every suite; this one tests the real lock.
jest.mock('../../../../../src/modules/tech/vault/vault.gate', () =>
  jest.requireActual('../../../../../src/modules/tech/vault/vault.gate'),
);
jest.mock('../../../../../src/modules/email/email.service', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const ADMIN_ID = new Types.ObjectId().toHexString();

const admin: GraphQLContext = {
  user: {
    id: ADMIN_ID,
    email: 'tech@exyconn.com',
    roles: [ROLES.SUPER_ADMIN],
    organizationId: null,
  },
  organizationId: null,
  ip: '203.0.113.7',
  userAgent: 'Mozilla/5.0 Test',
};

const { Query, Mutation } = techVaultResolvers;
const GRANTED: UnlockInput['location'] = {
  state: 'GRANTED',
  latitude: 18.5204,
  longitude: 73.8567,
  accuracy: 30,
};

/** Asks for a code and returns the one the email carried. */
async function emailedCode(): Promise<string> {
  await Mutation.requestTechVaultCode(null, null, admin);
  const call = jest.mocked(emailer.send).mock.calls.at(-1)?.[0] as {
    to: string;
    template: string;
    variables: Record<string, string>;
  };
  expect(call).toMatchObject({ to: 'tech@exyconn.com', template: 'tech-vault-code' });
  expect(call.variables).toMatchObject({ ip: '203.0.113.7', minutes: '30' });
  return call.variables.code;
}

const unlock = async (reason = 'Rotating the SMTP password', location = GRANTED) =>
  Mutation.unlockTechVault(null, { input: { code: await emailedCode(), reason, location } }, admin);

/** Whether the central guard lets this person change Tech configuration right now. */
const canChangeTech = () =>
  assertPlatformStaff(admin, 'TechConfig', [ROLES.TECH], 'EDIT').then(
    () => true,
    () => false,
  );

beforeEach(() => jest.mocked(emailer.send).mockClear());

describe('the Environment Variables vault', () => {
  it('keeps Tech configuration locked until a code and a reason open it for 30 minutes', async () => {
    expect(await canChangeTech()).toBe(false);
    expect(await Query.techVaultStatus(null, null, admin)).toBeNull();
    // Reading the masked lists never needs the vault.
    await expect(
      assertPlatformStaff(admin, 'TechConfig', [ROLES.TECH], 'VIEW'),
    ).resolves.toBeTruthy();

    const session = await unlock();

    expect(await canChangeTech()).toBe(true);
    expect(session).toMatchObject({
      reason: 'Rotating the SMTP password',
      ip: '203.0.113.7',
      userAgent: 'Mozilla/5.0 Test',
      location: { state: 'GRANTED', latitude: 18.5204, longitude: 73.8567, accuracy: 30 },
    });
    const minutes = (session.expiresAt.getTime() - session.unlockedAt.getTime()) / 60_000;
    expect(minutes).toBe(30);
    expect((await Query.techVaultStatus(null, null, admin))?.id).toBe(session.id);
  });

  it('locks again on request and records how the session ended', async () => {
    await unlock();
    await Mutation.lockTechVault(null, null, admin);

    expect(await canChangeTech()).toBe(false);
    const [row] = await runAsPlatform(() => VaultSessionModel.find().lean());
    expect(row.endReason).toBe('LOCKED');
    const summaries = (await runAsPlatform(() => AuditLogModel.find().lean())).map(
      (l) => l.summary,
    );
    expect(summaries).toEqual([
      'Unlocked Environment Variables for 30 minutes: Rotating the SMTP password',
      'Locked Environment Variables',
    ]);
  });

  it('marks a session whose half hour ran out as expired, and treats it as locked', async () => {
    const past = Date.now() - 60 * 60 * 1000;
    await runAsPlatform(() =>
      VaultSessionModel.create({
        userId: ADMIN_ID,
        email: 'tech@exyconn.com',
        reason: 'Old work',
        unlockedAt: new Date(past),
        expiresAt: new Date(past + 30 * 60 * 1000),
      }),
    );
    expect(await canChangeTech()).toBe(false);

    await unlock();
    const rows = await runAsPlatform(() => VaultSessionModel.find().sort({ unlockedAt: 1 }).lean());
    expect(rows.map((row) => row.endReason)).toEqual(['EXPIRED', null]);
  });

  it('refuses a wrong code and a missing reason', async () => {
    await emailedCode();
    await expect(
      Mutation.unlockTechVault(
        null,
        { input: { code: '000000', reason: 'Checking a key', location: GRANTED } },
        admin,
      ),
    ).rejects.toThrow();
    await expect(unlock('ok')).rejects.toThrow(
      'Say in a few words why you are opening Environment Variables.',
    );
    expect(await canChangeTech()).toBe(false);
  });

  it('records a refused or impossible location without blocking the unlock', async () => {
    const denied = await unlock('Checking a key', { state: 'DENIED' });
    expect(denied.location).toMatchObject({ state: 'DENIED', latitude: null });

    const wild = await unlock('Checking again', { ...GRANTED, latitude: 200 });
    expect(wild.location?.state).toBe('UNAVAILABLE');
  });

  it('says so when the code email cannot be sent', async () => {
    jest.mocked(emailer.send).mockRejectedValueOnce(new Error('SMTP down'));
    await expect(Mutation.requestTechVaultCode(null, null, admin)).rejects.toThrow(
      'We could not send the code just now. Try again in a minute.',
    );
  });

  it('lists every session and what was done in each', async () => {
    const session = await unlock();
    await runAsPlatform(() =>
      AuditLogModel.create({
        actorId: ADMIN_ID,
        action: 'ACCESS',
        module: 'TechConfig',
        summary: 'Revealed the saved SMTP password',
      }),
    );

    const page = await Query.techVaultSessionsPaged(
      null,
      { input: { page: 0, pageSize: 10, search: 'SMTP' } },
      admin,
    );
    expect(page.totalCount).toBe(1);
    const activity = await Query.techVaultSessionActivity(null, { id: String(session.id) }, admin);
    expect(activity.map((row) => row.summary)).toContain('Revealed the saved SMTP password');
    expect(
      await Query.techVaultSessionActivity(null, { id: '6560f1f1f1f1f1f1f1f1f1f1' }, admin),
    ).toEqual([]);
  });

  it('is only for Tech staff', async () => {
    const outsider: GraphQLContext = {
      user: { id: 'u9', email: 'x@y.com', roles: [ROLES.EMPLOYEE], organizationId: null },
      organizationId: 'org-not-operator',
    };
    await expect(Mutation.requestTechVaultCode(null, null, outsider)).rejects.toThrow();
  });
});
