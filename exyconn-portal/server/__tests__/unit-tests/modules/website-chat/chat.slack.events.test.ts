import { createHmac, randomUUID } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import {
  SLACK_EVENTS_PATH,
  slackEventsRouter,
} from '../../../../src/modules/website-chat/chat.slack';
import { ChatMessageModel } from '../../../../src/modules/website-chat/models';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { slackNotifier } from '../../../../src/utils/slack';
import { logger } from '../../../../src/utils/logger';
import { createSession, until, useChatOperator } from './chat.fixtures';

jest.mock('../../../../src/utils/slack', () => ({
  slackNotifier: { post: jest.fn(), member: jest.fn(), signingSecret: jest.fn() },
}));

useChatOperator();

const notifier = slackNotifier as unknown as Record<'post' | 'member' | 'signingSecret', jest.Mock>;
const secret = randomUUID();
const app = express().use(SLACK_EVENTS_PATH, slackEventsRouter());
const THREAD = '1700000000.0001';

const sign = (raw: string, at = Math.floor(Date.now() / 1000)) => {
  const base = `v0:${at}:${raw}`;
  return {
    timestamp: String(at),
    signature: `v0=${createHmac('sha256', secret).update(base).digest('hex')}`,
  };
};

function deliver(payload: unknown, at?: number) {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const { timestamp, signature } = sign(raw, at);
  return request(app)
    .post(SLACK_EVENTS_PATH)
    .set('content-type', 'application/json')
    .set('x-slack-request-timestamp', timestamp)
    .set('x-slack-signature', signature)
    .send(raw);
}

const reply = (fields: Record<string, unknown> = {}) => ({
  type: 'event_callback',
  event_id: randomUUID(),
  event: {
    type: 'message',
    user: 'U1',
    text: 'See <https://exyconn.com/pricing|our pricing> &amp; <https://exyconn.com> <@U2B3> &lt;3',
    channel: 'D123',
    ts: '1700000000.0009',
    thread_ts: THREAD,
    ...fields,
  },
});

const agentLines = () => ChatMessageModel.find({ sender: 'AGENT' }).lean();

beforeEach(() => {
  notifier.signingSecret.mockResolvedValue(secret);
  notifier.post.mockResolvedValue({ channel: 'D123', ts: '1' });
  notifier.member.mockResolvedValue({ id: 'U1', name: 'Sam on Slack', email: 'SAM@exyconn.test' });
});
afterEach(() => jest.restoreAllMocks());

