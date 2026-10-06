import { createHmac, timingSafeEqual } from 'node:crypto';
import express, { type Request, type Response, type Router } from 'express';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { slackNotifier } from '../../utils/slack';
import { UserModel } from '../admin/user.model';
import { ChatSessionModel, type ChatSite } from './models';
import type { ChatAttachment } from './chat.media';
import { markReadByStaff, postMessage } from './chat.messages';
import { asChatOwner } from './chat.owner';

/** Where Slack's Events API delivers the replies agents write in a chat's thread. */
export const SLACK_EVENTS_PATH = '/slack/events';

/** Slack signs every request; one older than this is a replay. */
const MAX_REQUEST_AGE_SEC = 5 * 60;
/** Slack retries an event it thinks was missed; each is handled once. */
const SEEN_TTL_MS = 10 * 60 * 1000;
const seenEvents = new Map<string, number>();

const SITE_LABEL: Readonly<Record<ChatSite, string>> = {
  WEBSITE: 'exyconn.com',
  TOOLS: 'tools.exyconn.com',
};

/** Slack reads &, < and > as markup; a visitor's text is shown as typed. */
const escapeSlack = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** A Slack message as plain text: links as "label (url)", mentions and entities undone. */
function slackToText(text: string): string {
  return text
    .replaceAll(/<(https?:[^|>]+)\|([^>]+)>/g, '$2 ($1)')
    .replaceAll(/<(https?:[^>]+)>/g, '$1')
    .replaceAll(/<@[A-Z\d]+>/g, '@someone')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .trim();
}

interface SlackSession {
  _id: unknown;
  name: string;
  email: string;
  site: ChatSite;
  ticketReference: string;
  slackChannel: string;
  slackThreadTs: string;
}

/**
 * Opens the assigned agent's Slack thread for a new chat: a direct message from the app with
 * who is asking, the ticket and a link to the conversation. Everything the visitor writes
 * afterwards lands in that thread, and the agent's replies there reach the visitor.
 */
export async function notifyAgentOnSlack(
  session: SlackSession,
  agent: { name: string; email: string },
): Promise<void> {
  const member = await slackNotifier.memberByEmail(agent.email);
  if (!member) {
    logger.warn(`Website chat: no Slack member for ${agent.name}, so no Slack thread was opened`);
    return;
  }
  const link = `${env.websiteChatConsoleUrl}/${String(session._id)}`;
  const text = [
    `:speech_balloon: New website chat from *${escapeSlack(session.name)}* (${escapeSlack(session.email)}) on ${SITE_LABEL[session.site]}.`,
    `Ticket ${session.ticketReference} · <${link}|Open the conversation>`,
    'Reply in this thread to answer them in the chat.',
  ].join('\n');
  const post = await slackNotifier.post(member.id, text);
  await ChatSessionModel.updateOne(
    { _id: session._id },
    { slackChannel: post.channel, slackThreadTs: post.ts },
  );
}

/** Mirrors a live-thread message into the chat's Slack thread, if it has one. Never throws. */
export function relayToSlack(
  session: Pick<SlackSession, 'slackChannel' | 'slackThreadTs'>,
  who: string,
  body: string,
  attachments: readonly ChatAttachment[] = [],
): void {
  if (!session.slackThreadTs) {
    return;
  }
  const files = attachments.map((file) => `<${file.url}|${file.kind.toLowerCase()}>`).join(' ');
  const text = `*${escapeSlack(who)}:* ${escapeSlack(body)} ${files}`.trim();
  slackNotifier
    .post(session.slackChannel, text, session.slackThreadTs)
    .catch((error: unknown) => logger.error({ err: error }, 'Website chat Slack relay failed'));
}

