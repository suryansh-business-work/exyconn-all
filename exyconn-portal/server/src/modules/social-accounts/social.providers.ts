import type { SocialApp, SocialNetwork } from './social.constants';
import { getJson, postForm } from './social.http';

/** What the tokens are, as the provider answered. */
export interface ProviderTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number | null;
}

/** One account a connection reaches — a member, a page, a channel. */
export interface ProviderAccount {
  network: SocialNetwork;
  externalId: string;
  name: string;
  handle: string;
  avatarUrl: string;
  /** Set when the account has its own token (a Facebook Page); otherwise the user's. */
  accessToken?: string;
  /** A page token does not expire, whatever the user token does. */
  neverExpires?: boolean;
}

export interface AppCredentials {
  clientId: string;
  clientSecret: string;
}

interface Provider {
  label: string;
  /** The console where the app is registered — shown beside the callback URL in Tech. */
  consoleUrl: string;
  authorizeUrl: (
    app: AppCredentials,
    redirectUri: string,
    state: string,
    challenge: string,
  ) => string;
  exchange: (
    app: AppCredentials,
    code: string,
    redirectUri: string,
    verifier: string,
  ) => Promise<ProviderTokens>;
  accounts: (tokens: ProviderTokens, app: AppCredentials) => Promise<ProviderAccount[]>;
}

const META_GRAPH = 'https://graph.facebook.com/v19.0';
const str = (value: unknown): string => (typeof value === 'string' ? value : '');
const num = (value: unknown): number | null => (typeof value === 'number' ? value : null);

const url = (base: string, params: Record<string, string>) =>
  `${base}?${new URLSearchParams(params).toString()}`;

const tokensOf = (body: Record<string, unknown>): ProviderTokens => ({
  accessToken: str(body.access_token),
  refreshToken: str(body.refresh_token),
  expiresInSeconds: num(body.expires_in),
});

const linkedin: Provider = {
  label: 'LinkedIn',
  consoleUrl: 'https://www.linkedin.com/developers/apps',
  authorizeUrl: (app, redirectUri, state) =>
    url('https://www.linkedin.com/oauth/v2/authorization', {
      response_type: 'code',
      client_id: app.clientId,
      redirect_uri: redirectUri,
      state,
      scope: 'openid profile w_member_social',
    }),
  exchange: async (app, code, redirectUri) =>
    tokensOf(
      await postForm('LinkedIn', 'https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: app.clientId,
        client_secret: app.clientSecret,
      }),
    ),
  accounts: async (tokens) => {
    const me = await getJson(
      'LinkedIn',
      'https://api.linkedin.com/v2/userinfo',
      tokens.accessToken,
    );
    return [
      {
        network: 'LINKEDIN',
        externalId: str(me.sub),
        name: str(me.name),
        handle: '',
        avatarUrl: str(me.picture),
      },
    ];
  },
};

/** Facebook Pages the person manages, and the Instagram Business account linked to each. */
async function metaAccounts(tokens: ProviderTokens): Promise<ProviderAccount[]> {
  const fields =
    'id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}';
  const pages = await getJson(
    'Meta',
    url(`${META_GRAPH}/me/accounts`, { fields }),
    tokens.accessToken,
  );
  const rows = Array.isArray(pages.data) ? (pages.data as Record<string, unknown>[]) : [];
  return rows.flatMap((page) => {
    const pageToken = str(page.access_token);
    const picture = (page.picture as { data?: { url?: string } } | undefined)?.data?.url ?? '';
    const facebook: ProviderAccount = {
      network: 'FACEBOOK',
      externalId: str(page.id),
      name: str(page.name),
      handle: '',
      avatarUrl: picture,
      accessToken: pageToken,
      neverExpires: true,
    };
    const ig = page.instagram_business_account as Record<string, unknown> | undefined;
    if (!ig) return [facebook];
    return [
      facebook,
      {
        network: 'INSTAGRAM',
        externalId: str(ig.id),
        name: str(ig.username),
        handle: `@${str(ig.username)}`,
        avatarUrl: str(ig.profile_picture_url),
        accessToken: pageToken,
        neverExpires: true,
      },
    ];
  });
}

