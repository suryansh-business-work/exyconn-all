import { randomBytes, randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import {
  WEBHOOK_PATH,
  activeSender,
  deleteChannel,
  getChannel,
  saveChannel,
  type WhatsappChannelInput,
} from '../../../../../src/modules/whatsapp-demo/channel/channel.service';
import { WhatsappChannelModel } from '../../../../../src/modules/whatsapp-demo/channel/channel.model';
import { AuditLogModel } from '../../../../../src/modules/audit';
import { runForOrganization } from '../../../../../src/lib/tenant';
import { open, seal } from '../../../../../src/utils/secretBox';
import { env } from '../../../../../src/config/env';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { codeOf } from '../../codeOf';
import { seedUser, useTestOrganization } from '../../../../helpers';

const organizationId = useTestOrganization();
const accessToken = randomBytes(24).toString('hex');
const appSecret = randomUUID();
const WEBHOOK_URL = `${env.apiPublicUrl}${WEBHOOK_PATH}`;

let ctx: GraphQLContext;

beforeEach(async () => {
  const user = await seedUser('owner@test.co', randomUUID(), [ROLES.ADMIN]);
  ctx = { user: { id: String(user._id), email: user.email, roles: [ROLES.ADMIN], organizationId } };
});

afterEach(() => jest.restoreAllMocks());

const input = (overrides: Partial<WhatsappChannelInput> = {}): WhatsappChannelInput => ({
  phoneNumberId: '1098765',
  displayPhone: '+91 98000 00001',
  accessToken,
  appSecret,
  verifyToken: 'verify-me-please',
  enabled: true,
  ...overrides,
});

describe('getChannel', () => {
  it('tells the admin where Meta has to point before anything is saved', async () => {
    await expect(getChannel()).resolves.toEqual({ webhookUrl: WEBHOOK_URL, channel: null });
  });

  it('presents a number stored before the optional fields existed with blanks', async () => {
    await WhatsappChannelModel.collection.insertOne({
      phoneNumberId: '1098765',
      accessToken: seal(accessToken),
      appSecret: seal(appSecret),
      verifyToken: 'verify-me-please',
      enabled: true,
      organizationId: new Types.ObjectId(organizationId),
    });

    const { channel } = await getChannel();

    expect(channel).toEqual(
      expect.objectContaining({ displayPhone: '', updatedAt: null, updatedByName: null }),
    );
    expect(channel?.accessTokenHint).toBe(accessToken.slice(-4));
  });
});

describe('saveChannel', () => {
  it('connects a number, sealing its credentials and showing only a hint', async () => {
    const saved = await saveChannel(ctx, input());

    expect(saved).toEqual({
      id: expect.any(String),
      phoneNumberId: '1098765',
      displayPhone: '+91 98000 00001',
      verifyToken: 'verify-me-please',
      enabled: true,
      hasAccessToken: true,
      accessTokenHint: accessToken.slice(-4),
      hasAppSecret: true,
      webhookUrl: WEBHOOK_URL,
      updatedAt: expect.any(String),
      updatedByName: 'owner',
    });
    const stored = await WhatsappChannelModel.findOne().lean();
    expect(stored?.accessToken).not.toContain(accessToken);
    expect(open(stored?.accessToken ?? '')).toBe(accessToken);
    expect(open(stored?.appSecret ?? '')).toBe(appSecret);
    expect((await getChannel()).channel?.id).toBe(saved.id);

    const audit = await AuditLogModel.findOne({ module: 'WhatsappChannel' }).lean();
    expect(audit).toEqual(
      expect.objectContaining({
        action: 'CREATE',
        entityId: saved.id,
        entityLabel: '+91 98000 00001',
        summary: 'Connected the WhatsApp number +91 98000 00001 (on)',
      }),
    );
  });

  it('keeps the stored secrets when the form leaves them blank', async () => {
    await saveChannel(ctx, input());

    const saved = await saveChannel(
      ctx,
      input({ accessToken: '', appSecret: '', displayPhone: '', enabled: false }),
    );

    const stored = await WhatsappChannelModel.find().lean();
    expect(stored).toHaveLength(1);
    expect(open(stored[0].accessToken)).toBe(accessToken);
    expect(open(stored[0].appSecret)).toBe(appSecret);
    expect(saved.enabled).toBe(false);
    const audit = await AuditLogModel.findOne({ action: 'UPDATE' }).lean();
    expect(audit?.entityLabel).toBe('1098765');
    expect(audit?.summary).toBe('Updated the WhatsApp number 1098765 (off)');
  });

  it('requires both credentials the first time', async () => {
    await expect(saveChannel(ctx, input({ accessToken: '' }))).rejects.toThrow(
      'An access token is required.',
    );
    await expect(saveChannel(ctx, input({ appSecret: ' ' }))).rejects.toThrow(
      'The app secret is required.',
    );
    expect(await WhatsappChannelModel.countDocuments()).toBe(0);
  });

  it('refuses settings that are not valid, naming each problem', async () => {
    const refused = saveChannel(ctx, input({ phoneNumberId: '12ab5', verifyToken: 'short' }));

    await expect(refused).rejects.toThrow(/The WhatsApp number settings are not valid/);
    await expect(saveChannel(ctx, input({ phoneNumberId: '12ab5' }))).rejects.toThrow(
      'phoneNumberId: Use the digits Meta shows as the Phone number ID.',
    );
    expect(await codeOf(saveChannel(ctx, input({ phoneNumberId: '123' })))).toBe('BAD_USER_INPUT');
  });

  it('refuses a number another company already connected', async () => {
    await runForOrganization(String(new Types.ObjectId()), () =>
      WhatsappChannelModel.create({ ...input(), accessToken: seal('a'), appSecret: seal('b') }),
    );

    await expect(saveChannel(ctx, input())).rejects.toThrow(
      'This Phone number ID is already connected to another company.',
    );
  });

  it('hides the hint of a token too short to show safely', async () => {
    const saved = await saveChannel(ctx, input({ accessToken: 'short-token' }));

    expect(saved.hasAccessToken).toBe(true);
    expect(saved.accessTokenHint).toBeNull();
  });

  it('reports the number missing when it vanished while saving', async () => {
    await saveChannel(ctx, input());
    jest
      .spyOn(WhatsappChannelModel, 'findByIdAndUpdate')
      .mockReturnValueOnce({ lean: () => Promise.resolve(null) } as never);

    expect(await codeOf(saveChannel(ctx, input()))).toBe('NOT_FOUND');
  });
});

describe('deleteChannel', () => {
  it('disconnects the number and records it', async () => {
    await saveChannel(ctx, input({ displayPhone: '' }));

    await expect(deleteChannel(ctx)).resolves.toBe(true);

    expect(await WhatsappChannelModel.countDocuments()).toBe(0);
    const audit = await AuditLogModel.findOne({ action: 'DELETE' }).lean();
    expect(audit?.summary).toBe('Disconnected the WhatsApp number 1098765');
  });

  it('says so when there is nothing to disconnect', async () => {
    expect(await codeOf(deleteChannel(ctx))).toBe('NOT_FOUND');
  });
});

describe('activeSender', () => {
  it('is the switched-on number, ready to send from', async () => {
    await saveChannel(ctx, input());

    await expect(activeSender()).resolves.toEqual({ phoneNumberId: '1098765', accessToken });
  });

  it('is nothing while the number is switched off or not connected', async () => {
    await expect(activeSender()).resolves.toBeNull();
    await saveChannel(ctx, input({ enabled: false }));
    await expect(activeSender()).resolves.toBeNull();
  });
});
