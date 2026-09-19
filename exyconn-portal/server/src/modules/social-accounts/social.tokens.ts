import { open, seal } from '../../utils/secretBox';
import type { SocialApp } from './social.constants';
import { SocialProviderError, postForm } from './social.http';
import { SocialAccountModel } from './social.models';
import { PROVIDERS, type AppCredentials } from './social.providers';
import { usableApp } from './social.service';

/** Refresh this long before expiry, so a token never lapses mid-request. */
const EARLY_MS = 2 * 60 * 1000;

type Refresh = (app: AppCredentials, refreshToken: string) => Promise<Record<string, unknown>>;

/** The providers whose access tokens expire and come with a refresh token. */
const REFRESH: Partial<Record<SocialApp, Refresh>> = {
  X: (app, refreshToken) =>
    postForm(
      'X',
      'https://api.x.com/2/oauth2/token',
      { grant_type: 'refresh_token', refresh_token: refreshToken, client_id: app.clientId },
      {
        Authorization: `Basic ${Buffer.from(`${app.clientId}:${app.clientSecret}`).toString('base64')}`,
      },
    ),
  YOUTUBE: (app, refreshToken) =>
    postForm('YouTube', 'https://oauth2.googleapis.com/token', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: app.clientId,
      client_secret: app.clientSecret,
    }),
  LINKEDIN: (app, refreshToken) =>
    postForm('LinkedIn', 'https://www.linkedin.com/oauth/v2/accessToken', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: app.clientId,
      client_secret: app.clientSecret,
    }),
};

interface StoredAccount {
  _id: unknown;
  app: SocialApp;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
}

/**
 * A usable access token for the account: the stored one while it is valid, otherwise a
 * refreshed one, saved for next time. An expired token with no way to refresh it means the
 * account has to be connected again — said in words the Marketing page can show.
 */
export async function accessTokenOf(account: StoredAccount): Promise<string> {
  if (!account.expiresAt || account.expiresAt.getTime() - EARLY_MS > Date.now()) {
    return open(account.accessToken);
  }
  const refresh = REFRESH[account.app];
  if (!refresh || !account.refreshToken) {
    throw new SocialProviderError(
      PROVIDERS[account.app].label,
      'the connection has expired — connect the account again',
    );
  }
  const body = await refresh(await usableApp(account.app), open(account.refreshToken));
  const accessToken = typeof body.access_token === 'string' ? body.access_token : '';
  const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : '';
  const expiresIn = typeof body.expires_in === 'number' ? body.expires_in : null;
  await SocialAccountModel.updateOne(
    { _id: account._id },
    {
      $set: {
        accessToken: seal(accessToken),
        expiresAt: expiresIn === null ? null : new Date(Date.now() + expiresIn * 1000),
        // Some providers rotate the refresh token; keep the old one when they do not.
        ...(refreshToken ? { refreshToken: seal(refreshToken) } : {}),
      },
    },
  );
  return accessToken;
}
