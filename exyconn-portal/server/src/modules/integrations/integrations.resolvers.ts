import { ApiKeyModel } from './api-key.model';
import { generateApiKey } from './api-key.service';
import { WebhookDeliveryModel, WebhookModel, WEBHOOK_EVENTS } from './webhook.model';
import { generateWebhookSecret } from './webhook.dispatch';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES, type Role } from '../../constants/roles';
import { badRequest, notFound } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';

/** Integrations are an administrator's business: a key is a way into everything it can reach. */
const integrationRoles = [ROLES.ADMIN];

/** Every role a key may be granted. A key can never exceed what a person could hold. */
const GRANTABLE = new Set<string>(Object.values(ROLES));

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
      { name, roles }: { name: string; roles: string[] },
      ctx: GraphQLContext,
    ) => {
      const user = assertRole(ctx, integrationRoles);
      const unknown = roles.filter((role) => !GRANTABLE.has(role));
      if (unknown.length > 0) {
        badRequest(`Not a role this portal has: ${unknown.join(', ')}`);
      }
      const issued = generateApiKey();
      const row = await ApiKeyModel.create({
        name,
        prefix: issued.prefix,
        keyHash: issued.keyHash,
        roles: roles as Role[],
        createdBy: user.email,
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
