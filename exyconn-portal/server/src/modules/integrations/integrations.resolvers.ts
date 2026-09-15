import { ApiKeyModel } from './api-key.model';
import { generateApiKey } from './api-key.service';
import { WebhookDeliveryModel, WebhookModel, WEBHOOK_EVENTS } from './webhook.model';
import { generateWebhookSecret } from './webhook.dispatch';
import { assertRole } from '../../middleware/roleGuard';
import { ORGANIZATION_ROLES, ROLES, type Role } from '../../constants/roles';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import { assertPublicHttpsUrl, UnsafeUrlError } from '../../utils/safeFetch';
import type { GraphQLContext } from '../../middleware/auth';

/** Integrations are an administrator's business: a key is a way into everything it can reach. */
const integrationRoles = [ROLES.ADMIN];

/** Every role a key may be granted: a company's roles, never the platform's SUPER_ADMIN. */
const GRANTABLE = new Set<string>(ORGANIZATION_ROLES);

/** The longest a key may live. A credential nobody rotates is one nobody notices leaking. */
const MAX_KEY_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Refuses a role a key may not carry: anything outside the company's roles, and anything the
 * creator does not hold — a key is never more powerful than the person who minted it. ADMIN
 * holds every company role, so an administrator may grant any of them.
 */
function assertGrantableRoles(creatorRoles: readonly string[], roles: readonly string[]): void {
  const unknown = roles.filter((role) => !GRANTABLE.has(role));
  if (unknown.length > 0) {
    badRequest(`Not a role an API key may be granted: ${unknown.join(', ')}`);
  }
  if (creatorRoles.includes(ROLES.ADMIN)) {
    return;
  }
  const beyond = roles.filter((role) => !creatorRoles.includes(role));
  if (beyond.length > 0) {
    forbidden(`A key cannot carry a role you do not hold: ${beyond.join(', ')}`);
  }
}

/** An optional expiry must be in the future and no further out than a year. */
function checkedExpiry(expiresAt: Date | string | null | undefined, now = Date.now()): Date | null {
  if (expiresAt === null || expiresAt === undefined) {
    return null;
  }
  const at = new Date(expiresAt);
  if (Number.isNaN(at.getTime()) || at.getTime() <= now) {
    badRequest('An API key must expire in the future.');
  }
  if (at.getTime() - now > MAX_KEY_LIFETIME_MS) {
    badRequest('An API key may be valid for at most one year.');
  }
  return at;
}

/** A webhook may only point at a public address — never this server's own network. */
async function assertWebhookTarget(url: string): Promise<void> {
  try {
    await assertPublicHttpsUrl(url);
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      badRequest(error.message);
    }
    throw error;
  }
}

export const integrationsResolvers = {
  Query: {
    listApiKeys: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, integrationRoles);
      // The hash is never selected. Nothing downstream has any use for it, and a field that
      // is never read cannot be leaked by a resolver somebody adds later.
      return withIds(await ApiKeyModel.find().select('-keyHash').sort({ createdAt: -1 }).lean());
    },
    webhookEvents: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, integrationRoles);
      return [...WEBHOOK_EVENTS];
    },
    listWebhooks: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, integrationRoles);
      // The secret is never listed — it is shown once, when the endpoint is created.
      return withIds(await WebhookModel.find().select('-secret').sort({ createdAt: -1 }).lean());
    },
    listWebhookDeliveries: async (
      _p: unknown,
      { webhookId }: { webhookId: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, integrationRoles);
      return withIds(
        await WebhookDeliveryModel.find({ webhookId }).sort({ createdAt: -1 }).limit(100).lean(),
      );
    },
  },
  Mutation: {
    /**
     * Mints a key and returns the plaintext — the ONLY time it exists. Everything after this
     * sees a prefix and a hash.
     */
    createApiKey: async (
      _p: unknown,
      { name, roles, expiresAt }: { name: string; roles: string[]; expiresAt?: Date | null },
      ctx: GraphQLContext,
    ) => {
      const user = assertRole(ctx, integrationRoles);
      assertGrantableRoles(user.roles ?? [], roles);
      const expiry = checkedExpiry(expiresAt);
      const issued = generateApiKey();
      // The tenant scope stamps the creator's organization on the key, and principalForApiKey
      // hands it back, so every request made with the key is confined to that company.
      const row = await ApiKeyModel.create({
        name,
        prefix: issued.prefix,
        keyHash: issued.keyHash,
        roles: roles as Role[],
        createdBy: user.email,
        expiresAt: expiry,
      });
      return { apiKey: withId(row.toObject()), key: issued.key };
    },

    revokeApiKey: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, integrationRoles);
      const row = await ApiKeyModel.findByIdAndUpdate(id, { revokedAt: new Date() }, { new: true });
      if (!row) {
        notFound('API key');
      }
      return withId(row.toObject());
    },

    /** Creates an endpoint and returns its signing secret once. */
    createWebhook: async (
      _p: unknown,
      { name, url, events }: { name: string; url: string; events: string[] },
      ctx: GraphQLContext,
    ) => {
      const user = assertRole(ctx, integrationRoles);
      if (!/^https:\/\//i.test(url)) {
        // Plain http would put a signed payload on the wire in clear.
        badRequest('A webhook URL must be https.');
      }
      await assertWebhookTarget(url);
      const unknown = events.filter((event) => !WEBHOOK_EVENTS.includes(event as never));
      if (unknown.length === 0 && events.length === 0) {
        badRequest('Choose at least one event, or the endpoint will never fire.');
      }
      if (unknown.length > 0) {
        badRequest(`Not an event this portal emits: ${unknown.join(', ')}`);
      }
      const secret = generateWebhookSecret();
      const row = await WebhookModel.create({ name, url, events, secret, createdBy: user.email });
      return { webhook: withId(row.toObject()), secret };
    },

    setWebhookActive: async (
      _p: unknown,
      { id, active }: { id: string; active: boolean },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, integrationRoles);
      const row = await WebhookModel.findByIdAndUpdate(id, { active }, { new: true });
      if (!row) {
        notFound('Webhook');
      }
      return withId(row.toObject());
    },

    deleteWebhook: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, integrationRoles);
      await WebhookModel.findByIdAndDelete(id);
      return true;
    },
  },
};
