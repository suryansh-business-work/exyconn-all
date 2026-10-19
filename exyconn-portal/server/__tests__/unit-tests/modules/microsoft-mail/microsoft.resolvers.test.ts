import { Types } from 'mongoose';
import { env } from '../../../../src/config/env';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { AuditLogModel } from '../../../../src/modules/audit';
import { microsoftMailResolvers } from '../../../../src/modules/microsoft-mail/microsoft.resolvers';
import {
  MicrosoftMailAccountModel,
  MicrosoftOAuthStateModel,
} from '../../../../src/modules/microsoft-mail/microsoft.models';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { codeOf } from '../codeOf';
import { APP_SECRET, connectMailbox, fakeMicrosoft, saveApp } from './fakeMicrosoft';

type Resolver = (parent: unknown, args: Record<string, unknown>, ctx: GraphQLContext) => unknown;
const Query = microsoftMailResolvers.Query as unknown as Record<string, Resolver>;
const Mutation = microsoftMailResolvers.Mutation as unknown as Record<string, Resolver>;

const SALES = 'sales@contoso.test';
const person = (roles: Role[]) => ({
  id: new Types.ObjectId().toHexString(),
  roles,
  email: `${roles[0].toLowerCase()}@exyconn.test`,
});
const sales = (): GraphQLContext => ({ user: person([ROLES.CRM]) });
const superAdmin = (): GraphQLContext => ({ user: person([ROLES.SUPER_ADMIN]) });

let operatorId = '';
/** Runs a resolver the way a request from the operator's own CRM does. */
const asOperator = (resolve: Resolver, args: Record<string, unknown>, ctx: GraphQLContext) =>
  runForOrganization(operatorId, () => Promise.resolve(resolve(null, args, ctx)));
const auditRows = () => AuditLogModel.find().sort({ createdAt: 1 }).lean();

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

afterEach(() => {
  jest.restoreAllMocks();
});

describe('the Entra app (Tech)', () => {
  it('shows platform staff the config without its secret', async () => {
    await saveApp();

    const shown = await Query.microsoftMailConfig(null, {}, superAdmin());

    expect(shown).toMatchObject({ id: 'default', clientId: 'ms-client-id', hasClientSecret: true });
    expect(JSON.stringify(shown)).not.toContain(APP_SECRET);
  });

  it('saves the app and audits whether it was turned on or off', async () => {
    const input = { clientId: 'id', clientSecret: APP_SECRET, tenant: '', enabled: true };

    const saved = await Mutation.saveMicrosoftMailConfig(null, { input }, superAdmin());
    await Mutation.saveMicrosoftMailConfig(
      null,
      { input: { ...input, clientSecret: '', enabled: false } },
      superAdmin(),
    );

    expect(saved).toMatchObject({ clientId: 'id', tenant: 'common', enabled: true });
    const audit = await auditRows();
    expect(audit.map((row) => row.summary)).toEqual([
      'Saved the Microsoft mail app (on)',
      'Saved the Microsoft mail app (off)',
    ]);
    expect(audit[0]).toMatchObject({ module: 'TechConfig', entityId: 'microsoft-mail' });
  });

  it('tests every enabled mailbox', async () => {
    await saveApp();
    await connectMailbox(SALES);
    fakeMicrosoft({ [SALES]: {} });

    await expect(Mutation.testMicrosoftMailConfig(null, {}, superAdmin())).resolves.toBe(
      `Microsoft answered for ${SALES}: ok.`,
    );
  });

  it('refuses CRM users', async () => {
    await expect(
      codeOf(Promise.resolve(Query.microsoftMailConfig(null, {}, sales()))),
    ).resolves.toBe('FORBIDDEN');
  });
});

describe('the mailboxes (CRM)', () => {
  it('lists the connected mailboxes without their tokens', async () => {
    const id = await connectMailbox(SALES);

    const listed = (await asOperator(Query.microsoftMailAccounts, {}, sales())) as Array<
      Record<string, unknown>
    >;

    expect(listed).toEqual([expect.objectContaining({ id, email: SALES })]);
    expect(listed[0]).not.toHaveProperty('refreshToken');
    const field = microsoftMailResolvers.MicrosoftMailAccount.lastUsedAt;
    const at = new Date('2026-10-01T00:00:00Z');
    expect(field({ lastUsedAt: at })).toBe(at);
    expect(field({})).toBeNull();
  });

  it('says whether Tech has set the app up', async () => {
    await expect(asOperator(Query.microsoftMailClientReady, {}, sales())).resolves.toBe(false);
    await saveApp();
    await expect(asOperator(Query.microsoftMailClientReady, {}, sales())).resolves.toBe(true);
  });

  it('tells a CRM user to ask their administrator while the app is not saved', async () => {
    const start = asOperator(
      Mutation.startMicrosoftMailConnect,
      { returnTo: `${env.corsOrigins[0]}/integrations/email` },
      sales(),
    );

    await expect(start).rejects.toThrow(
      'Email accounts are not available yet. Ask your administrator.',
    );
    await expect(MicrosoftOAuthStateModel.countDocuments()).resolves.toBe(0);
  });

  it('starts a connection that remembers the operator company and who asked', async () => {
    await saveApp();
    const ctx = sales();

    const url = (await asOperator(
      Mutation.startMicrosoftMailConnect,
      { returnTo: `${env.corsOrigins[0]}/crm/integrations` },
      ctx,
    )) as string;

    expect(url).toMatch(
      /^https:\/\/login\.microsoftonline\.com\/common\/oauth2\/v2\.0\/authorize\?/,
    );
    const state = await MicrosoftOAuthStateModel.findOne().lean();
    expect(state).toMatchObject({
      actorId: ctx.user?.id,
      actorName: 'crm@exyconn.test',
      organizationId: operatorId,
    });
  });

  it('turns a mailbox off and on, auditing each', async () => {
    const id = await connectMailbox(SALES);

    const off = await asOperator(
      Mutation.setMicrosoftMailAccountEnabled,
      { id, enabled: false },
      sales(),
    );
    await asOperator(Mutation.setMicrosoftMailAccountEnabled, { id, enabled: true }, sales());

    expect(off).toMatchObject({ id, enabled: false });
    const audit = await runForOrganization(operatorId, auditRows);
    expect(audit.map((row) => [row.action, row.module, row.entityId, row.summary])).toEqual([
      ['UPDATE', 'CrmMicrosoftMail', id, `Turned off the Microsoft mailbox ${SALES} for the CRM`],
      ['UPDATE', 'CrmMicrosoftMail', id, `Turned on the Microsoft mailbox ${SALES} for the CRM`],
    ]);
  });

  it('disconnects a mailbox and audits it', async () => {
    const id = await connectMailbox(SALES);

    await expect(
      asOperator(Mutation.disconnectMicrosoftMailAccount, { id }, sales()),
    ).resolves.toBe(true);

    expect(await MicrosoftMailAccountModel.countDocuments()).toBe(0);
    const audit = await runForOrganization(operatorId, auditRows);
    expect(audit[0]).toMatchObject({
      action: 'DELETE',
      entityLabel: SALES,
      summary: `Disconnected the Microsoft mailbox ${SALES}`,
    });
  });

  it("is refused in a customer company's CRM", async () => {
    const customer = await runAsPlatform(() =>
      OrganizationModel.create({ name: 'Customer', slug: 'customer', currency: 'USD' }),
    );

    await expect(
      codeOf(
        runForOrganization(customer._id.toHexString(), () =>
          Promise.resolve(Query.microsoftMailAccounts(null, {}, sales())),
        ),
      ),
    ).resolves.toBe('FORBIDDEN');
  });
});
