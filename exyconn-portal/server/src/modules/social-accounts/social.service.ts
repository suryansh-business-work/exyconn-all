import { createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env';
import { runAsPlatform, runForOrganization } from '../../lib/tenant';
import { badRequest, notFound } from '../../utils/errors';
import { seal } from '../../utils/secretBox';
import { SOCIAL_APPS, SOCIAL_CALLBACK_PATH, type SocialApp } from './social.constants';
import { SocialAccountModel, SocialAppConfigModel, SocialOAuthStateModel } from './social.models';
import { PROVIDERS, type ProviderAccount, type ProviderTokens } from './social.providers';

export interface SocialAppConfigInput {
  app: SocialApp;
  clientId: string;
  /** Write-only: blank keeps the stored secret. */
  clientSecret?: string | null;
  enabled: boolean;
}

/** The address each provider must have registered as its redirect / callback URL. */
export const callbackUrl = (app: SocialApp): string =>
  `${env.apiPublicUrl}${SOCIAL_CALLBACK_PATH}/${app.toLowerCase()}/callback`;

const base64url = (bytes: Buffer) => bytes.toString('base64url');

/** Every provider, configured or not, so Tech always shows the four to fill in. */
export async function appConfigs() {
  const stored = await runAsPlatform(() => SocialAppConfigModel.find().lean());
  return SOCIAL_APPS.map((app) => {
    const row = stored.find((config) => config.app === app);
    return {
      id: app,
      app,
      label: PROVIDERS[app].label,
      consoleUrl: PROVIDERS[app].consoleUrl,
      callbackUrl: callbackUrl(app),
      clientId: row?.clientId ?? '',
      clientSecret: row?.clientSecret ?? '',
      enabled: row?.enabled ?? false,
    };
  });
}

export async function saveAppConfig(input: SocialAppConfigInput) {
  const clientId = input.clientId.trim();
  const secret = input.clientSecret?.trim() ?? '';
  const stored = await runAsPlatform(() =>
    SocialAppConfigModel.findOne({ app: input.app }).select('clientSecret').lean(),
  );
  // Checked before anything is written: a refused save must not leave the app half on.
  if (input.enabled && clientId === '') {
    badRequest('Add the client ID before turning the app on');
  }
  if (input.enabled && secret === '' && !stored?.clientSecret) {
    badRequest('Add the client secret before turning the app on');
  }
  await runAsPlatform(() =>
    SocialAppConfigModel.updateOne(
      { app: input.app },
      {
        $set: {
          clientId,
          enabled: input.enabled,
          ...(secret === '' ? {} : { clientSecret: secret }),
        },
      },
      { upsert: true },
    ),
  );
  return (await appConfigs()).find((config) => config.app === input.app);
}

/** The credentials of an app that is turned on, or a refusal saying what is missing. */
async function usableApp(app: SocialApp) {
  const config = (await appConfigs()).find((row) => row.app === app);
  if (!config?.enabled || config.clientId === '' || config.clientSecret === '') {
    badRequest(
      `${PROVIDERS[app].label} is not set up yet. Ask Tech to add it under Environment Variables › Social apps.`,
    );
  }
  return config;
}

/** Starts a connection: remembers who asked, and returns the provider's consent page. */
export async function startConnect(
  app: SocialApp,
  organizationId: string,
  userId: string,
  returnTo: string,
) {
  const config = await usableApp(app);
  const nonce = base64url(randomBytes(24));
  const codeVerifier = base64url(randomBytes(48));
  const challenge = base64url(createHash('sha256').update(codeVerifier).digest());
  await runAsPlatform(() =>
    SocialOAuthStateModel.create({ nonce, app, organizationId, userId, codeVerifier, returnTo }),
  );
  return PROVIDERS[app].authorizeUrl(config, callbackUrl(app), nonce, challenge);
}

const expiryOf = (tokens: ProviderTokens, account: ProviderAccount): Date | null => {
  if (account.neverExpires || tokens.expiresInSeconds === null) return null;
  return new Date(Date.now() + tokens.expiresInSeconds * 1000);
};

/**
 * Finishes a connection at the provider's callback: exchanges the code, reads every account
 * the grant reaches and saves each into the company that started it. Returns where to send
 * the browser. A reconnect updates the account in place rather than adding a second one.
 */
export async function completeConnect(app: SocialApp, nonce: string, code: string) {
  const state = await runAsPlatform(() =>
    SocialOAuthStateModel.findOneAndDelete({ nonce, app }).lean(),
  );
  if (!state) {
    badRequest(
      'This connection link has expired or was already used. Start again from Marketing › Social accounts.',
    );
  }
  const config = await usableApp(app);
  const provider = PROVIDERS[app];
  const tokens = await provider.exchange(config, code, callbackUrl(app), state.codeVerifier);
  const accounts = await provider.accounts(tokens, config);
  if (accounts.length === 0) {
    badRequest(`${provider.label} returned no account this login can manage.`);
  }
  await runForOrganization(state.organizationId, () =>
    Promise.all(
      accounts.map((account) =>
        SocialAccountModel.updateOne(
          { network: account.network, externalId: account.externalId },
          {
            $set: {
              app,
              name: account.name,
              handle: account.handle,
              avatarUrl: account.avatarUrl,
              accessToken: seal(account.accessToken ?? tokens.accessToken),
              refreshToken: tokens.refreshToken === '' ? '' : seal(tokens.refreshToken),
              expiresAt: expiryOf(tokens, account),
              connectedBy: state.userId,
            },
          },
          { upsert: true },
        ),
      ),
    ),
  );
  return { returnTo: state.returnTo, connected: accounts.length };
}

export function listAccounts() {
  return SocialAccountModel.find()
    .select('-accessToken -refreshToken')
    .sort({ network: 1, name: 1 })
    .lean();
}

export async function disconnect(id: string): Promise<boolean> {
  const removed = await SocialAccountModel.findByIdAndDelete(id).lean();
  if (!removed) notFound('Social account');
  return true;
}
