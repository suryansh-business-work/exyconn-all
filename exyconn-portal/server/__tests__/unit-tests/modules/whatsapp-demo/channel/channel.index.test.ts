import { randomUUID } from 'node:crypto';
import { Kind, type ObjectTypeDefinitionNode } from 'graphql';
import {
  WEBHOOK_PATH,
  startWhatsappReminders,
  whatsappChannelResolvers,
  whatsappChannelTypeDefs,
  whatsappWebhookRouter,
} from '../../../../../src/modules/whatsapp-demo/channel';
import { WhatsappChannelModel } from '../../../../../src/modules/whatsapp-demo/channel/channel.model';
import { ROLES, type Role } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { codeOf } from '../../codeOf';
import { seedUser, useTestOrganization } from '../../../../helpers';

const organizationId = useTestOrganization();
const { Query, Mutation } = whatsappChannelResolvers;

async function asUser(roles: Role[]): Promise<GraphQLContext> {
  const user = await seedUser(`${roles.join('-').toLowerCase()}@test.co`, randomUUID(), roles);
  return { user: { id: String(user._id), email: user.email, roles, organizationId } };
}

const input = {
  phoneNumberId: '1098765',
  displayPhone: '+91 98000 00001',
  accessToken: randomUUID(),
  appSecret: randomUUID(),
  verifyToken: 'verify-me-please',
  enabled: true,
};

describe('whatsappChannelResolvers', () => {
  it('lets a company administrator read, save and remove the number', async () => {
    const ctx = await asUser([ROLES.ADMIN]);

    const saved = await Mutation.saveWhatsappChannel(null, { input }, ctx);
    expect(saved.phoneNumberId).toBe('1098765');
    expect((await Query.whatsappChannel(null, null, ctx)).channel?.id).toBe(saved.id);
    await expect(Mutation.deleteWhatsappChannel(null, null, ctx)).resolves.toBe(true);
    expect(await WhatsappChannelModel.countDocuments()).toBe(0);
  });

  it('lets a platform administrator in too', async () => {
    const ctx = await asUser([ROLES.SUPER_ADMIN]);

    await expect(Query.whatsappChannel(null, null, ctx)).resolves.toEqual(
      expect.objectContaining({ channel: null }),
    );
  });

  it('keeps everybody else out of every operation', async () => {
    const ctx = await asUser([ROLES.EMPLOYEE]);

    expect(await codeOf(Promise.resolve().then(() => Query.whatsappChannel(null, null, ctx)))).toBe(
      'FORBIDDEN',
    );
    expect(
      await codeOf(
        Promise.resolve().then(() => Mutation.saveWhatsappChannel(null, { input }, ctx)),
      ),
    ).toBe('FORBIDDEN');
    expect(
      await codeOf(Promise.resolve().then(() => Mutation.deleteWhatsappChannel(null, null, ctx))),
    ).toBe('FORBIDDEN');
    expect(await WhatsappChannelModel.countDocuments()).toBe(0);
  });

  it('asks a signed-out caller to sign in', async () => {
    const ctx: GraphQLContext = { user: null };

    expect(await codeOf(Promise.resolve().then(() => Query.whatsappChannel(null, null, ctx)))).toBe(
      'UNAUTHENTICATED',
    );
  });
});

describe('channel module surface', () => {
  it('describes the settings screen in its schema', () => {
    const types = whatsappChannelTypeDefs.definitions
      .filter((d): d is ObjectTypeDefinitionNode => d.kind === Kind.OBJECT_TYPE_DEFINITION)
      .map((d) => d.name.value);

    expect(types).toEqual(['WhatsappChannel', 'WhatsappChannelSettings']);
  });

  it('exposes the webhook path, router and reminder loop the server mounts', () => {
    expect(WEBHOOK_PATH).toBe('/webhooks/whatsapp');
    expect(typeof whatsappWebhookRouter()).toBe('function');
    expect(typeof startWhatsappReminders).toBe('function');
  });
});
