import { ApiKeyModel } from '../../../../src/modules/integrations/api-key.model';
import { ApiKeyUsageModel } from '../../../../src/modules/integrations/api-key-usage.model';
import {
  generateApiKey,
  principalForApiKey,
} from '../../../../src/modules/integrations/api-key.service';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { logger } from '../../../../src/utils/logger';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';

const organizationId = useTestOrganization();

const MONDAY = new Date('2026-10-05T09:00:00.000Z');
const MONDAY_LATE = new Date('2026-10-05T23:59:00.000Z');
const TUESDAY = new Date('2026-10-06T00:01:00.000Z');

afterEach(() => {
  jest.restoreAllMocks();
});

async function storeKey(create = (doc: object) => ApiKeyModel.create(doc)) {
  const issued = generateApiKey();
  const row = await create({
    name: 'ERP sync',
    prefix: issued.prefix,
    keyHash: issued.keyHash,
    roles: [ROLES.CRM],
  });
  return { key: issued.key, id: row._id.toHexString() };
}

/** Waits for work that runs just behind the caller, such as the un-awaited usage count. */
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

const countsOf = async (apiKeyId: string) =>
  Object.fromEntries(
    (await ApiKeyUsageModel.find({ apiKeyId }).lean()).map((row) => [row.day, row.count]),
  );

describe('API key usage counting', () => {
  it('keeps one counter per key per UTC day, in the key’s company', async () => {
    const { key, id } = await storeKey();

    await principalForApiKey(key, MONDAY);
    await eventually(async () => (await countsOf(id))['2026-10-05'] === 1);
    await principalForApiKey(key, MONDAY_LATE);
    await eventually(async () => (await countsOf(id))['2026-10-05'] === 2);
    await principalForApiKey(key, TUESDAY);
    await eventually(async () => (await countsOf(id))['2026-10-06'] === 1);

    expect(await countsOf(id)).toEqual({ '2026-10-05': 2, '2026-10-06': 1 });
    const row = await ApiKeyUsageModel.findOne({ apiKeyId: id }).lean();
    expect(String((row as { organizationId?: unknown }).organizationId)).toBe(organizationId);
  });

  it('does not count a key that belongs to no company', async () => {
    const { key, id } = await storeKey((doc) => runAsPlatform(() => ApiKeyModel.create(doc)));
    const stamped = jest.spyOn(ApiKeyModel, 'updateOne');

    // The key lookup runs across companies, as the request does before it knows the company.
    const principal = await runAsPlatform(() => principalForApiKey(key, MONDAY));
    expect(principal).toMatchObject({ id, organizationId: null });
    await eventually(() => Promise.resolve(stamped.mock.calls.length > 0));

    expect(await runAsPlatform(() => ApiKeyUsageModel.countDocuments({ apiKeyId: id }))).toBe(0);
  });

  it('logs a failed count instead of failing the credential check', async () => {
    const { key, id } = await storeKey();
    const failure = new Error('write conflict');
    jest
      .spyOn(ApiKeyUsageModel, 'updateOne')
      .mockImplementationOnce(
        () => Promise.reject(failure) as unknown as ReturnType<typeof ApiKeyUsageModel.updateOne>,
      );
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    expect((await principalForApiKey(key, MONDAY))?.id).toBe(id);
    expect(await eventually(() => Promise.resolve(error.mock.calls.length > 0))).toBe(true);
    expect(error).toHaveBeenCalledWith(failure, 'Counting an API key’s use failed');
  });
});
