import { techUsageResolvers } from '../../../../src/modules/tech/tech.usage.resolvers';
import { billingKeys } from '../../../../src/modules/tech/billing/billing-keys.service';
import { getFxRates } from '../../../../src/modules/tech/fx/fx.service';
import { integrationUsage } from '../../../../src/modules/tech/usage/usage.service';
import { assertPlatformStaff } from '../../../../src/lib/platformAccess';
import { ROLES } from '../../../../src/constants/roles';
import { forbidden } from '../../../../src/utils/errors';
import type { GraphQLContext } from '../../../../src/middleware/auth';

jest.mock('../../../../src/lib/platformAccess', () => ({ assertPlatformStaff: jest.fn() }));
jest.mock('../../../../src/modules/tech/usage/usage.service', () => ({
  integrationUsage: jest.fn(),
}));
jest.mock('../../../../src/modules/tech/fx/fx.service', () => ({ getFxRates: jest.fn() }));
jest.mock('../../../../src/modules/tech/billing/billing-keys.service', () => ({
  billingKeys: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    test: jest.fn(),
    bill: jest.fn(),
  },
}));

type Resolver = (parent: unknown, args: Record<string, unknown>, ctx: GraphQLContext) => unknown;
const Query = techUsageResolvers.Query as unknown as Record<string, Resolver>;
const Mutation = techUsageResolvers.Mutation as unknown as Record<string, Resolver>;
const keys = jest.mocked(billingKeys);
const ctx: GraphQLContext = { user: { id: 't', roles: [ROLES.TECH], email: 't@x.com' } };
const guardedFor = (action: string) =>
  expect(assertPlatformStaff).toHaveBeenCalledWith(ctx, 'TechConfig', [ROLES.TECH], action);
const row = { _id: 'k1', label: 'Billing' };

beforeEach(() => jest.clearAllMocks());

describe('usage, rates and billing keys', () => {
  it('reads usage, rates, keys and the bill for platform staff', async () => {
    jest.mocked(integrationUsage).mockResolvedValue([]);
    jest.mocked(getFxRates).mockResolvedValue({ base: 'USD', date: '', rates: [] });
    keys.list.mockResolvedValue([row] as never);
    keys.bill.mockResolvedValue(null);

    await expect(Query.integrationUsage(null, { days: 30 }, ctx)).resolves.toEqual([]);
    expect(integrationUsage).toHaveBeenCalledWith(30);
    await expect(Query.fxRates(null, {}, ctx)).resolves.toMatchObject({ base: 'USD' });
    await expect(Query.billingKeyConfigs(null, {}, ctx)).resolves.toEqual([{ ...row, id: 'k1' }]);
    await expect(
      Query.providerBilling(null, { provider: 'OPENAI', days: 7 }, ctx),
    ).resolves.toBeNull();
    expect(keys.bill).toHaveBeenCalledWith('OPENAI', 7);
    guardedFor('VIEW');
  });

  it('creates, edits, tests and deletes billing keys behind the matching action', async () => {
    const input = { provider: 'OPENAI', label: 'B', key: 'k' };
    keys.create.mockResolvedValue(row as never);
    keys.update.mockResolvedValue(row as never);
    keys.remove.mockResolvedValue(true);
    keys.test.mockResolvedValue('works');

    await expect(Mutation.createBillingKeyConfig(null, { input }, ctx)).resolves.toMatchObject({
      id: 'k1',
    });
    guardedFor('CREATE');
    await expect(
      Mutation.updateBillingKeyConfig(null, { id: 'k1', input }, ctx),
    ).resolves.toMatchObject({ id: 'k1' });
    guardedFor('EDIT');
    await expect(Mutation.testBillingKeyConfig(null, { id: 'k1' }, ctx)).resolves.toBe('works');
    await expect(Mutation.deleteBillingKeyConfig(null, { id: 'k1' }, ctx)).resolves.toBe(true);
    guardedFor('DELETE');
    expect(keys.update).toHaveBeenCalledWith('k1', input);
  });

  it('shows whether a key is stored, and its hint', () => {
    const Key = (
      techUsageResolvers as unknown as Record<string, Record<string, (r: object) => unknown>>
    ).BillingKeyConfig;
    expect(Key.hasKey({ key: 'sealed' })).toBe(true);
    expect(Key.hasKey({})).toBe(false);
    expect(Key.keyHint({ keyHint: 'abcd' })).toBe('abcd');
    expect(Key.keyHint({ keyHint: '' })).toBeNull();
  });

  it('reads nothing when the guard refuses', async () => {
    jest.mocked(assertPlatformStaff).mockImplementationOnce(async () => forbidden());
    await expect(Query.integrationUsage(null, { days: 30 }, ctx)).rejects.toThrow(
      'You do not have access to this resource',
    );
    expect(integrationUsage).not.toHaveBeenCalled();
  });
});
