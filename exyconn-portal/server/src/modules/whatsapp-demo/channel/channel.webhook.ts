import express, { Router, type Request, type Response } from 'express';
import { channelLookup, type ChannelMatch } from './channel.lookup';
import { inboundMessages, type InboundMessage } from './channel.inbound';
import { markRead, validSignature } from './channel.graph';
import { claimMessage } from './channel.chats';
import { converse } from './channel.conversation';
import { inTurn } from './channel.queue';
import { runForOrganization } from '../../../lib/tenant';
import { logger } from '../../../utils/logger';

/**
 * Where Meta delivers WhatsApp messages for every company's number (Meta App > WhatsApp >
 * Configuration > Webhook, subscribed to `messages`). Public by necessity; what makes a
 * delivery trustworthy is its `X-Hub-Signature-256`, checked against the app secret of the
 * company whose number it names, over the exact bytes received.
 *
 * Meta wants a 200 within seconds and redelivers otherwise, so the answer goes out first and
 * the turns run after it; a redelivery is spotted by message id (channel.chats).
 */
const BODY_LIMIT = '1mb';

function verify(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode !== 'subscribe' || typeof token !== 'string' || typeof challenge !== 'string') {
    res.sendStatus(400);
    return;
  }
  channelLookup
    .knowsVerifyToken(token)
    .then((known) => {
      if (known) {
        res.type('text/plain').send(challenge);
      } else {
        res.sendStatus(403);
      }
    })
    .catch((error: unknown) => {
      logger.error({ err: error }, 'WhatsApp webhook verification failed');
      res.sendStatus(500);
    });
}

async function handle(channel: ChannelMatch, message: InboundMessage): Promise<void> {
  await runForOrganization(channel.organizationId, async () => {
    const chat = await claimMessage(message.waId, message.name, message.messageId);
    if (!chat) {
      return;
    }
    markRead(channel.sender, message.messageId).catch((error: unknown) =>
      logger.warn(
        { err: error instanceof Error ? error.message : error },
        'WhatsApp read receipt failed',
      ),
    );
    await converse(chat, message.input, channel.sender);
  });
}

async function receive(raw: Buffer, signature: string | undefined): Promise<number> {
  let body: unknown;
  try {
    body = JSON.parse(raw.toString('utf8'));
  } catch {
    return 400;
  }
  const messages = inboundMessages(body);
  const channel =
    messages.length > 0 ? await channelLookup.forNumber(messages[0].phoneNumberId) : null;
  if (!channel) {
    // Status updates, or a number no company has switched on: nothing to do, nothing to retry.
    return 200;
  }
  if (!validSignature(raw, signature, channel.appSecret)) {
    return 401;
  }
  for (const message of messages.filter((m) => m.phoneNumberId === channel.sender.phoneNumberId)) {
    inTurn(`${channel.organizationId}:${message.waId}`, () => handle(channel, message)).catch(
      (error: unknown) => logger.error({ err: error }, 'WhatsApp message could not be handled'),
    );
  }
  return 200;
}

export function whatsappWebhookRouter(): Router {
  const router = Router();
  router.get('/', verify);
  router.post('/', express.raw({ type: 'application/json', limit: BODY_LIMIT }), (req, res) => {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    receive(raw, req.get('x-hub-signature-256'))
      .then((status) => res.sendStatus(status))
      .catch((error: unknown) => {
        logger.error({ err: error }, 'WhatsApp webhook delivery failed');
        res.sendStatus(500);
      });
  });
  return router;
}
