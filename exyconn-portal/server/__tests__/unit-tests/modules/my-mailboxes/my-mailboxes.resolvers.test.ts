import express from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { ROLES } from '../../../../src/constants/roles';
import { runAsPlatform } from '../../../../src/lib/tenant';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { AuditLogModel } from '../../../../src/modules/audit';
import { gmailConnectRouter } from '../../../../src/modules/gmail/gmail.routes';
import {
  GmailAccountModel,
  GmailOAuthStateModel,
} from '../../../../src/modules/gmail/gmail.models';
import { microsoftConnectRouter } from '../../../../src/modules/microsoft-mail';
import {
  MicrosoftMailAccountModel,
  MicrosoftOAuthStateModel,
} from '../../../../src/modules/microsoft-mail/microsoft.models';
import { myMailboxesResolvers } from '../../../../src/modules/my-mailboxes';
import { MY_MAILBOX_AUDIT_MODULE } from '../../../../src/modules/my-mailboxes/my-mailboxes.default';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { connectAccount, fakeGmail, saveClient } from '../gmail/fakeGmail';
import { fakeMicrosoft, saveApp } from '../microsoft-mail/fakeMicrosoft';

type Resolver = (parent: unknown, args: Record<string, unknown>, ctx: GraphQLContext) => unknown;
const Query = myMailboxesResolvers.Query as unknown as Record<string, Resolver>;
const Mutation = myMailboxesResolvers.Mutation as unknown as Record<string, Resolver>;

const organizationId = useTestOrganization();
const RETURN_TO = 'http://localhost:1001/settings';
const ASHA_GMAIL = 'asha@gmail.test';
const ASHA_OUTLOOK = 'asha@outlook.test';
const app = express()
  .use('/oauth/gmail', gmailConnectRouter())
  .use('/oauth/microsoft', microsoftConnectRouter());

/** An employee with no CRM role: a personal mailbox needs nobody's permission. */
const employee = (): GraphQLContext => ({
  user: {
    id: new Types.ObjectId().toHexString(),
    roles: [ROLES.EMPLOYEE],
    email: 'asha@acme.test',
    organizationId,
  },
});
const call = (resolve: Resolver, args: Record<string, unknown>, ctx: GraphQLContext) =>
  Promise.resolve(resolve(null, args, ctx));
const myAudit = () => AuditLogModel.find({ module: MY_MAILBOX_AUDIT_MODULE }).lean();

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const idToken = (email: string) =>
  [
    'h',
    Buffer.from(
      JSON.stringify({
        iss: 'accounts.google.com',
        aud: 'client-id',
        exp: Math.floor(Date.now() / 1000) + 600,
        email,
        email_verified: true,
      }),
    ).toString('base64url'),
    's',
  ].join('.');

