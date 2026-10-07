import { ApiKeyModel } from '../../../../src/modules/integrations/api-key.model';
import {
  generateApiKey,
  principalForApiKey,
} from '../../../../src/modules/integrations/api-key.service';
import { logger } from '../../../../src/utils/logger';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';

const organizationId = useTestOrganization();

const NOW = new Date('2026-10-07T09:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

afterEach(() => {
  jest.restoreAllMocks();
});

/** Stores a freshly minted key the way createApiKey does, returning the plaintext. */
async function storeKey(fields: Record<string, unknown> = {}) {
  const issued = generateApiKey();
  const row = await ApiKeyModel.create({
    name: 'CRM sync',
    prefix: issued.prefix,
    keyHash: issued.keyHash,
    roles: [ROLES.CRM],
    ...fields,
  });
  return { key: issued.key, id: String(row._id) };
}

/** Waits for work that runs just behind the caller, such as the un-awaited usage stamp. */
async function eventually(check: () => Promise<boolean>) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await check()) {
      return true;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
  }
  return false;
}

describe('principalForApiKey', () => {
  it('resolves a live key to its roles and company', async () => {
    const { key, id } = await storeKey();

    await expect(principalForApiKey(key, NOW)).resolves.toEqual({
      id,
      name: 'CRM sync',
      roles: [ROLES.CRM],
      organizationId,
    });
  });

  it('ignores whitespace around a presented key', async () => {
    const { key, id } = await storeKey();

    expect((await principalForApiKey(`  ${key}\n`, NOW))?.id).toBe(id);
  });

  it('stamps when the key was last used', async () => {
    const { key, id } = await storeKey();

    await principalForApiKey(key, NOW);

    const stamped = await eventually(async () => {
      const row = await ApiKeyModel.findById(id).lean();
      return row?.lastUsedAt?.getTime() === NOW.getTime();
    });
    expect(stamped).toBe(true);
  });

  it('refuses anything that is not shaped like one of our keys without a lookup', async () => {
    const lookup = jest.spyOn(ApiKeyModel, 'findOne');

    await expect(principalForApiKey('Bearer abc', NOW)).resolves.toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });

  it('refuses a well-formed key nobody issued', async () => {
    await storeKey();

    await expect(principalForApiKey(generateApiKey().key, NOW)).resolves.toBeNull();
  });

  it('refuses a revoked key', async () => {
    const { key } = await storeKey({ revokedAt: new Date(NOW.getTime() - DAY_MS) });

    await expect(principalForApiKey(key, NOW)).resolves.toBeNull();
  });

  it('refuses a key at or past its expiry, and accepts one before it', async () => {
    const { key } = await storeKey({ expiresAt: NOW });

    await expect(principalForApiKey(key, NOW)).resolves.toBeNull();
    await expect(principalForApiKey(key, new Date(NOW.getTime() - 1))).resolves.not.toBeNull();
  });

  it('logs a failed usage stamp instead of failing the credential check', async () => {
    const { key, id } = await storeKey();
    const failure = new Error('write conflict');
    jest
      .spyOn(ApiKeyModel, 'updateOne')
      // Built at call time, so the rejection exists only once the service can catch it.
      .mockImplementationOnce(
        () => Promise.reject(failure) as unknown as ReturnType<typeof ApiKeyModel.updateOne>,
      );
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    const principal = await principalForApiKey(key, NOW);

    expect(principal?.id).toBe(id);
    const logged = await eventually(() => Promise.resolve(error.mock.calls.length > 0));
    expect(logged).toBe(true);
    expect(error).toHaveBeenCalledWith(failure, 'Stamping an API key’s last use failed');
  });

  it('defaults the moment to now when none is given', async () => {
    const { key } = await storeKey({ expiresAt: new Date(Date.now() + DAY_MS) });

    await expect(principalForApiKey(key)).resolves.toMatchObject({ roles: [ROLES.CRM] });
  });
});
