import { Types } from 'mongoose';
import { techUsageResolvers } from '../../../../src/modules/tech/tech.usage.resolvers';
import { SlackConfigModel } from '../../../../src/modules/tech/slack-config.model';
import { StripeConfigModel } from '../../../../src/modules/clienthub/payments/gateway.model';
import { SocialAppConfigModel } from '../../../../src/modules/social-accounts/social.models';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { seal } from '../../../../src/utils/secretBox';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { credential } from './tech.fixtures';

const platformAdmin: GraphQLContext = {
  user: { id: 'u1', email: 'u@x.com', roles: [ROLES.SUPER_ADMIN], organizationId: null },
  organizationId: null,
};

const revealAll = (ctx: GraphQLContext) =>
  techUsageResolvers.Mutation.revealAllTechSecrets(null, null, ctx);

beforeEach(() => {
  invalidatePermissionCache();
  invalidatePlatformOperatorCache();
});

describe('revealAllTechSecrets', () => {
  it('gives platform staff every saved credential at once, sealed ones opened, in one audit', async () => {
    const token = credential('slack');
    const stripe = credential('stripe');
    const slackId = new Types.ObjectId();
    const stripeId = new Types.ObjectId();
    await SlackConfigModel.collection.insertOne({
      _id: slackId,
      botToken: token,
      signingSecret: '',
    });
    await StripeConfigModel.collection.insertOne({ _id: stripeId, secretKey: seal(stripe) });
    await SocialAppConfigModel.collection.insertOne({ app: 'LINKEDIN', clientSecret: 'li-secret' });

    const values = await revealAll(platformAdmin);

    expect(values).toEqual(
      expect.arrayContaining([
        { secret: 'SLACK_BOT_TOKEN', id: slackId.toHexString(), value: token },
        { secret: 'STRIPE_SECRET_KEY', id: stripeId.toHexString(), value: stripe },
        { secret: 'SOCIAL_APP_CLIENT_SECRET', id: 'LINKEDIN', value: 'li-secret' },
      ]),
    );
    expect(values.some((value) => value.secret === 'SLACK_SIGNING_SECRET')).toBe(false);
    const entries = await runAsPlatform(() => AuditLogModel.find().lean());
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      action: 'ACCESS',
      module: 'TechConfig',
      entityLabel: 'Environment variables',
      summary: 'Revealed every saved credential on Environment Variables (3 values)',
    });
  });

  it('gives a company user nothing, and records nothing', async () => {
    const organizationId = new Types.ObjectId().toHexString();
    const companyTech: GraphQLContext = {
      user: { id: 'u2', email: 't@x.com', roles: [ROLES.TECH], organizationId },
      organizationId,
    };
    expect(await codeOf(revealAll(companyTech))).toBe('FORBIDDEN');
    expect(await runAsPlatform(() => AuditLogModel.countDocuments())).toBe(0);
  });
});
