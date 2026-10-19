import type { GraphQLError } from 'graphql';
import { Types } from 'mongoose';
import { ROLES } from '../../../../src/constants/roles';
import { assertPermission } from '../../../../src/lib/permissions';
import {
  assertPlatformStaff,
  invalidatePlatformOperatorCache,
} from '../../../../src/lib/platformAccess';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { AuditLogModel } from '../../../../src/modules/audit';
import { draftCrmEmail, summariseCrmRecord } from '../../../../src/modules/crm/crm.ai';
import {
  defaultEmailSender,
  sendFromAnyMailbox,
} from '../../../../src/modules/crm-integrations/crm-integrations.email';
import { gmailResolvers } from '../../../../src/modules/gmail/gmail.resolvers';
import { crmEmailThreads } from '../../../../src/modules/gmail/gmail.sync';
import { GMAIL_AUDIT_MODULE } from '../../../../src/modules/gmail/gmail.audit';
import {
  GmailAccountModel,
  GmailOAuthStateModel,
} from '../../../../src/modules/gmail/gmail.models';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { ConfigurationError } from '../../../../src/utils/errors';
import { asArg } from '../../../mockAs';
import { connectAccount, saveClient } from './fakeGmail';

jest.mock('../../../../src/lib/platformAccess', () => ({
  ...jest.requireActual('../../../../src/lib/platformAccess'),
  assertPlatformStaff: jest.fn(),
}));
jest.mock('../../../../src/lib/permissions', () => ({
  ...jest.requireActual('../../../../src/lib/permissions'),
  assertPermission: jest.fn(async (ctx: GraphQLContext) => ctx.user),
}));
jest.mock('../../../../src/modules/crm/crm.ai', () => ({
  draftCrmEmail: jest.fn(async () => 'Dear Asha,'),
  summariseCrmRecord: jest.fn(async () => 'A warm lead.'),
}));
jest.mock('../../../../src/modules/crm-integrations/crm-integrations.email', () => ({
  defaultEmailSender: jest.fn(async () => 'account-1'),
  sendFromAnyMailbox: jest.fn(),
}));
jest.mock('../../../../src/modules/gmail/gmail.sync', () => ({
  ...jest.requireActual('../../../../src/modules/gmail/gmail.sync'),
  crmEmailThreads: jest.fn(async () => []),
}));

type Resolver = (parent: unknown, args: Record<string, unknown>, ctx: GraphQLContext) => unknown;
const Query = gmailResolvers.Query as unknown as Record<string, Resolver>;
const Mutation = gmailResolvers.Mutation as unknown as Record<string, Resolver>;

const ctx: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.CRM], email: 'ravi@exyconn.test' },
};
const SALES = 'sales@exyconn.test';

let operatorId = '';
const asOperator = <T>(work: () => Promise<T>) => runForOrganization(operatorId, work);
const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 'OK',
    (error: unknown) => (error as GraphQLError).extensions?.code,
  );
const auditRows = (module = GMAIL_AUDIT_MODULE) =>
  asOperator(() => AuditLogModel.find({ module }).sort({ _id: 1 }).lean());

beforeEach(async () => {
  invalidatePlatformOperatorCache();
  const operator = await runAsPlatform(() =>
    OrganizationModel.create({
      name: 'Exyconn',
      slug: 'exyconn',
      currency: 'USD',
      isPlatformOperator: true,
    }),
  );
  operatorId = operator._id.toHexString();
});

describe('CrmEmailMessage fields', () => {
  const fields = gmailResolvers.CrmEmailMessage;

  it('reads stored ids and names, and blanks for rows saved before they existed', () => {
    const stored = { id: 'm1', gmailId: 'g1', sentByName: 'Ravi', accountId: 'a1', mailbox: SALES };
    expect(fields.id(stored)).toBe('m1');
    expect(fields.sentByName(stored)).toBe('Ravi');
    expect(fields.accountId(stored)).toBe('a1');
    expect(fields.mailbox(stored)).toBe(SALES);

    const old = { gmailId: 'g1', sentByName: null, accountId: null, mailbox: null };
    expect(fields.id(old)).toBe('g1');
    expect(fields.sentByName(old)).toBe('');
    expect(fields.accountId(old)).toBe('');
    expect(fields.mailbox(old)).toBe('');
  });
});

