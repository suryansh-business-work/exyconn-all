import { Types } from 'mongoose';
import { techRevealResolvers } from '../../../../src/modules/tech/tech.reveal';
import { SlackConfigModel } from '../../../../src/modules/tech/slack-config.model';
import { InboundMailConfigModel } from '../../../../src/modules/tech/inbound-mail-config.model';
import { StripeConfigModel } from '../../../../src/modules/clienthub/payments/gateway.model';
import { SocialAppConfigModel } from '../../../../src/modules/social-accounts/social.models';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { seal } from '../../../../src/utils/secretBox';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { credential } from './tech.fixtures';

const platformAdmin: GraphQLContext = {
  user: { id: 'u1', email: 'u@x.com', roles: [ROLES.SUPER_ADMIN], organizationId: null },
  organizationId: null,
};

/** Somebody in an ordinary company (not the platform operator) holding these roles. */
function companyUser(...roles: Role[]): GraphQLContext {
  const organizationId = new Types.ObjectId().toHexString();
  return { user: { id: 'u2', email: 'tech@x.com', roles, organizationId }, organizationId };
}

const reveal = (ctx: GraphQLContext, id: string, secret: string) =>
  techRevealResolvers.Mutation.revealTechSecret(null, { id, secret }, ctx);

/** Writes a raw config row: the reveal only reads the one field it opens. */
async function storedRow(
  model: { collection: { insertOne(doc: object): Promise<unknown> } },
  fields: Record<string, unknown>,
): Promise<string> {
  const _id = new Types.ObjectId();
  await model.collection.insertOne({ _id, ...fields });
  return _id.toHexString();
}

const audits = () => runAsPlatform(() => AuditLogModel.find().lean());

beforeEach(() => {
  invalidatePermissionCache();
  invalidatePlatformOperatorCache();
});

describe('revealTechSecret', () => {
  it('gives platform staff a saved credential and writes the look to the audit log', async () => {
    const token = credential('slack');
    const id = await storedRow(SlackConfigModel, { botToken: token });

    await expect(reveal(platformAdmin, id, 'SLACK_BOT_TOKEN')).resolves.toBe(token);

    const [entry] = await audits();
    expect(entry).toMatchObject({
      action: 'ACCESS',
      module: 'TechConfig',
      entityId: id,
      entityLabel: 'Slack bot token',
      summary: 'Revealed the saved Slack bot token',
    });
  });

  it('opens a credential sealed at rest', async () => {
    const secretKey = credential('stripe');
    const id = await storedRow(StripeConfigModel, { secretKey: seal(secretKey) });

    await expect(reveal(platformAdmin, id, 'STRIPE_SECRET_KEY')).resolves.toBe(secretKey);
  });

  it('answers an empty string for a sealed field saved blank, or a field never saved', async () => {
    const blank = await storedRow(StripeConfigModel, { secretKey: '' });
    const missing = await storedRow(StripeConfigModel, {});

    await expect(reveal(platformAdmin, blank, 'STRIPE_SECRET_KEY')).resolves.toBe('');
    await expect(reveal(platformAdmin, missing, 'STRIPE_WEBHOOK_SECRET')).resolves.toBe('');
  });

  it('finds a social app by its app key rather than its id', async () => {
    const clientSecret = credential('meta');
    await storedRow(SocialAppConfigModel, { app: 'META', clientSecret });

    await expect(reveal(platformAdmin, 'META', 'SOCIAL_APP_CLIENT_SECRET')).resolves.toBe(
      clientSecret,
    );
  });

  it('reports a config that does not exist, without auditing anything', async () => {
    const id = new Types.ObjectId().toHexString();

    await expect(codeOf(reveal(platformAdmin, id, 'GITHUB_TOKEN'))).resolves.toBe('NOT_FOUND');
    expect(await audits()).toHaveLength(0);
  });

  it('refuses a platform credential to Tech staff of an ordinary company', async () => {
    const id = await storedRow(SlackConfigModel, { botToken: credential('slack') });

    await expect(codeOf(reveal(companyUser(ROLES.TECH), id, 'SLACK_BOT_TOKEN'))).resolves.toBe(
      'FORBIDDEN',
    );
  });

  it("lets a company's Tech staff see their own mailbox password, and nobody else", async () => {
    const password = credential('imap');
    const id = await storedRow(InboundMailConfigModel, { password });

    await expect(reveal(companyUser(ROLES.TECH), id, 'INBOUND_MAIL_PASSWORD')).resolves.toBe(
      password,
    );
    await expect(
      codeOf(reveal(companyUser(ROLES.EMPLOYEE), id, 'INBOUND_MAIL_PASSWORD')),
    ).resolves.toBe('FORBIDDEN');
  });
});
