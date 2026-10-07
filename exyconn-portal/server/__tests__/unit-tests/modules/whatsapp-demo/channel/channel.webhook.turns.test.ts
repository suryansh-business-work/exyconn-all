import { createHmac, randomUUID } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { Types } from 'mongoose';
import { whatsappWebhookRouter } from '../../../../../src/modules/whatsapp-demo/channel/channel.webhook';
import { channelLookup } from '../../../../../src/modules/whatsapp-demo/channel/channel.lookup';
import { claimMessage } from '../../../../../src/modules/whatsapp-demo/channel/channel.chats';
import { converse } from '../../../../../src/modules/whatsapp-demo/channel/channel.conversation';
import { markRead } from '../../../../../src/modules/whatsapp-demo/channel/channel.graph';
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

/**
 * What happens to a delivered message after Meta has had its 200: a redelivery is dropped, a
 * failed read receipt does not stop the reply, and a failed turn is logged, never thrown.
 */
const PATH = '/webhooks/whatsapp';
const app = express().use(PATH, whatsappWebhookRouter());
const appSecret = randomUUID();
const sender = { phoneNumberId: '1098765', accessToken: randomUUID() };
const raw = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [
    {
      changes: [
        {
          field: 'messages',
          value: {
            metadata: { phone_number_id: '1098765' },
            messages: [{ id: 'wamid.1', from: '911', text: { body: 'hi' } }],
          },
        },
      ],
    },
  ],
});
const deliver = () =>
  request(app)
    .post(PATH)
    .set('Content-Type', 'application/json')
    .set(
      'X-Hub-Signature-256',
      `sha256=${createHmac('sha256', appSecret).update(raw).digest('hex')}`,
    )
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

beforeEach(() => {
  jest.mocked(channelLookup.forNumber).mockResolvedValue({
    organizationId: String(new Types.ObjectId()),
    appSecret,
    sender,
  });
  jest.mocked(claimMessage).mockResolvedValue(chatRecord({ waId: '911' }));
  jest.mocked(markRead).mockResolvedValue(undefined);
  jest.mocked(converse).mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('webhook turns', () => {
  it('drops a message that was already handled', async () => {
    jest.mocked(claimMessage).mockResolvedValue(null);

    expect((await deliver()).status).toBe(200);

    await eventually(() => expect(claimMessage).toHaveBeenCalled());
    expect(markRead).not.toHaveBeenCalled();
    expect(converse).not.toHaveBeenCalled();
  });

  it('replies even when the read receipt fails, and says why it failed', async () => {
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    jest.mocked(markRead).mockRejectedValue(new Error('token expired'));

    expect((await deliver()).status).toBe(200);

    await eventually(() => expect(warned).toHaveBeenCalled());
    expect(warned).toHaveBeenCalledWith({ err: 'token expired' }, 'WhatsApp read receipt failed');
    expect(converse).toHaveBeenCalled();
  });

  it('logs a read receipt refusal that is not an Error as it came', async () => {
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    jest.mocked(markRead).mockRejectedValue('offline');

    await deliver();

    await eventually(() => expect(warned).toHaveBeenCalled());
    expect(warned.mock.calls[0][0]).toEqual({ err: 'offline' });
  });

  it('logs a turn that fails, after Meta already has its answer', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.mocked(converse).mockRejectedValue(new Error('engine broke'));

    expect((await deliver()).status).toBe(200);

    await eventually(() => expect(logged).toHaveBeenCalled());
    expect(logged).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'WhatsApp message could not be handled',
    );
  });
});
