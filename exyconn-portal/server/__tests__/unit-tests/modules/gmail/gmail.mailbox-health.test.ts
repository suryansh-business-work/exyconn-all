import { Types } from 'mongoose';
import { ROLES } from '../../../../src/constants/roles';
import { assertPermission } from '../../../../src/lib/permissions';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { AuditLogModel } from '../../../../src/modules/audit';
import { presentGmailAccount } from '../../../../src/modules/gmail/gmail.accounts';
import { GMAIL_AUDIT_MODULE } from '../../../../src/modules/gmail/gmail.audit';
import { GmailAccountModel } from '../../../../src/modules/gmail/gmail.models';
import { gmailResolvers } from '../../../../src/modules/gmail/gmail.resolvers';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { codeOf } from '../codeOf';
import { connectAccount, fakeGmail, saveClient } from './fakeGmail';

jest.mock('../../../../src/lib/permissions', () => ({
  ...jest.requireActual('../../../../src/lib/permissions'),
  assertPermission: jest.fn(async (ctx: GraphQLContext) => ctx.user),
}));

type Resolver = (parent: unknown, args: Record<string, unknown>, ctx: GraphQLContext) => unknown;
const Mutation = gmailResolvers.Mutation as unknown as Record<string, Resolver>;

const ctx: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.CRM], email: 'ravi@exyconn.test' },
};
const SALES = 'sales@exyconn.test';
/** Google's answer when the project has not switched the Gmail API on: longer than 300 characters. */
const SERVICE_DISABLED = JSON.stringify({
  error: {
    code: 403,
    message:
      'Gmail API has not been used in project 123456 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=123456 then retry.',
    status: 'PERMISSION_DENIED',
    details: [{ reason: 'SERVICE_DISABLED', domain: 'googleapis.com' }],
  },
});

let operatorId = '';
const run = (resolve: Resolver, args: Record<string, unknown>, organizationId = operatorId) =>
  runForOrganization(organizationId, () => Promise.resolve(resolve(null, args, ctx)));
const audits = () =>
  runForOrganization(operatorId, () =>
    AuditLogModel.find({ module: GMAIL_AUDIT_MODULE }).sort({ _id: 1 }).lean(),
  );

beforeEach(async () => {
  invalidatePlatformOperatorCache();
  const operator = await runAsPlatform(() =>
    OrganizationModel.create({ name: 'Exyconn', slug: 'exyconn', currency: 'USD' }),
  );
  operatorId = operator._id.toHexString();
  await saveClient();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('testing one Gmail account', () => {
  it('clears an earlier error and a reconnect flag when Gmail answers, and audits it', async () => {
    const id = await connectAccount(operatorId, SALES, {
      status: 'NEEDS_RECONNECT',
      lastError: 'Gmail /threads failed (500): busy',
      lastErrorAt: new Date('2026-10-01T10:00:00Z'),
    });
    fakeGmail({ [SALES]: { threads: {} } });

    const tested = await run(Mutation.testGmailAccount, { id });

    expect(assertPermission).toHaveBeenCalledWith(ctx, 'Activity', [ROLES.CRM], 'EDIT');
    expect(tested).toMatchObject({ id, status: 'CONNECTED', lastError: '', lastErrorAt: null });
    expect((await audits()).map((row) => [row.action, row.entityId, row.summary])).toEqual([
      ['UPDATE', id, `Tested the Gmail account ${SALES}: it worked`],
    ]);
  });

  it("keeps Google's whole refusal and when it happened, so the CRM can show it in full", async () => {
    const id = await connectAccount(operatorId, SALES);
    fakeGmail({
      [SALES]: { threads: {}, profileFails: { status: 403, body: SERVICE_DISABLED } },
    });

    const tested = (await run(Mutation.testGmailAccount, { id })) as Record<string, unknown>;

    expect(tested.lastError).toBe(`Gmail /profile failed (403): ${SERVICE_DISABLED}`);
    expect(SERVICE_DISABLED.length).toBeGreaterThan(300);
    expect(tested.lastErrorAt).toBeInstanceOf(Date);
    expect(tested.status).toBe('CONNECTED');
    expect((await audits()).at(-1)?.summary).toBe(`Tested the Gmail account ${SALES}: it failed`);
  });

  it('asks for a reconnect when Google has revoked the connection', async () => {
    const id = await connectAccount(operatorId, SALES);
    fakeGmail({ [SALES]: { threads: {}, revoked: true } });

    const tested = await run(Mutation.testGmailAccount, { id });

    expect(tested).toMatchObject({ status: 'NEEDS_RECONNECT' });
    const stored = await runForOrganization(operatorId, () =>
      GmailAccountModel.findById(id).lean(),
    );
    expect(stored?.lastError).toContain('Token has been expired or revoked');
  });

  it("never tests another company's account", async () => {
    const id = await connectAccount(operatorId, SALES);
    const other = await runAsPlatform(() =>
      OrganizationModel.create({ name: 'Other', slug: 'other', currency: 'USD' }),
    );
    fakeGmail({ [SALES]: { threads: {} } });

    await expect(
      codeOf(run(Mutation.testGmailAccount, { id }, other._id.toHexString())),
    ).resolves.toBe('NOT_FOUND');
  });

  it('reads an account saved before errors were dated as never having failed', () => {
    const row = { _id: new Types.ObjectId(), email: SALES, lastError: '' };

    expect(presentGmailAccount(row as never).lastErrorAt).toBeNull();
  });
});

describe('reconnecting a known Gmail account', () => {
  const start = (args: Record<string, unknown>) =>
    run(Mutation.startGmailConnect, { returnTo: 'http://localhost:1001/crm', ...args }).then(
      (url) => new URL(url as string).searchParams,
    );

  it('goes straight to the address being reconnected', async () => {
    const params = await start({ loginHint: SALES });

    expect(params.get('login_hint')).toBe(SALES);
    expect(params.get('prompt')).toBe('consent');
  });

  it('lets the person pick an account when no address is given', async () => {
    const params = await start({});

    expect(params.has('login_hint')).toBe(false);
    expect(params.get('prompt')).toBe('consent select_account');
  });
});