/** Whether the request carries Slack's signature for its exact body, made recently. */
function signedBySlack(req: Request, raw: string, secret: string): boolean {
  const timestamp = Number(req.header('x-slack-request-timestamp'));
  const signature = req.header('x-slack-signature') ?? '';
  if (
    !Number.isFinite(timestamp) ||
    Math.abs(Date.now() / 1000 - timestamp) > MAX_REQUEST_AGE_SEC
  ) {
    return false;
  }
  const expected = `v0=${createHmac('sha256', secret).update(`v0:${timestamp}:${raw}`).digest('hex')}`;
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

/** True the first time an event id is seen in the last few minutes. */
function firstSighting(eventId: string): boolean {
  const now = Date.now();
  for (const [id, at] of seenEvents) {
    if (now - at > SEEN_TTL_MS) {
      seenEvents.delete(id);
    }
  }
  if (seenEvents.has(eventId)) {
    return false;
  }
  seenEvents.set(eventId, now);
  return true;
}

interface SlackMessageEvent {
  type: string;
  subtype?: string;
  bot_id?: string;
  user?: string;
  text?: string;
  channel?: string;
  ts?: string;
  thread_ts?: string;
}

/** The portal user behind a Slack member (same email, in the chat's company), or their Slack name. */
async function agentFor(slackUserId: string): Promise<{ id: string; name: string }> {
  const member = await slackNotifier.member(slackUserId);
  const user = member?.email
    ? await UserModel.findOne({ email: member.email.toLowerCase() }).select('name').lean()
    : null;
  return { id: user ? String(user._id) : '', name: user?.name ?? member?.name ?? 'Exyconn' };
}

/** A person's reply in a chat's Slack thread, posted to the visitor as an agent message. */
async function relayReply(event: SlackMessageEvent): Promise<void> {
  const isThreadReply = event.thread_ts && event.thread_ts !== event.ts;
  if (event.type !== 'message' || event.subtype || event.bot_id || !isThreadReply || !event.user) {
    return;
  }
  await asChatOwner(async () => {
    const session = await ChatSessionModel.findOne({
      slackThreadTs: event.thread_ts,
      slackChannel: event.channel,
    }).lean();
    if (!session) {
      return;
    }
    if (session.status !== 'OPEN') {
      await slackNotifier.post(session.slackChannel, 'This chat has ended.', session.slackThreadTs);
      return;
    }
    const agent = await agentFor(event.user ?? '');
    const sessionId = String(session._id);
    await postMessage({
      sessionId,
      channel: 'LIVE',
      sender: 'AGENT',
      senderName: agent.name,
      senderId: agent.id,
      body: slackToText(event.text ?? ''),
    });
    await markReadByStaff(sessionId);
  });
}

async function receive(req: Request, res: Response): Promise<void> {
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  const secret = await slackNotifier.signingSecret();
  if (!secret || !signedBySlack(req, raw, secret)) {
    res.status(401).end();
    return;
  }
  const payload = JSON.parse(raw) as {
    type?: string;
    challenge?: string;
    event_id?: string;
    event?: SlackMessageEvent;
  };
  if (payload.type === 'url_verification') {
    res.json({ challenge: payload.challenge });
    return;
  }
  // Slack wants an answer within three seconds; the reply is relayed after it.
  res.status(200).end();
  if (payload.type === 'event_callback' && payload.event && firstSighting(payload.event_id ?? '')) {
    relayReply(payload.event).catch((error: unknown) =>
      logger.error({ err: error }, 'Website chat Slack reply failed'),
    );
  }
}

/**
 * Slack's Events API: agents' replies in website chat threads. Public by necessity (Slack
 * calls it), so every request must carry Slack's signature for the stored signing secret.
 */
export function slackEventsRouter(): Router {
  const router = express.Router();
  router.post('/', express.raw({ type: 'application/json', limit: '1mb' }), (req, res) => {
    receive(req, res).catch((error: unknown) => {
      logger.error({ err: error }, 'Slack event could not be read');
      if (!res.headersSent) {
        res.status(400).end();
      }
    });
  });
  return router;
}