beforeEach(async () => {
  await Promise.all([saveClient(), saveApp()]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('who may use personal mailboxes', () => {
  it('needs a signed-in person in a company, and no CRM role', async () => {
    await expect(codeOf(call(Query.myMailboxes, {}, { user: null }))).resolves.toBe(
      'UNAUTHENTICATED',
    );
    const platformAdmin: GraphQLContext = {
      user: { id: 'admin', roles: [ROLES.SUPER_ADMIN], email: 'root@exyconn.test' },
    };
    await expect(
      codeOf(runAsPlatform(() => call(Query.myMailboxes, {}, platformAdmin))),
    ).resolves.toBe('FORBIDDEN');
    await expect(call(Query.myMailboxes, {}, employee())).resolves.toEqual([]);
    await expect(call(Query.myMailboxProviders, {}, employee())).resolves.toEqual({
      gmail: true,
      microsoft: true,
    });
  });
});

describe('connecting a personal mailbox', () => {
  it('connects Gmail as the caller’s own, default mailbox, audited as theirs', async () => {
    const ctx = employee();
    const url = await call(
      Mutation.startMyMailboxConnect,
      { provider: 'GMAIL', returnTo: RETURN_TO },
      ctx,
    );
    const nonce = new URL(String(url)).searchParams.get('state') ?? '';
    const state = await runAsPlatform(() => GmailOAuthStateModel.findOne({ nonce }).lean());
    expect(state).toMatchObject({ ownerUserId: ctx.user?.id, organizationId });
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(json({ refresh_token: 'rt-1', id_token: idToken(ASHA_GMAIL) }));

    const response = await request(app)
      .get('/oauth/gmail/callback')
      .query({ state: nonce, code: 'c' });

    expect(response.headers.location).toBe(`${RETURN_TO}?gmailConnected=asha%40gmail.test`);
    const row = await GmailAccountModel.findOne({ email: ASHA_GMAIL }).lean();
    expect(row).toMatchObject({ ownerUserId: ctx.user?.id, isDefault: true, enabled: true });
    expect(await myAudit()).toEqual([
      expect.objectContaining({ summary: `Connected their own mailbox ${ASHA_GMAIL}` }),
    ]);
  });

  it('connects Microsoft the same way; a second mailbox does not take the default', async () => {
    const ctx = employee();
    await connectAccount(organizationId, ASHA_GMAIL, {
      ownerUserId: ctx.user?.id,
      isDefault: true,
    });
    const url = await call(
      Mutation.startMyMailboxConnect,
      { provider: 'MICROSOFT', returnTo: RETURN_TO, loginHint: ASHA_OUTLOOK },
      ctx,
    );
    const nonce = new URL(String(url)).searchParams.get('state') ?? '';
    expect(
      await runAsPlatform(() => MicrosoftOAuthStateModel.findOne({ nonce }).lean()),
    ).toMatchObject({ ownerUserId: ctx.user?.id });
    fakeMicrosoft({ [ASHA_OUTLOOK]: {} });

    const response = await request(app)
      .get('/oauth/microsoft/callback')
      .query({ state: nonce, code: `code-${ASHA_OUTLOOK}` });

    expect(response.headers.location).toContain('microsoftConnected=asha%40outlook.test');
    const row = await MicrosoftMailAccountModel.findOne({ email: ASHA_OUTLOOK }).lean();
    expect(row).toMatchObject({ ownerUserId: ctx.user?.id, isDefault: false });
  });

  it('refuses a return address outside the portals', async () => {
    await expect(
      codeOf(
        call(
          Mutation.startMyMailboxConnect,
          { provider: 'GMAIL', returnTo: 'https://evil.test/x' },
          employee(),
        ),
      ),
    ).resolves.toBe('BAD_USER_INPUT');
  });
});

describe('managing and sending', () => {
  it('tests, defaults, sends and disconnects, auditing each without the body', async () => {
    const ctx = employee();
    const id = await connectAccount(organizationId, ASHA_GMAIL, { ownerUserId: ctx.user?.id });
    fakeGmail({ [ASHA_GMAIL]: { threads: {} } });

    await expect(call(Mutation.testMyMailbox, { id }, ctx)).resolves.toMatchObject({
      status: 'CONNECTED',
    });
    await expect(call(Mutation.setDefaultMyMailbox, { id }, ctx)).resolves.toMatchObject({
      isDefault: true,
    });
    const input = { to: ['ravi@client.test'], subject: 'Quote', body: '<p>Secret terms</p>' };
    await expect(call(Mutation.sendMyEmail, { input }, ctx)).resolves.toEqual({
      from: ASHA_GMAIL,
      subject: 'Quote',
      recipientCount: 1,
    });
    await expect(call(Mutation.disconnectMyMailbox, { id }, ctx)).resolves.toBe(true);

    const rows = await myAudit();
    expect(rows.map((row) => row.summary)).toEqual([
      'Tested their mailbox: it worked',
      `Made ${ASHA_GMAIL} their default mailbox`,
      `Sent "Quote" from ${ASHA_GMAIL} to 1 recipient`,
      `Disconnected their mailbox ${ASHA_GMAIL}`,
    ]);
    expect(JSON.stringify(rows)).not.toContain('Secret terms');
  });

  it("refuses another person's mailbox", async () => {
    const id = await connectAccount(organizationId, ASHA_GMAIL, {
      ownerUserId: new Types.ObjectId().toHexString(),
    });

    await expect(codeOf(call(Mutation.disconnectMyMailbox, { id }, employee()))).resolves.toBe(
      'FORBIDDEN',
    );
    expect(await myAudit()).toEqual([]);
  });
});
