import { createHmac, randomUUID } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { Types } from 'mongoose';
import { whatsappWebhookRouter } from '../../../../../../../demos/whatsapp-demo/server/src/channel/channel.webhook';
import { channelLookup } from '../../../../../../../demos/whatsapp-demo/server/src/channel/channel.lookup';
import { claimMessage } from '../../../../../../../demos/whatsapp-demo/server/src/channel/channel.chats';
import { converse } from '../../../../../../../demos/whatsapp-demo/server/src/channel/channel.conversation';
import { markRead } from '../../../../../../../demos/whatsapp-demo/server/src/channel/channel.graph';
import { ensureChatTicket } from '../../../../../../../demos/whatsapp-demo/server/src/channel/channel.ticket';
import { logger } from '../../../../../src/utils/logger';
import { chatRecord } from './channel.fixtures';

jest.mock('../../../../../../../demos/whatsapp-demo/server/src/channel/channel.lookup', () => ({
  channelLookup: { forNumber: jest.fn(), knowsVerifyToken: jest.fn() },
}));
jest.mock('../../../../../../../demos/whatsapp-demo/server/src/channel/channel.chats', () => ({
  claimMessage: jest.fn(),
}));
jest.mock(
  '../../../../../../../demos/whatsapp-demo/server/src/channel/channel.conversation',
  () => ({
    converse: jest.fn(),
  }),
);
jest.mock('../../../../../../../demos/whatsapp-demo/server/src/channel/channel.ticket', () => ({
  ensureChatTicket: jest.fn(),
}));
jest.mock('../../../../../../../demos/whatsapp-demo/server/src/channel/channel.graph', () => ({
  ...jest.requireActual(
    '../../../../../../../demos/whatsapp-demo/server/src/channel/channel.graph',
  ),
  markRead: jest.fn(),
}));

/** After the reply, the chat is filed in the support queue; that step never fails the turn. */
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
    organizationId: new Types.ObjectId().toHexString(),
    appSecret,
    sender,
    enabled: true,
  });
  jest.mocked(claimMessage).mockResolvedValue(chatRecord({ waId: '911' }));
  jest.mocked(markRead).mockResolvedValue(undefined);
  jest.mocked(converse).mockResolvedValue(undefined);
  jest.mocked(ensureChatTicket).mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('filing the chat as a support ticket', () => {
  it('files the chat after the reply has gone', async () => {
    const order: string[] = [];
    jest.mocked(converse).mockImplementation(async () => {
      order.push('reply');
    });
    jest.mocked(ensureChatTicket).mockImplementation(async () => {
      order.push('ticket');
    });

    expect((await deliver()).status).toBe(200);

    await eventually(() => expect(ensureChatTicket).toHaveBeenCalled());
    expect(jest.mocked(ensureChatTicket).mock.calls[0][0]).toMatchObject({ waId: '911' });
    expect(order).toEqual(['reply', 'ticket']);
  });

  it('logs a ticket that cannot be filed and does not report the turn as failed', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.mocked(ensureChatTicket).mockRejectedValue(new Error('desk away'));

    await deliver();

    await eventually(() => expect(logged).toHaveBeenCalled());
    expect(logged).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'WhatsApp chat could not be filed as a support ticket',
    );
    expect(logged).not.toHaveBeenCalledWith(
      expect.anything(),
      'WhatsApp message could not be handled',
    );
  });

  it('files nothing when the reply itself failed', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.mocked(converse).mockRejectedValue(new Error('engine broke'));

    await deliver();

    await eventually(() => expect(logger.error).toHaveBeenCalled());
    expect(ensureChatTicket).not.toHaveBeenCalled();
  });
});
