import { walletGatewayResolvers } from '../../../../../src/modules/clienthub';
import { AuditLogModel } from '../../../../../src/modules/audit';
import { invalidatePlatformOperatorCache } from '../../../../../src/lib/platformAccess';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { codeOf } from '../../codeOf';

/** Never a literal credential: each only has to look like a long key. */
const PAYPAL_SECRET = `pp_${'p'.repeat(24)}`;
const PAYONEER_TOKEN = `po_${'t'.repeat(24)}`;

const platformAdmin: GraphQLContext = {
  user: { id: 'root', email: 'root@exyconn.com', roles: [ROLES.SUPER_ADMIN], organizationId: null },
};
const customerTech: GraphQLContext = {
  user: {
    id: 't1',
    email: 't@acme.test',
    roles: [ROLES.TECH],
    organizationId: '64b000000000000000000001',
  },
  organizationId: '64b000000000000000000001',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const { Query, Mutation, PaypalConfig, PayoneerConfig } = walletGatewayResolvers;

const summaries = async () =>
  (await AuditLogModel.find({ module: 'TechConfig' }).sort({ _id: 1 }).lean()).map(
    (row) => row.summary,
  );

beforeEach(() => {
  invalidatePlatformOperatorCache();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('PayPal accounts', () => {
  const input = {
    label: 'Wallet',
    clientId: ' paypal-client ',
    clientSecret: PAYPAL_SECRET,
    webhookId: ' WH-1 ',
    mode: 'SANDBOX' as const,
    isActive: true,
  };

  it('are managed by the platform end to end, with an audit trail', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => json({ access_token: 'tok', expires_in: 3600 }));

    const created = await Mutation.createPaypalConfig(null, { input }, platformAdmin);
    const { id } = created;
    const updated = await Mutation.updatePaypalConfig(
      null,
      { id, input: { ...input, label: 'Wallet 2', clientSecret: null } },
      platformAdmin,
    );
    const listed = await Query.listPaypalConfigs(null, null, platformAdmin);
    const tested = await Mutation.testPaypalConnection(null, { id }, platformAdmin);
    const deleted = await Mutation.deletePaypalConfig(null, { id }, platformAdmin);

    expect(created).toMatchObject({ clientId: 'paypal-client', webhookId: 'WH-1' });
    expect(updated).toMatchObject({ id, label: 'Wallet 2' });
    expect(listed.map((row) => row.id)).toEqual([id]);
    expect(PaypalConfig.hasClientSecret(listed[0])).toBe(true);
    expect(PaypalConfig.clientSecretHint(listed[0])).toBe('pppp');
    expect(tested).toBe(true);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
    );
    expect(deleted).toBe(true);
    expect(await summaries()).toEqual([
      'Added PayPal account Wallet',
      'Updated PayPal account Wallet 2',
      'Deleted a PayPal account',
    ]);
  });

  it('are closed to a TECH user outside the platform operator', async () => {
    expect(await codeOf(Query.listPaypalConfigs(null, null, customerTech))).toBe('FORBIDDEN');
    expect(await codeOf(Mutation.createPaypalConfig(null, { input }, customerTech))).toBe(
      'FORBIDDEN',
    );
  });
});

describe('Payoneer accounts', () => {
  const input = {
    label: 'Payoneer',
    merchantCode: ' MERCHANT ',
    apiToken: PAYONEER_TOKEN,
    division: ' EU ',
    mode: 'LIVE' as const,
    isActive: false,
  };

  it('are managed by the platform end to end, with an audit trail', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => json({ resultInfo: 'not found' }, 404));

    const created = await Mutation.createPayoneerConfig(null, { input }, platformAdmin);
    const { id } = created;
    const updated = await Mutation.updatePayoneerConfig(
      null,
      { id, input: { ...input, label: 'Payoneer 2', division: null, apiToken: '' } },
      platformAdmin,
    );
    const listed = await Query.listPayoneerConfigs(null, null, platformAdmin);
    const tested = await Mutation.testPayoneerConnection(null, { id }, platformAdmin);
    const deleted = await Mutation.deletePayoneerConfig(null, { id }, platformAdmin);

    expect(created).toMatchObject({ merchantCode: 'MERCHANT', division: 'EU' });
    expect(updated).toMatchObject({ id, label: 'Payoneer 2', division: '' });
    expect(PayoneerConfig.hasApiToken(listed[0])).toBe(true);
    expect(PayoneerConfig.apiTokenHint(listed[0])).toBe('tttt');
    expect(tested).toBe(true);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://api.live.oscato.com/api/charges/credential-check',
    );
    expect(deleted).toBe(true);
    expect(await summaries()).toEqual([
      'Added Payoneer account Payoneer',
      'Updated Payoneer account Payoneer 2',
      'Deleted a Payoneer account',
    ]);
  });

  it('read a missing division as none', () => {
    expect(PayoneerConfig.division({ division: null })).toBe('');
    expect(PayoneerConfig.division({})).toBe('');
    expect(PayoneerConfig.division({ division: 'EU' })).toBe('EU');
    expect(PayoneerConfig.hasApiToken({})).toBe(false);
    expect(PayoneerConfig.apiTokenHint({})).toBeNull();
  });

  it('are closed to a TECH user outside the platform operator', async () => {
    expect(await codeOf(Mutation.testPayoneerConnection(null, { id: 'x' }, customerTech))).toBe(
      'FORBIDDEN',
    );
  });
});
