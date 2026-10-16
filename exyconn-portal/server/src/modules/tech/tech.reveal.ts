import type { Model } from 'mongoose';
import { ROLES } from '../../constants/roles';
import { runAsPlatform } from '../../lib/tenant';
import { assertPlatformStaff } from '../../lib/platformAccess';
import type { GraphQLContext } from '../../middleware/auth';
import { assertPermission } from '../../lib/permissions';
import { notFound } from '../../utils/errors';
import { open } from '../../utils/secretBox';
import { recordAudit } from '../audit';
import {
  PaypalConfigModel,
  PayoneerConfigModel,
  RazorpayConfigModel,
  StripeConfigModel,
} from '../clienthub/payments/gateway.model';
import { CloudflareConfigModel } from '../dns/cloudflare-config.model';
import { GodaddyConfigModel } from '../dns/godaddy-config.model';
import { EmailVerifierConfigModel } from '../email-verification/email-verifier-config.model';
import { SonarConfigModel } from '../security/sonar-config.model';
import { SocialAppConfigModel } from '../social-accounts/social.models';
import { GoogleSignInConfigModel } from '../auth/google/google-sign-in.models';
import { GmailConfigModel } from '../gmail/gmail.models';
import { EmailConfigModel } from './email-config.model';
import { GithubConfigModel } from './github-config.model';
import { ImageConfigModel } from './image-config.model';
import { InboundMailConfigModel } from './inbound-mail-config.model';
import { OpenAiConfigModel } from './openai-config.model';
import { PexelsConfigModel } from './pexels-config.model';
import { SlackConfigModel } from './slack-config.model';

/**
 * The eye button on Tech > Environment Variables. A saved credential is never listed; staff who
 * may edit the config ask for one value at a time, and every look is written to the audit log.
 */
const TECH_MODULE = 'TechConfig';

type StoredRow = Record<string, unknown>;

interface SecretSource {
  model: Model<StoredRow>;
  field: string;
  /** What the audit summary calls it. */
  name: string;
  /** Sealed at rest with utils/secretBox. */
  sealed?: boolean;
  /** The row is found by this field instead of its _id (social apps are keyed by app). */
  keyField?: string;
  /** Each company's own config (the support mailbox), not the platform's. */
  companyScoped?: boolean;
}

const source = (model: unknown, field: string, name: string, extra: Partial<SecretSource> = {}) =>
  ({ model: model as Model<StoredRow>, field, name, ...extra }) satisfies SecretSource;

const SECRETS: Readonly<Record<string, SecretSource>> = {
  EMAIL_PASSWORD: source(EmailConfigModel, 'password', 'SMTP password'),
  INBOUND_MAIL_PASSWORD: source(InboundMailConfigModel, 'password', 'mailbox password', {
    companyScoped: true,
  }),
  IMAGEKIT_PRIVATE_KEY: source(ImageConfigModel, 'privateKey', 'ImageKit private key'),
  SLACK_BOT_TOKEN: source(SlackConfigModel, 'botToken', 'Slack bot token'),
  SLACK_SIGNING_SECRET: source(SlackConfigModel, 'signingSecret', 'Slack signing secret'),
  GITHUB_TOKEN: source(GithubConfigModel, 'token', 'GitHub token'),
  PEXELS_API_KEY: source(PexelsConfigModel, 'apiKey', 'Pexels API key'),
  OPENAI_API_KEY: source(OpenAiConfigModel, 'apiKey', 'OpenAI API key'),
  SONAR_TOKEN: source(SonarConfigModel, 'token', 'SonarQube token'),
  GODADDY_API_KEY: source(GodaddyConfigModel, 'apiKey', 'GoDaddy API key'),
  GODADDY_API_SECRET: source(GodaddyConfigModel, 'apiSecret', 'GoDaddy API secret'),
  CLOUDFLARE_API_TOKEN: source(CloudflareConfigModel, 'apiToken', 'Cloudflare API token'),
  STRIPE_SECRET_KEY: source(StripeConfigModel, 'secretKey', 'Stripe secret key', { sealed: true }),
  STRIPE_WEBHOOK_SECRET: source(StripeConfigModel, 'webhookSecret', 'Stripe webhook secret', {
    sealed: true,
  }),
  RAZORPAY_KEY_SECRET: source(RazorpayConfigModel, 'keySecret', 'Razorpay key secret', {
    sealed: true,
  }),
  RAZORPAY_WEBHOOK_SECRET: source(RazorpayConfigModel, 'webhookSecret', 'Razorpay webhook secret', {
    sealed: true,
  }),
  PAYPAL_CLIENT_SECRET: source(PaypalConfigModel, 'clientSecret', 'PayPal client secret', {
    sealed: true,
  }),
  PAYONEER_API_TOKEN: source(PayoneerConfigModel, 'apiToken', 'Payoneer API token', {
    sealed: true,
  }),
  EMAIL_VERIFIER_PROXY_PASSWORD: source(
    EmailVerifierConfigModel,
    'proxyPassword',
    'proxy password',
  ),
  GOOGLE_SIGN_IN_CLIENT_SECRET: source(
    GoogleSignInConfigModel,
    'clientSecret',
    'Google client secret',
    {
      keyField: 'key',
    },
  ),
  GMAIL_CLIENT_SECRET: source(GmailConfigModel, 'clientSecret', 'Gmail client secret', {
    keyField: 'key',
  }),
  SOCIAL_APP_CLIENT_SECRET: source(SocialAppConfigModel, 'clientSecret', 'client secret', {
    keyField: 'app',
  }),
};

const findRow = (secret: SecretSource, id: string): Promise<StoredRow | null> => {
  const filter = { [secret.keyField ?? '_id']: id };
  const query = () => secret.model.findOne(filter).select(secret.field).lean<StoredRow>().exec();
  return secret.companyScoped ? query() : runAsPlatform(query);
};

const guardFor = (ctx: GraphQLContext, secret: SecretSource) =>
  secret.companyScoped
    ? assertPermission(ctx, TECH_MODULE, [ROLES.TECH], 'EDIT')
    : assertPlatformStaff(ctx, TECH_MODULE, [ROLES.TECH], 'EDIT');

/** The stored value of one credential, opened when it is sealed. */
async function revealTechSecret(ctx: GraphQLContext, id: string, kind: string): Promise<string> {
  const secret = SECRETS[kind];
  await guardFor(ctx, secret);
  const row = await findRow(secret, id);
  if (!row) notFound('Config');
  const stored = typeof row[secret.field] === 'string' ? (row[secret.field] as string) : '';
  await recordAudit(ctx, {
    action: 'ACCESS',
    module: TECH_MODULE,
    entityId: id,
    entityLabel: secret.name,
    summary: `Revealed the saved ${secret.name}`,
  });
  return secret.sealed && stored !== '' ? open(stored) : stored;
}

export const techRevealResolvers = {
  Mutation: {
    revealTechSecret: (
      _p: unknown,
      { id, secret }: { id: string; secret: string },
      ctx: GraphQLContext,
    ) => revealTechSecret(ctx, id, secret),
  },
};