describe('Slack events', () => {
  it('answers the URL verification challenge', async () => {
    const res = await deliver({ type: 'url_verification', challenge: 'abc' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ challenge: 'abc' });
  });

  it('refuses requests without a signing secret, a valid signature or a recent timestamp', async () => {
    const raw = JSON.stringify({ type: 'url_verification', challenge: 'abc' });
    notifier.signingSecret.mockResolvedValueOnce('');
    expect((await deliver(raw)).status).toBe(401);
    expect((await deliver(raw, Math.floor(Date.now() / 1000) - 301)).status).toBe(401);
    const forged = await request(app)
      .post(SLACK_EVENTS_PATH)
      .set('content-type', 'application/json')
      .set('x-slack-request-timestamp', String(Math.floor(Date.now() / 1000)))
      .set('x-slack-signature', 'v0=forged')
      .send(raw);
    expect(forged.status).toBe(401);
    const undated = await request(app)
      .post(SLACK_EVENTS_PATH)
      .set('content-type', 'application/json')
      .set('x-slack-request-timestamp', 'yesterday')
      .send(raw);
    expect(undated.status).toBe(401);
  });

  it('answers 400 for a signed body that is not JSON', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    expect((await deliver('not json')).status).toBe(400);
    const { timestamp, signature } = sign('');
    const plain = await request(app)
      .post(SLACK_EVENTS_PATH)
      .set('content-type', 'text/plain')
      .set('x-slack-request-timestamp', timestamp)
      .set('x-slack-signature', signature)
      .send('ignored');
    expect(plain.status).toBe(400);
  });

  it("posts a thread reply to the visitor as the agent's message, once", async () => {
    await UserModel.create({
      name: 'Sam Portal',
      email: 'sam@exyconn.test',
      passwordHash: randomUUID(),
      roles: ['WEBSITE'],
    });
    const session = await createSession({
      slackChannel: 'D123',
      slackThreadTs: THREAD,
      staffUnread: 2,
    });
    const event = reply();

    expect((await deliver(event)).status).toBe(200);
    expect((await deliver(event)).status).toBe(200);
    await until(async () => (await agentLines()).length > 0);

    const lines = await agentLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      sessionId: session._id.toHexString(),
      channel: 'LIVE',
      senderName: 'Sam Portal',
      body: 'See our pricing (https://exyconn.com/pricing) & https://exyconn.com @someone <3',
    });
    expect(lines[0].senderId).toMatch(/^[a-f\d]{24}$/);
  });

  it("names the agent by their Slack name, or the company's, when no portal user matches", async () => {
    await createSession({ slackChannel: 'D123', slackThreadTs: THREAD });
    notifier.member.mockResolvedValueOnce({ id: 'U1', name: 'Sam on Slack', email: '' });
    await deliver(reply({ text: 'first' }));
    await until(async () => (await agentLines()).length === 1);
    notifier.member.mockResolvedValueOnce(null);
    await deliver(reply({ text: undefined }));
    await until(async () => (await agentLines()).length === 2);
    const lines = await ChatMessageModel.find({ sender: 'AGENT' }).sort({ createdAt: 1 }).lean();
    expect(lines.map((line) => [line.senderName, line.senderId, line.body])).toEqual([
      ['Sam on Slack', '', 'first'],
      ['Exyconn', '', ''],
    ]);
  });

  it('tells the thread when the chat has ended', async () => {
    await createSession({ slackChannel: 'D123', slackThreadTs: THREAD, status: 'CLOSED' });
    // An event without an id is still handled the first time.
    await deliver({ ...reply(), event_id: undefined });
    await until(() => notifier.post.mock.calls.length > 0);
    expect(notifier.post).toHaveBeenCalledWith('D123', 'This chat has ended.', THREAD);
    expect(await agentLines()).toHaveLength(0);
  });

  it.each([
    ['a bot', { bot_id: 'B1' }],
    ['an edit', { subtype: 'message_changed' }],
    ['a top-level message', { thread_ts: undefined }],
    ['the thread starter', { ts: THREAD }],
    ['an unknown author', { user: undefined }],
    ['another event type', { type: 'reaction_added' }],
    ['a thread no chat follows', { thread_ts: '1.2' }],
  ])('ignores %s', async (_case, fields) => {
    await createSession({ slackChannel: 'D123', slackThreadTs: THREAD });
    expect((await deliver(reply(fields))).status).toBe(200);
    await deliver({ type: 'event_callback', event_id: randomUUID() });
    await deliver({ type: 'app_rate_limited', event: reply().event });
    await new Promise((resolve) => setImmediate(resolve));
    expect(notifier.member).not.toHaveBeenCalled();
    expect(await agentLines()).toHaveLength(0);
  });

  it('logs a reply that could not be relayed', async () => {
    await createSession({ slackChannel: 'D123', slackThreadTs: THREAD });
    notifier.member.mockRejectedValueOnce(new Error('Slack down'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    await deliver(reply());
    await until(() => logged.mock.calls.length > 0);
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Website chat Slack reply failed',
    );
  });

  it('forgets an event id after ten minutes', async () => {
    await createSession({ slackChannel: 'D123', slackThreadTs: THREAD });
    const event = reply();
    await deliver(event);
    await until(async () => (await agentLines()).length === 1);
    const later = Date.now() + 11 * 60_000;
    jest.spyOn(Date, 'now').mockReturnValue(later);
    await deliver(event, Math.floor(later / 1000));
    await until(async () => (await agentLines()).length === 2);
    expect(await agentLines()).toHaveLength(2);
  });
});
