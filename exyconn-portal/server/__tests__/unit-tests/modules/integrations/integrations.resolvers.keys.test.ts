import { Types } from 'mongoose';
import { integrationsResolvers } from '../../../../src/modules/integrations';
import { ApiKeyModel } from '../../../../src/modules/integrations/api-key.model';
import {
  hashApiKey,
  principalForApiKey,
} from '../../../../src/modules/integrations/api-key.service';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';

const organizationId = useTestOrganization();
const DAY_MS = 24 * 60 * 60 * 1000;

const as = (roles: Role[], extra: Partial<GraphQLContext> = {}): GraphQLContext => ({
  user: { id: 'u1', email: 'admin@acme.test', roles, organizationId },
  organizationId,
  ...extra,
});
const admin = as([ROLES.ADMIN]);

const { Query, Mutation } = integrationsResolvers;
const create = (roles: string[], expiresAt?: Date | null, ctx = admin) =>
  Mutation.createApiKey(null, { name: 'CRM sync', roles, expiresAt }, ctx);

describe('createApiKey', () => {
  it('mints a key that works once and is stored only as a hash', async () => {
    const issued = await create([ROLES.CRM]);

    const row = await ApiKeyModel.findById(issued.apiKey.id).lean();
    expect(row?.keyHash).toBe(hashApiKey(issued.key));
    expect(JSON.stringify(row)).not.toContain(issued.key);
    expect(row).toMatchObject({
      createdBy: 'admin@acme.test',
      roles: [ROLES.CRM],
      expiresAt: null,
    });
    expect(issued.key.startsWith(`${issued.apiKey.prefix}_`)).toBe(true);
    await expect(principalForApiKey(issued.key)).resolves.toMatchObject({
      roles: [ROLES.CRM],
      organizationId,
    });
  });

  it('keeps an expiry inside the year', async () => {
    const expiresAt = new Date(Date.now() + 30 * DAY_MS);

    const issued = await create([ROLES.FINANCE], expiresAt);

    expect(issued.apiKey.expiresAt?.getTime()).toBe(expiresAt.getTime());
  });

  it('refuses a role outside the company roles', async () => {
    await expect(codeOf(create([ROLES.CRM, 'ROOT']))).resolves.toBe('BAD_USER_INPUT');
    await expect(create(['ROOT', ROLES.SUPER_ADMIN])).rejects.toThrow(
      'Not a role an API key may be granted: ROOT, SUPER_ADMIN',
    );
    expect(await ApiKeyModel.countDocuments()).toBe(0);
  });

  it('refuses an expiry that is unreadable, past or more than a year out', async () => {
    const unreadable = 'not-a-date' as unknown as Date;

    await expect(create([ROLES.CRM], unreadable)).rejects.toThrow(
      'An API key must expire in the future.',
    );
    await expect(create([ROLES.CRM], new Date(Date.now() - 1_000))).rejects.toThrow(
      'An API key must expire in the future.',
    );
    await expect(create([ROLES.CRM], new Date(Date.now() + 366 * DAY_MS))).rejects.toThrow(
      'An API key may be valid for at most one year.',
    );
    expect(await ApiKeyModel.countDocuments()).toBe(0);
  });

  it('is an administrator’s action only', async () => {
    await expect(codeOf(create([ROLES.CRM], null, as([ROLES.CRM])))).resolves.toBe('FORBIDDEN');
    await expect(codeOf(create([ROLES.CRM], null, { user: null }))).resolves.toBe(
      'UNAUTHENTICATED',
    );
    // A desktop tracker token is never a way to mint a credential, even for an ADMIN.
    await expect(
      codeOf(create([ROLES.CRM], null, as([ROLES.ADMIN], { deviceId: 'device-1' }))),
    ).resolves.toBe('FORBIDDEN');
  });
});

describe('listApiKeys', () => {
  it('lists keys newest first without their hashes', async () => {
    await ApiKeyModel.create({
      name: 'Older',
      prefix: 'exy_00000001',
      keyHash: hashApiKey('older'),
      roles: [ROLES.HR],
      createdAt: new Date('2026-01-01'),
    });
    await ApiKeyModel.create({
      name: 'Newer',
      prefix: 'exy_00000002',
      keyHash: hashApiKey('newer'),
      roles: [ROLES.CRM],
      createdAt: new Date('2026-06-01'),
    });

    const rows = await Query.listApiKeys(null, {}, admin);

    expect(rows.map((row) => row.name)).toEqual(['Newer', 'Older']);
    expect(rows.every((row) => !('keyHash' in row))).toBe(true);
    expect(rows.every((row) => typeof row.id === 'string')).toBe(true);
  });

  it('refuses a non-administrator', async () => {
    await expect(codeOf(Query.listApiKeys(null, {}, as([ROLES.TECH])))).resolves.toBe('FORBIDDEN');
  });
});

describe('revokeApiKey', () => {
  it('revokes a key, which then stops working but stays listed', async () => {
    const issued = await create([ROLES.CRM]);

    const revoked = await Mutation.revokeApiKey(null, { id: issued.apiKey.id }, admin);

    expect(revoked.revokedAt).toBeInstanceOf(Date);
    await expect(principalForApiKey(issued.key)).resolves.toBeNull();
    expect(await ApiKeyModel.countDocuments()).toBe(1);
  });

  it('reports a key that does not exist', async () => {
    const id = new Types.ObjectId().toHexString();

    await expect(codeOf(Mutation.revokeApiKey(null, { id }, admin))).resolves.toBe('NOT_FOUND');
  });

  it('refuses a non-administrator', async () => {
    const issued = await create([ROLES.CRM]);

    await expect(
      codeOf(Mutation.revokeApiKey(null, { id: issued.apiKey.id }, as([ROLES.CRM]))),
    ).resolves.toBe('FORBIDDEN');
    expect((await ApiKeyModel.findById(issued.apiKey.id).lean())?.revokedAt).toBeNull();
  });
});