const meta: Provider = {
  label: 'Facebook + Instagram',
  consoleUrl: 'https://developers.facebook.com/apps',
  authorizeUrl: (app, redirectUri, state) =>
    url('https://www.facebook.com/v19.0/dialog/oauth', {
      client_id: app.clientId,
      redirect_uri: redirectUri,
      state,
      scope:
        'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,business_management',
    }),
  exchange: async (app, code, redirectUri) => {
    const short = tokensOf(
      await getJson(
        'Meta',
        url(`${META_GRAPH}/oauth/access_token`, {
          client_id: app.clientId,
          client_secret: app.clientSecret,
          redirect_uri: redirectUri,
          code,
        }),
      ),
    );
    // A long-lived user token is what makes the page tokens derived from it never expire.
    return tokensOf(
      await getJson(
        'Meta',
        url(`${META_GRAPH}/oauth/access_token`, {
          grant_type: 'fb_exchange_token',
          client_id: app.clientId,
          client_secret: app.clientSecret,
          fb_exchange_token: short.accessToken,
        }),
      ),
    );
  },
  accounts: metaAccounts,
};

const x: Provider = {
  label: 'X',
  consoleUrl: 'https://developer.x.com/en/portal/projects-and-apps',
  authorizeUrl: (app, redirectUri, state, challenge) =>
    url('https://x.com/i/oauth2/authorize', {
      response_type: 'code',
      client_id: app.clientId,
      redirect_uri: redirectUri,
      state,
      scope: 'tweet.read tweet.write users.read offline.access',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }),
  exchange: async (app, code, redirectUri, verifier) =>
    tokensOf(
      await postForm(
        'X',
        'https://api.x.com/2/oauth2/token',
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: verifier,
          client_id: app.clientId,
        },
        {
          Authorization: `Basic ${Buffer.from(`${app.clientId}:${app.clientSecret}`).toString('base64')}`,
        },
      ),
    ),
  accounts: async (tokens) => {
    const me = await getJson(
      'X',
      'https://api.x.com/2/users/me?user.fields=profile_image_url',
      tokens.accessToken,
    );
    const user = (me.data ?? {}) as Record<string, unknown>;
    return [
      {
        network: 'X',
        externalId: str(user.id),
        name: str(user.name),
        handle: `@${str(user.username)}`,
        avatarUrl: str(user.profile_image_url),
      },
    ];
  },
};

const youtube: Provider = {
  label: 'YouTube',
  consoleUrl: 'https://console.cloud.google.com/apis/credentials',
  authorizeUrl: (app, redirectUri, state, challenge) =>
    url('https://accounts.google.com/o/oauth2/v2/auth', {
      response_type: 'code',
      client_id: app.clientId,
      redirect_uri: redirectUri,
      state,
      scope:
        'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload',
      // A refresh token is only issued offline, and only on a consent screen.
      access_type: 'offline',
      prompt: 'consent',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }),
  exchange: async (app, code, redirectUri, verifier) =>
    tokensOf(
      await postForm('YouTube', 'https://oauth2.googleapis.com/token', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: app.clientId,
        client_secret: app.clientSecret,
        code_verifier: verifier,
      }),
    ),
  accounts: async (tokens) => {
    const channels = await getJson(
      'YouTube',
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      tokens.accessToken,
    );
    const items = Array.isArray(channels.items)
      ? (channels.items as Record<string, unknown>[])
      : [];
    return items.map((item) => {
      const snippet = (item.snippet ?? {}) as Record<string, unknown>;
      const thumbnails = snippet.thumbnails as { default?: { url?: string } } | undefined;
      return {
        network: 'YOUTUBE' as const,
        externalId: str(item.id),
        name: str(snippet.title),
        handle: str(snippet.customUrl),
        avatarUrl: thumbnails?.default?.url ?? '',
      };
    });
  },
};

export const PROVIDERS: Readonly<Record<SocialApp, Provider>> = {
  LINKEDIN: linkedin,
  META: meta,
  X: x,
  YOUTUBE: youtube,
};