describe('the Tech Gmail client', () => {
  it('is for platform Tech staff, and its save is audited as on or off', async () => {
    const shown = (await Query.gmailConfig(null, {}, ctx)) as Record<string, unknown>;
    expect(assertPlatformStaff).toHaveBeenCalledWith(ctx, 'TechConfig', [ROLES.TECH], 'VIEW');
    expect(shown).toMatchObject({ id: 'default', hasClientSecret: false });

    const input = { clientId: 'client-id', clientSecret: 'a-secret-value', enabled: true };
    const saved = (await asOperator(async () =>
      Mutation.saveGmailConfig(null, { input }, ctx),
    )) as Record<string, unknown>;
    await asOperator(async () =>
      Mutation.saveGmailConfig(null, { input: { ...input, enabled: false } }, ctx),
    );

    expect(assertPlatformStaff).toHaveBeenCalledWith(ctx, 'TechConfig', [ROLES.TECH], 'EDIT');
    expect(saved).toMatchObject({ clientId: 'client-id', hasClientSecret: true, enabled: true });
    const audits = await auditRows('TechConfig');
    expect(audits.map((row) => row.summary)).toEqual([
      'Saved the Gmail client (on)',
      'Saved the Gmail client (off)',
    ]);
  });

  it('tests the connected accounts as Tech staff', async () => {
    await saveClient();

    await expect(Mutation.testGmailConfig(null, {}, ctx)).rejects.toThrow(
      'Connect a Gmail account',
    );
    expect(assertPlatformStaff).toHaveBeenLastCalledWith(ctx, 'TechConfig', [ROLES.TECH], 'EDIT');
  });
});

describe('the CRM Gmail accounts', () => {
  it('are refused outside the operator’s own CRM', async () => {
    const customer = await runAsPlatform(() =>
      OrganizationModel.create({ name: 'Customer', slug: 'customer', currency: 'USD' }),
    );
    const asCustomer = <T>(work: () => Promise<T>) =>
      runForOrganization(customer._id.toHexString(), work);

    await expect(codeOf(asCustomer(async () => Query.gmailAccounts(null, {}, ctx)))).resolves.toBe(
      'FORBIDDEN',
    );
    await expect(
      codeOf(asCustomer(async () => Mutation.startGmailConnect(null, { returnTo: 'x' }, ctx))),
    ).resolves.toBe('FORBIDDEN');
    await expect(asCustomer(async () => Query.crmGmailReady(null, {}, ctx))).resolves.toBe(false);
  });

  it('lists the accounts without tokens, and says whether the client is ready', async () => {
    await expect(asOperator(async () => Query.gmailClientReady(null, {}, ctx))).resolves.toBe(
      false,
    );
    await saveClient();
    const id = await connectAccount(SALES);

    const accounts = (await asOperator(async () => Query.gmailAccounts(null, {}, ctx))) as Array<
      Record<string, unknown>
    >;

    expect(assertPermission).toHaveBeenCalledWith(ctx, 'Activity', [ROLES.CRM], 'VIEW');
    expect(accounts).toEqual([expect.objectContaining({ id, email: SALES, enabled: true })]);
    expect(accounts[0]).not.toHaveProperty('refreshToken');
    await expect(asOperator(async () => Query.gmailClientReady(null, {}, ctx))).resolves.toBe(true);
  });

  it('is ready for the CRM only while an enabled account is connected', async () => {
    await saveClient();
    await expect(asOperator(async () => Query.crmGmailReady(null, {}, ctx))).resolves.toBe(false);

    await connectAccount(SALES);
    await expect(asOperator(async () => Query.crmGmailReady(null, {}, ctx))).resolves.toBe(true);
  });

  it('starts a connection that remembers the person and the operator company', async () => {
    await saveClient();

    const url = (await asOperator(async () =>
      Mutation.startGmailConnect(null, { returnTo: 'http://localhost:1001/crm' }, ctx),
    )) as string;

    expect(assertPermission).toHaveBeenCalledWith(ctx, 'Activity', [ROLES.CRM], 'EDIT');
    const nonce = new URL(url).searchParams.get('state');
    const state = await runAsPlatform(() => GmailOAuthStateModel.findOne({ nonce }).lean());
    expect(state).toMatchObject({
      actorId: ctx.user?.id,
      updatedByName: 'ravi@exyconn.test',
      organizationId: operatorId,
    });
  });

  it('turns an account on and off and disconnects it, auditing each change', async () => {
    await saveClient();
    const id = await connectAccount(SALES);

    const off = (await asOperator(async () =>
      Mutation.setGmailAccountEnabled(null, { id, enabled: false }, ctx),
    )) as Record<string, unknown>;
    await asOperator(async () => Mutation.setGmailAccountEnabled(null, { id, enabled: true }, ctx));
    await expect(
      asOperator(async () => Mutation.disconnectGmailAccount(null, { id }, ctx)),
    ).resolves.toBe(true);

    expect(off).toMatchObject({ id, enabled: false });
    await expect(GmailAccountModel.countDocuments()).resolves.toBe(0);
    const audits = await auditRows();
    expect(audits.map((row) => [row.action, row.entityId, row.summary])).toEqual([
      ['UPDATE', id, `Turned off the Gmail account ${SALES} for the CRM`],
      ['UPDATE', id, `Turned on the Gmail account ${SALES} for the CRM`],
      ['DELETE', id, `Disconnected the Gmail account ${SALES}`],
    ]);
  });

  it('tells a CRM user to ask their administrator while the Google client is not saved', async () => {
    const start = asOperator(async () =>
      Mutation.startGmailConnect(null, { returnTo: 'http://localhost:1001/crm' }, ctx),
    );

    await expect(start).rejects.toThrow(
      'Email accounts are not available yet. Ask your administrator.',
    );
    await expect(codeOf(start)).resolves.toBe('BAD_USER_INPUT');
  });

  it('hides the Tech setup detail when reading threads fails for want of the client', async () => {
    jest
      .mocked(crmEmailThreads)
      .mockRejectedValueOnce(new ConfigurationError('Save the Google client in Tech.'));

    await expect(
      asOperator(async () => Query.crmEmailThreads(null, { object: 'CONTACT', id: 'c1' }, ctx)),
    ).rejects.toThrow('Email accounts are not available yet. Ask your administrator.');
  });

  it('reads a record’s threads and default sender through the operator’s accounts', async () => {
    const args = { object: 'CONTACT', id: 'c1' };

    await asOperator(async () => Query.crmEmailThreads(null, args, ctx));
    await expect(asOperator(async () => Query.crmEmailSender(null, args, ctx))).resolves.toBe(
      'account-1',
    );

    expect(crmEmailThreads).toHaveBeenCalledWith('CONTACT', 'c1');
    expect(defaultEmailSender).toHaveBeenCalledWith('CONTACT', 'c1');
  });
});

