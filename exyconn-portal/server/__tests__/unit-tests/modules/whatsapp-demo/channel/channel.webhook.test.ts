import { createHmac, randomUUID } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { Types } from 'mongoose';
import { whatsappWebhookRouter } from '../../../../../src/modules/whatsapp-demo/channel/channel.webhook';
import { channelLookup } from '../../../../../src/modules/whatsapp-demo/channel/channel.lookup';
import { claimMessage } from '../../../../../src/modules/whatsapp-demo/channel/channel.chats';
import { converse } from '../../../../../src/modules/whatsapp-demo/channel/channel.conversation';
import { markRead } from '../../../../../src/modules/whatsapp-demo/channel/channel.graph';
import { currentOrganizationId } from '../../../../../src/lib/tenant';
import { logger } from '../../../../../src/utils/logger';
import { chatRecord } from './channel.fixtures';

jest.mock('../../../../../src/modules/whatsapp-demo/channel/channel.lookup', () => ({
  channelLookup: { forNumber: jest.fn(), knowsVerifyToken: jest.fn() },
}));
jest.mock('../../../../../src/modules/whatsapp-demo/channel/channel.chats', () => ({
  claimMessage: jest.fn(),
}));
jest.mock('../../../../../src/modules/whatsapp-demo/channel/channel.conversation', () => ({
  converse: jest.fn(),
}));
jest.mock('../../../../../src/modules/whatsapp-demo/channel/channel.graph', () => ({
  ...jest.requireActual('../../../../../src/modules/whatsapp-demo/channel/channel.graph'),
  markRead: jest.fn(),
}));

const PATH = '/webhooks/whatsapp';
const app = express().use(PATH, whatsappWebhookRouter());
const organizationId = new Types.ObjectId().toHexString();
const appSecret = randomUUID();
const sender = { phoneNumberId: '1098765', accessToken: randomUUID() };
const chat = chatRecord();

const body = (...phoneIds: string[]) =>
  JSON.stringify({
    object: 'whatsapp_business_account',
    entry: phoneIds.map((id, i) => ({
      changes: [
        {
          field: 'messages',
          value: {
            metadata: { phone_number_id: id },
            contacts: [{ wa_id: '911', profile: { name: 'Asha' } }],
            messages: [{ id: `wamid.${i}`, from: '911', text: { body: 'hello' } }],
          },
        },
      ],
    })),
  });
const sign = (raw: string, secret = appSecret) =>
  `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`;
const post = (raw: string, signature = sign(raw)) =>
  request(app)
    .post(PATH)
    .set('Content-Type', 'application/json')
    .set('X-Hub-Signature-256', signature)
    .send(raw);

async function eventually(check: () => void): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      check();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  check();
}

let scopeSeen: string | null = null;

beforeEach(() => {
  scopeSeen = null;
  jest.mocked(channelLookup.forNumber).mockResolvedValue({ organizationId, appSecret, sender });
  jest.mocked(claimMessage).mockImplementation(async () => {
    scopeSeen = currentOrganizationId();
    return chat;
  });
  jest.mocked(markRead).mockResolvedValue(undefined);
  jest.mocked(converse).mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('GET: Meta verification handshake', () => {
  const verify = (query: Record<string, string>) => request(app).get(PATH).query(query);

  it('echoes the challenge for a token a company registered', async () => {
    jest.mocked(channelLookup.knowsVerifyToken).mockResolvedValue(true);

    const res = await verify({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'verify-me',
      'hub.challenge': '1158201444',
    });

    expect(res.status).toBe(200);
    expect(res.text).toBe('1158201444');
    expect(channelLookup.knowsVerifyToken).toHaveBeenCalledWith('verify-me');
  });

  it('refuses a token nobody registered', async () => {
    jest.mocked(channelLookup.knowsVerifyToken).mockResolvedValue(false);
    const query = { 'hub.mode': 'subscribe', 'hub.verify_token': 'x', 'hub.challenge': '1' };

    expect((await verify(query)).status).toBe(403);
  });

  it('refuses a request that is not a subscription handshake', async () => {
    expect((await verify({ 'hub.mode': 'unsubscribe', 'hub.verify_token': 'x' })).status).toBe(400);
    expect((await verify({ 'hub.mode': 'subscribe', 'hub.challenge': '1' })).status).toBe(400);
    expect((await verify({ 'hub.mode': 'subscribe', 'hub.verify_token': 'x' })).status).toBe(400);
    expect(channelLookup.knowsVerifyToken).not.toHaveBeenCalled();
  });

  it('answers 500 and logs when the lookup fails', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.mocked(channelLookup.knowsVerifyToken).mockRejectedValue(new Error('db down'));
    const query = { 'hub.mode': 'subscribe', 'hub.verify_token': 'x', 'hub.challenge': '1' };

    expect((await verify(query)).status).toBe(500);
    expect(logged).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'WhatsApp webhook verification failed',
    );
  });
});

describe('POST: message deliveries', () => {
  it('answers at once, then plays the message in the company of the number', async () => {
    const raw = body('1098765');

    expect((await post(raw)).status).toBe(200);

    await eventually(() => expect(converse).toHaveBeenCalled());
    expect(channelLookup.forNumber).toHaveBeenCalledWith('1098765');
    expect(claimMessage).toHaveBeenCalledWith('911', 'Asha', 'wamid.0');
    expect(scopeSeen).toBe(organizationId);
    expect(markRead).toHaveBeenCalledWith(sender, 'wamid.0');
    expect(converse).toHaveBeenCalledWith(chat, { kind: 'text', text: 'hello' }, sender);
  });

  it('plays only the messages for the number the delivery was signed for', async () => {
    expect((await post(body('1098765', '5555555'))).status).toBe(200);

    await eventually(() => expect(converse).toHaveBeenCalled());
    expect(claimMessage).toHaveBeenCalledTimes(1);
  });

  it('refuses a delivery whose signature does not match the app secret', async () => {
    const raw = body('1098765');

    expect((await post(raw, sign(raw, randomUUID()))).status).toBe(401);
    expect((await post(raw, '')).status).toBe(401);
    expect(claimMessage).not.toHaveBeenCalled();
  });

  it('acknowledges status updates and unknown numbers without doing anything', async () => {
    const status = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
    expect((await post(status)).status).toBe(200);
    expect(channelLookup.forNumber).not.toHaveBeenCalled();

    jest.mocked(channelLookup.forNumber).mockResolvedValue(null);
    expect((await post(body('5555555'))).status).toBe(200);
    expect(claimMessage).not.toHaveBeenCalled();
  });

  it('refuses a body that is not JSON', async () => {
    expect((await post('not json')).status).toBe(400);
    const plain = await request(app).post(PATH).set('Content-Type', 'text/plain').send('hello');
    expect(plain.status).toBe(400);
  });

  it('answers 500 when the delivery cannot be read', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.mocked(channelLookup.forNumber).mockRejectedValue(new Error('db down'));

    expect((await post(body('1098765'))).status).toBe(500);
    expect(logged).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'WhatsApp webhook delivery failed',
    );
  });
});
