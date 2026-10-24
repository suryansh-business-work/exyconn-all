import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Response } from 'express';
import type {
  AuthorizationParams,
  OAuthServerProvider,
} from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type {
  OAuthClientInformationFull,
  OAuthTokenRevocationRequest,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import {
  InvalidGrantError,
  InvalidTokenError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import { env } from '../../config/env';
import { runAsPlatform } from '../../lib/tenant';
import { open, seal } from '../../utils/secretBox';
import { McpAuthCodeModel, McpAuthRequestModel, McpClientModel, McpTokenModel } from './mcp.models';

/** The one scope a connection asks for: the CRM, as the signed-in person may use it. */
export const MCP_SCOPE = 'crm';

const REQUEST_TTL_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const hashOf = (value: string) => createHash('sha256').update(value).digest('hex');
const secret = () => randomBytes(32).toString('base64url');
const platform = <T>(run: () => Promise<T>) => runAsPlatform(run);

/**
 * Registered clients (RFC 7591), kept so Claude registers once per connector. A client is kept
 * exactly as it registered — public (PKCE only, `none`) or confidential (`client_secret_post`,
 * the secret sealed at rest) — so the token endpoint checks it the way the client authenticates.
 */
const clientsStore: OAuthRegisteredClientsStore = {
  async getClient(clientId) {
    const row = await platform(() => McpClientModel.findOne({ clientId }).lean());
    if (!row) return undefined;
    // Registrations from before secrets were kept apart carry theirs in the metadata: never read.
    const metadata = { ...(row.metadata as Record<string, unknown>) };
    delete metadata.client_secret;
    return {
      ...metadata,
      client_id: row.clientId,
      client_name: row.clientName || undefined,
      redirect_uris: row.redirectUris,
      ...(row.clientSecret ? { client_secret: open(row.clientSecret) } : {}),
    } as OAuthClientInformationFull;
  },
  async registerClient(client) {
    const clientId = randomUUID();
    const { client_secret: secretOfClient, ...metadata } = client;
    await platform(() =>
      McpClientModel.create({
        clientId,
        clientSecret: secretOfClient ? seal(secretOfClient) : '',
        clientName: client.client_name ?? '',
        redirectUris: client.redirect_uris.map(String),
        metadata,
      }),
    );
    return {
      ...client,
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
    };
  },
};

/** A new pair of tokens for a connection; only their hashes are kept. */
async function issueTokens(
  base: { clientId: string; clientName: string; userId: string; organizationId: string },
  scopes: string[],
): Promise<OAuthTokens> {
  const access = secret();
  const refresh = secret();
  await platform(() =>
    McpTokenModel.create({
      ...base,
      scopes,
      accessHash: hashOf(access),
      refreshHash: hashOf(refresh),
      accessExpiresAt: new Date(Date.now() + env.mcp.accessTokenTtlSeconds * 1000),
      refreshExpiresAt: new Date(Date.now() + env.mcp.refreshTokenTtlDays * DAY_MS),
    }),
  );
  return {
    access_token: access,
    token_type: 'Bearer',
    expires_in: env.mcp.accessTokenTtlSeconds,
    refresh_token: refresh,
    scope: scopes.join(' '),
  };
}

/**
 * The CRM MCP server's OAuth 2.1 sign-in, as the MCP SDK's auth router drives it: dynamic client
 * registration, an authorization request the person allows on the AI portal (signed in there as
 * themselves), a PKCE-bound one-time code, and rotating tokens tied to that person and company.
 */
export const mcpOAuthProvider: OAuthServerProvider = {
  get clientsStore() {
    return clientsStore;
  },

  /** Keeps the request and sends the browser to the AI portal's consent page. */
  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response) {
    const request = await platform(() =>
      McpAuthRequestModel.create({
        clientId: client.client_id,
        redirectUri: params.redirectUri,
        codeChallenge: params.codeChallenge,
        state: params.state ?? '',
        scopes: params.scopes?.length ? params.scopes : [MCP_SCOPE],
        resource: params.resource?.href ?? '',
        expiresAt: new Date(Date.now() + REQUEST_TTL_MS),
      }),
    );
    res.redirect(`${env.mcp.consentUrl}?request=${request.id}`);
  },

  async challengeForAuthorizationCode(_client, authorizationCode) {
    const code = await platform(() =>
      McpAuthCodeModel.findOne({ codeHash: hashOf(authorizationCode) }).lean(),
    );
    if (!code) throw new InvalidGrantError('The sign-in code is invalid or has expired.');
    return code.codeChallenge;
  },

  /** Spends the code (once, by the client it was issued to) for the connection's first tokens. */
  async exchangeAuthorizationCode(client, authorizationCode, _verifier, redirectUri) {
    const code = await platform(() =>
      McpAuthCodeModel.findOneAndUpdate(
        { codeHash: hashOf(authorizationCode), usedAt: null, expiresAt: { $gt: new Date() } },
        { $set: { usedAt: new Date() } },
        { new: true },
      ).lean(),
    );
    const matches =
      code?.clientId === client.client_id && (!redirectUri || code.redirectUri === redirectUri);
    if (!code || !matches) {
      throw new InvalidGrantError('The sign-in code is invalid or has expired.');
    }
    return issueTokens(
      {
        clientId: client.client_id,
        clientName: client.client_name ?? '',
        userId: code.userId,
        organizationId: code.organizationId,
      },
      code.scopes,
    );
  },

  /** Rotates the pair: the old row is retired, a new one carries the same connection on. */
  async exchangeRefreshToken(client, refreshToken) {
    const row = await platform(() =>
      McpTokenModel.findOneAndUpdate(
        {
          refreshHash: hashOf(refreshToken),
          clientId: client.client_id,
          revokedAt: null,
          refreshExpiresAt: { $gt: new Date() },
        },
        { $set: { revokedAt: new Date() } },
        { new: true },
      ).lean(),
    );
    if (!row) throw new InvalidGrantError('Sign in again.');
    return issueTokens(
      {
        clientId: row.clientId,
        clientName: row.clientName,
        userId: row.userId,
        organizationId: row.organizationId,
      },
      row.scopes,
    );
  },

  /** The connection behind an access token, or an error that makes Claude refresh or sign in. */
  async verifyAccessToken(token): Promise<AuthInfo> {
    const row = await platform(() =>
      McpTokenModel.findOneAndUpdate(
        { accessHash: hashOf(token), revokedAt: null, accessExpiresAt: { $gt: new Date() } },
        { $set: { lastUsedAt: new Date() } },
        { new: true },
      ).lean(),
    );
    if (!row) throw new InvalidTokenError('The access token is invalid or has expired.');
    return {
      token,
      clientId: row.clientId,
      scopes: row.scopes,
      expiresAt: Math.floor(row.accessExpiresAt.getTime() / 1000),
      extra: {
        connectionId: String(row._id),
        userId: row.userId,
        organizationId: row.organizationId,
        clientName: row.clientName,
      },
    };
  },

  async revokeToken(client, request: OAuthTokenRevocationRequest) {
    const hash = hashOf(request.token);
    await platform(() =>
      McpTokenModel.updateOne(
        { clientId: client.client_id, $or: [{ accessHash: hash }, { refreshHash: hash }] },
        { $set: { revokedAt: new Date() } },
      ),
    );
  },
};

/** Hashes a one-time code the same way the provider looks it up. */
export function codeHashOf(code: string): string {
  return hashOf(code);
}

/** A fresh one-time code. */
export function newAuthorizationCode(): string {
  return secret();
}