describe('sending and drafting', () => {
  const sent = { gmailId: 'g1', subject: 'Pricing', mailbox: SALES, to: ['a@x.test', 'b@x.test'] };
  const input = { fromAccountId: 'a1', to: ['a@x.test'], subject: 'Pricing', body: 'Hi' };

  it('audits a Gmail send under the Gmail module and a Microsoft one under its own', async () => {
    jest
      .mocked(sendFromAnyMailbox)
      .mockResolvedValueOnce(asArg({ provider: 'GMAIL', sent }))
      .mockResolvedValueOnce(asArg({ provider: 'MICROSOFT', sent: { ...sent, gmailId: 'm1' } }));

    await expect(
      asOperator(async () => Mutation.sendCrmEmail(null, { input }, ctx)),
    ).resolves.toEqual(sent);
    await asOperator(async () => Mutation.sendCrmEmail(null, { input }, ctx));

    expect(assertPermission).toHaveBeenCalledWith(ctx, 'Activity', [ROLES.CRM], 'CREATE');
    expect(sendFromAnyMailbox).toHaveBeenCalledWith(input, 'ravi@exyconn.test');
    const summary = `Sent "Pricing" from ${SALES} to a@x.test, b@x.test`;
    expect(await auditRows()).toEqual([
      expect.objectContaining({ action: 'CREATE', entityId: 'g1', summary }),
    ]);
    expect(await auditRows('CrmMicrosoftMail')).toEqual([
      expect.objectContaining({ entityId: 'm1', summary }),
    ]);
  });

  it('hides the Tech setup detail when a send fails for want of the OAuth app', async () => {
    jest
      .mocked(sendFromAnyMailbox)
      .mockRejectedValueOnce(new ConfigurationError('Save the app in Tech.'));

    await expect(
      asOperator(async () => Mutation.sendCrmEmail(null, { input }, ctx)),
    ).rejects.toThrow('Email accounts are not available yet. Ask your administrator.');
    expect(await auditRows()).toEqual([]);
  });

  it('drafts an email and summarises a record as the signed-in person', async () => {
    const actor = { id: ctx.user?.id, name: 'ravi@exyconn.test' };
    const draft = { object: 'CONTACT', id: 'c1', instruction: 'follow up' };

    await expect(Mutation.draftCrmEmail(null, { input: draft }, ctx)).resolves.toBe('Dear Asha,');
    await expect(
      Mutation.crmRecordSummary(null, { object: 'COMPANY', id: 'k1' }, ctx),
    ).resolves.toBe('A warm lead.');

    expect(draftCrmEmail).toHaveBeenCalledWith(draft, actor);
    expect(summariseCrmRecord).toHaveBeenCalledWith('COMPANY', 'k1', actor);
  });
});
