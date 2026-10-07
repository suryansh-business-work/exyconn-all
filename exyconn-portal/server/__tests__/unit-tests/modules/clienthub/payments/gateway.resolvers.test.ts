import { clientHubResolvers } from '../../../../../src/modules/clienthub';
import {
  RazorpayConfigModel,
  StripeConfigModel,
} from '../../../../../src/modules/clienthub/payments/gateway.model';
import { AuditLogModel } from '../../../../../src/modules/audit';
import { invalidatePlatformOperatorCache } from '../../../../../src/lib/platformAccess';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { codeOf } from '../../codeOf';

/** Never a literal credential: each only has to look like a long key. */
const STRIPE_KEY = `sk_test_${'k'.repeat(24)}`;
const RAZORPAY_KEY = `rzp_${'r'.repeat(24)}`;
const HOOK_KEY = `whsec_${'w'.repeat(24)}`;

const platformAdmin: GraphQLContext = {
  user: { id: 'root', email: 'root@exyconn.com', roles: [ROLES.SUPER_ADMIN], organizationId: null },
};
const customerTech: GraphQLContext = {
  user: {
    id: 't1',
    email: 'tech@acme.test',
    roles: [ROLES.TECH],
    organizationId: '64b000000000000000000001',
  },
  organizationId: '64b000000000000000000001',
};

const { Query, Mutation, StripeConfig, RazorpayConfig } = clientHubResolvers;

beforeEach(() => {
  invalidatePlatformOperatorCache();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Stripe accounts', () => {
  const input = { label: 'Main', secretKey: STRIPE_KEY, webhookSecret: HOOK_KEY, isActive: true };

  it('are added, listed, edited, tested and deleted by the platform, with an audit trail', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response('{}', { status: 200 }));

    const created = await Mutation.createStripeConfig(null, { input }, platformAdmin);
    const id = created.id;
    const updated = await Mutation.updateStripeConfig(
      null,
      { id, input: { ...input, label: 'Renamed', secretKey: '' } },
      platformAdmin,
    );
    const listed = await Query.listStripeConfigs(null, null, platformAdmin);
    const tested = await Mutation.testStripeConnection(null, { id }, platformAdmin);
    const deleted = await Mutation.deleteStripeConfig(null, { id }, platformAdmin);

    expect(updated).toMatchObject({ id, label: 'Renamed' });
    expect(listed.map((row) => row.id)).toEqual([id]);
    expect(tested).toBe(true);
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://api.stripe.com/v1/balance');
    expect(deleted).toBe(true);
    const summaries = await AuditLogModel.find({ module: 'TechConfig' }).sort({ _id: 1 }).lean();
    expect(summaries.map((row) => row.summary)).toEqual([
      'Added Stripe account Main',
      'Updated Stripe account Renamed',
      'Deleted a Stripe account',
    ]);
  });

  it('show whether a secret is on file and its hint, never the secret', async () => {
    await Mutation.createStripeConfig(null, { input }, platformAdmin);
    const row = (await StripeConfigModel.findOne().lean()) as unknown as Record<string, unknown>;

    expect(StripeConfig.hasSecretKey(row)).toBe(true);
    expect(StripeConfig.secretKeyHint(row)).toBe('kkkk');
    expect(StripeConfig.hasWebhookSecret(row)).toBe(true);
    expect(StripeConfig.webhookSecretHint(row)).toBe('wwww');
    expect(StripeConfig.hasSecretKey({ secretKey: '' })).toBe(false);
    expect(StripeConfig.secretKeyHint({ secretKeyHint: '' })).toBeNull();
  });

  it('are closed to a TECH user outside the platform operator', async () => {
    expect(await codeOf(Query.listStripeConfigs(null, null, customerTech))).toBe('FORBIDDEN');
    expect(await codeOf(Mutation.createStripeConfig(null, { input }, customerTech))).toBe(
      'FORBIDDEN',
    );
    expect(await StripeConfigModel.countDocuments()).toBe(0);
  });
});

describe('Razorpay accounts', () => {
  const input = {
    label: 'India',
    keyId: 'rzp_live_id',
    keySecret: RAZORPAY_KEY,
    webhookSecret: HOOK_KEY,
    isActive: false,
  };

  it('are added, listed, edited, tested and deleted by the platform, with an audit trail', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response('{}', { status: 200 }));

    const created = await Mutation.createRazorpayConfig(null, { input }, platformAdmin);
    const id = created.id;
    const updated = await Mutation.updateRazorpayConfig(
      null,
      { id, input: { ...input, label: 'India 2' } },
      platformAdmin,
    );
    const listed = await Query.listRazorpayConfigs(null, null, platformAdmin);
    const tested = await Mutation.testRazorpayConnection(null, { id }, platformAdmin);
    const deleted = await Mutation.deleteRazorpayConfig(null, { id }, platformAdmin);

    expect(updated).toMatchObject({ id, label: 'India 2', keyId: 'rzp_live_id' });
    expect(listed).toHaveLength(1);
    expect(tested).toBe(true);
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://api.razorpay.com/v1/payments?count=1');
    expect(deleted).toBe(true);
    expect(await AuditLogModel.countDocuments({ module: 'TechConfig' })).toBe(3);
  });

  it('show whether a secret is on file and its hint', async () => {
    await Mutation.createRazorpayConfig(null, { input }, platformAdmin);
    const row = (await RazorpayConfigModel.findOne().lean()) as unknown as Record<string, unknown>;

    expect(RazorpayConfig.hasKeySecret(row)).toBe(true);
    expect(RazorpayConfig.keySecretHint(row)).toBe('rrrr');
    expect(RazorpayConfig.hasWebhookSecret(row)).toBe(true);
    expect(RazorpayConfig.webhookSecretHint(row)).toBe('wwww');
  });

  it('are closed to a TECH user outside the platform operator', async () => {
    expect(await codeOf(Mutation.deleteRazorpayConfig(null, { id: 'x' }, customerTech))).toBe(
      'FORBIDDEN',
    );
  });
});
