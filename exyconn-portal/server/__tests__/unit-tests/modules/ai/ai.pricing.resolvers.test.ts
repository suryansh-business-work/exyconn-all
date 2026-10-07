import { Types } from 'mongoose';
import { aiPricingResolvers } from '../../../../src/modules/ai/ai.pricing.resolvers';
import { AiModelPriceModel } from '../../../../src/modules/ai/ai-price.model';
import { AiSpendLimitModel } from '../../../../src/modules/ai/ai-spend-limit.model';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const { Query, Mutation } = aiPricingResolvers;

const ctx = (roles: Role[], organizationId: string | null = null): GraphQLContext => ({
  user: {
    id: new Types.ObjectId().toHexString(),
    email: 'tech@exyconn.com',
    roles,
    organizationId,
  },
  organizationId,
});
const platformAdmin = ctx([ROLES.SUPER_ADMIN]);

const price = (
  over: Partial<{ model: string; inputPer1kUsd: number; outputPer1kUsd: number }> = {},
) => ({
  model: 'gpt-4o',
  inputPer1kUsd: 0.0025,
  outputPer1kUsd: 0.01,
  active: true,
  ...over,
});

async function operatorOrganization(isPlatformOperator: boolean) {
  const organization = await runAsPlatform(() =>
    OrganizationModel.create({
      name: isPlatformOperator ? 'Exyconn' : 'Customer',
      slug: isPlatformOperator ? 'exyconn' : 'customer',
      currency: 'USD',
      isPlatformOperator,
    }),
  );
  return String(organization._id);
}

beforeEach(() => invalidatePlatformOperatorCache());

describe('reading prices and caps', () => {
  it('lists prices by model for TECH and AI, with ids', async () => {
    await AiModelPriceModel.create(price({ model: 'o3-mini' }));
    await AiModelPriceModel.create(price({ model: 'gpt-4o' }));

    const rows = await Query.listAiModelPrices(null, null, ctx([ROLES.AI]));

    expect(rows.map((row) => row.model)).toEqual(['gpt-4o', 'o3-mini']);
    expect(rows[0].id).toEqual(expect.any(String));
  });

  it('creates the switched-off default caps on first read', async () => {
    const limit = await Query.aiSpendLimit(null, null, ctx([ROLES.TECH]));

    expect(limit).toMatchObject({
      key: 'global',
      monthlyUsdCap: 0,
      perUserDailyUsdCap: 0,
      enabled: false,
    });
    expect(await AiSpendLimitModel.countDocuments()).toBe(1);
  });

  it('keeps both reads from anybody else', async () => {
    const employee = ctx([ROLES.EMPLOYEE]);

    await expect(Query.listAiModelPrices(null, null, employee)).rejects.toThrow();
    expect(() => Query.aiSpendLimit(null, null, employee)).toThrow();
  });
});

describe('saveAiModelPrice', () => {
  it('adds a model under its trimmed name, then corrects the same row', async () => {
    const added = await Mutation.saveAiModelPrice(
      null,
      { input: price({ model: '  gpt-5  ' }) },
      platformAdmin,
    );
    const corrected = await Mutation.saveAiModelPrice(
      null,
      { input: price({ model: 'gpt-5', inputPer1kUsd: 0.004 }) },
      platformAdmin,
    );

    expect(added).toMatchObject({ model: 'gpt-5', id: expect.any(String) });
    expect(corrected).toMatchObject({ id: added.id, inputPer1kUsd: 0.004 });
    expect(await AiModelPriceModel.countDocuments()).toBe(1);
  });

  it('refuses a nameless model and a negative price', async () => {
    await expect(
      Mutation.saveAiModelPrice(null, { input: price({ model: '   ' }) }, platformAdmin),
    ).rejects.toThrow('Name the model this price is for');
    await expect(
      Mutation.saveAiModelPrice(null, { input: price({ inputPer1kUsd: -1 }) }, platformAdmin),
    ).rejects.toThrow('The input price cannot be negative');
    await expect(
      Mutation.saveAiModelPrice(null, { input: price({ outputPer1kUsd: -0.01 }) }, platformAdmin),
    ).rejects.toThrow('The output price cannot be negative');
    expect(await AiModelPriceModel.countDocuments()).toBe(0);
  });

  it('lets the operator company’s TECH staff edit prices, and no other company’s', async () => {
    const operator = await operatorOrganization(true);
    const customer = await operatorOrganization(false);

    await expect(
      Mutation.saveAiModelPrice(null, { input: price() }, ctx([ROLES.TECH], operator)),
    ).resolves.toMatchObject({ model: 'gpt-4o' });
    await expect(
      Mutation.saveAiModelPrice(null, { input: price() }, ctx([ROLES.TECH], customer)),
    ).rejects.toThrow('Only the platform operator may manage this.');
  });
});

describe('deleteAiModelPrice', () => {
  it('removes the row for the platform', async () => {
    const row = await AiModelPriceModel.create(price());

    await expect(
      Mutation.deleteAiModelPrice(null, { id: String(row._id) }, platformAdmin),
    ).resolves.toBe(true);
    expect(await AiModelPriceModel.countDocuments()).toBe(0);
  });

  it('is refused to a customer company', async () => {
    const customer = await operatorOrganization(false);
    const row = await AiModelPriceModel.create(price());

    await expect(
      Mutation.deleteAiModelPrice(null, { id: String(row._id) }, ctx([ROLES.TECH], customer)),
    ).rejects.toThrow();
    expect(await AiModelPriceModel.countDocuments()).toBe(1);
  });
});

describe('saveAiSpendLimit', () => {
  const caps = { monthlyUsdCap: 100, perUserDailyUsdCap: 5, enabled: true };

  it('saves the caps as the single limit row', async () => {
    const tech = ctx([ROLES.TECH]);

    await Mutation.saveAiSpendLimit(null, { input: caps }, tech);
    const saved = await Mutation.saveAiSpendLimit(
      null,
      { input: { ...caps, monthlyUsdCap: 200 } },
      tech,
    );

    expect(saved).toMatchObject({
      key: 'global',
      monthlyUsdCap: 200,
      perUserDailyUsdCap: 5,
      enabled: true,
    });
    expect(await AiSpendLimitModel.countDocuments()).toBe(1);
  });

  it('refuses negative caps, saving nothing', async () => {
    const tech = ctx([ROLES.TECH]);

    await expect(
      Mutation.saveAiSpendLimit(null, { input: { ...caps, monthlyUsdCap: -1 } }, tech),
    ).rejects.toThrow('The monthly cap cannot be negative');
    await expect(
      Mutation.saveAiSpendLimit(null, { input: { ...caps, perUserDailyUsdCap: -1 } }, tech),
    ).rejects.toThrow('The per-person daily cap cannot be negative');
    expect(await AiSpendLimitModel.countDocuments()).toBe(0);
  });

  it('is TECH’s alone, not the AI role’s', async () => {
    await expect(
      Mutation.saveAiSpendLimit(null, { input: caps }, ctx([ROLES.AI])),
    ).rejects.toThrow();
  });
});
