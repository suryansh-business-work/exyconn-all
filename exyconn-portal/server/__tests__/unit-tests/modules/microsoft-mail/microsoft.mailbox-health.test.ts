import { Types } from 'mongoose';
import { ROLES } from '../../../../src/constants/roles';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { AuditLogModel } from '../../../../src/modules/audit';
import { presentMicrosoftAccount } from '../../../../src/modules/microsoft-mail/microsoft.accounts';
import { MicrosoftMailAccountModel } from '../../../../src/modules/microsoft-mail/microsoft.models';
import { microsoftMailResolvers } from '../../../../src/modules/microsoft-mail/microsoft.resolvers';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { open } from '../../../../src/utils/secretBox';
import { codeOf } from '../codeOf';
import { connectMailbox, fakeMicrosoft, saveApp } from './fakeMicrosoft';

type Resolver = (parent: unknown, args: Record<string, unknown>, ctx: GraphQLContext) => unknown;
const Mutation = microsoftMailResolvers.Mutation as unknown as Record<string, Resolver>;

const SALES = 'sales@contoso.test';
const ctx: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.CRM], email: 'crm@exyconn.test' },
};

let operatorId = '';
const run = (resolve: Resolver, args: Record<string, unknown>, organizationId = operatorId) =>
  runForOrganization(organizationId, () => Promise.resolve(resolve(null, args, ctx)));
const stored = (id: string) =>
  runForOrganization(operatorId, () => MicrosoftMailAccountModel.findById(id).lean());

beforeEach(async () => {
  invalidatePlatformOperatorCache();
  const operator = await runAsPlatform(() =>
    OrganizationModel.create({ name: 'Exyconn', slug: 'exyconn', currency: 'USD' }),
  );
  operatorId = operator._id.toHexString();
  await saveApp();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('testing one Microsoft mailbox', () => {
  it('clears an earlier error, keeps a rotated token, leaves lastUsedAt alone and audits it', async () => {
    const id = await connectMailbox(operatorId, SALES, {
      status: 'NEEDS_RECONNECT',
      lastError: 'Microsoft Graph /me/sendMail failed (500): busy',
      lastErrorAt: new Date('2026-10-01T10:00:00Z'),
    });
    fakeMicrosoft({ [SALES]: { rotateTo: 'refresh-rotated' } });

    const tested = await run(Mutation.testMicrosoftMailAccount, { id });

    expect(tested).toMatchObject({ id, status: 'CONNECTED', lastError: '', lastErrorAt: null });
    const row = await stored(id);
    expect(open(row?.refreshToken ?? '')).toBe('refresh-rotated');
    expect(row?.lastUsedAt).toBeNull();
    const audit = await runForOrganization(operatorId, () => AuditLogModel.findOne().lean());
    expect(audit).toMatchObject({
      action: 'UPDATE',
      entityId: id,
      summary: `Tested the Microsoft mailbox ${SALES}: it worked`,
    });
  });

  it('keeps the refusal with when it happened and asks for a reconnect when revoked', async () => {
    const id = await connectMailbox(operatorId, SALES);
    fakeMicrosoft({ [SALES]: { revoked: true } });

    const tested = (await run(Mutation.testMicrosoftMailAccount, { id })) as Record<
      string,
      unknown
    >;

    expect(tested).toMatchObject({
      status: 'NEEDS_RECONNECT',
      lastError: 'Microsoft refused the stored connection. Connect it again.',
    });
    expect(tested.lastErrorAt).toBeInstanceOf(Date);
  });

  it("never tests another company's mailbox", async () => {
    const id = await connectMailbox(operatorId, SALES);
    const other = await runAsPlatform(() =>
      OrganizationModel.create({ name: 'Other', slug: 'other', currency: 'USD' }),
    );

    await expect(
      codeOf(run(Mutation.testMicrosoftMailAccount, { id }, other._id.toHexString())),
    ).resolves.toBe('NOT_FOUND');
  });

  it('reads a mailbox saved before errors were dated as never having failed', () => {
    const row = { _id: new Types.ObjectId(), email: SALES, lastError: '' };

    expect(presentMicrosoftAccount(row as never).lastErrorAt).toBeNull();
  });
});

describe('reconnecting a known Microsoft mailbox', () => {
  const start = (args: Record<string, unknown>) =>
    run(Mutation.startMicrosoftMailConnect, {
      returnTo: 'http://localhost:1001/crm',
      ...args,
    }).then((url) => new URL(url as string).searchParams);

  it('goes straight to the address being reconnected', async () => {
    const params = await start({ loginHint: SALES });

    expect(params.get('login_hint')).toBe(SALES);
    expect(params.has('prompt')).toBe(false);
  });

  it('lets the person pick an account when no address is given', async () => {
    const params = await start({});

    expect(params.has('login_hint')).toBe(false);
    expect(params.get('prompt')).toBe('select_account');
  });
});
