import { notifyAgentOnSlack, relayToSlack } from '../../../../src/modules/website-chat/chat.slack';
import { ChatSessionModel } from '../../../../src/modules/website-chat/models';
import { slackNotifier } from '../../../../src/utils/slack';
import { env } from '../../../../src/config/env';
import { logger } from '../../../../src/utils/logger';
import { createSession, until } from './chat.fixtures';

jest.mock('../../../../src/utils/slack', () => ({
  slackNotifier: { memberByEmail: jest.fn(), post: jest.fn() },
}));

const memberByEmail = slackNotifier.memberByEmail as jest.Mock;
const post = slackNotifier.post as jest.Mock;
const agent = { name: 'Sam', email: 'sam@exyconn.test' };

beforeEach(() => {
  post.mockResolvedValue({ channel: 'D123', ts: '1700000000.0001' });
});
afterEach(() => jest.restoreAllMocks());

describe('notifyAgentOnSlack', () => {
  it("opens a thread in the agent's DMs and remembers it on the chat", async () => {
    memberByEmail.mockResolvedValue({ id: 'U1', name: 'Sam', email: agent.email });
    const session = await createSession({
      name: 'Dana <b>&</b>',
      site: 'TOOLS',
      ticketReference: 'TCK-5',
    });

    await notifyAgentOnSlack(session, agent);

    expect(memberByEmail).toHaveBeenCalledWith('sam@exyconn.test');
    expect(post).toHaveBeenCalledWith(
      'U1',
      [
        ':speech_balloon: New website chat from *Dana &lt;b&gt;&amp;&lt;/b&gt;* (dana@acme.test) on tools.exyconn.com.',
        `Ticket TCK-5 · <${env.websiteChatConsoleUrl}/${String(session._id)}|Open the conversation>`,
        'Reply in this thread to answer them in the chat.',
      ].join('\n'),
    );
    expect(await ChatSessionModel.findById(session._id).lean()).toMatchObject({
      slackChannel: 'D123',
      slackThreadTs: '1700000000.0001',
    });
  });

  it('says so and opens nothing when the agent is not on Slack', async () => {
    memberByEmail.mockResolvedValue(null);
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const session = await createSession();
    await notifyAgentOnSlack(session, agent);
    expect(post).not.toHaveBeenCalled();
    expect(warned).toHaveBeenCalledWith(
      'Website chat: no Slack member for Sam, so no Slack thread was opened',
    );
    expect((await ChatSessionModel.findById(session._id).lean())?.slackThreadTs).toBe('');
  });
});

describe('relayToSlack', () => {
  const thread = { slackChannel: 'D123', slackThreadTs: '1700000000.0001' };

  it('does nothing for a chat with no Slack thread', () => {
    relayToSlack({ slackChannel: '', slackThreadTs: '' }, 'Dana', 'Hello');
    expect(post).not.toHaveBeenCalled();
  });

  it('posts the line into the thread, escaped, with links to its files', () => {
    relayToSlack(thread, 'Dana', 'a < b & c', [
      { url: 'https://ik.test/p.png', name: 'p.png', kind: 'IMAGE', size: 3 },
      { url: 'https://ik.test/v.webm', name: 'v.webm', kind: 'AUDIO', size: 3 },
    ]);
    expect(post).toHaveBeenCalledWith(
      'D123',
      '*Dana:* a &lt; b &amp; c <https://ik.test/p.png|image> <https://ik.test/v.webm|audio>',
      '1700000000.0001',
    );
  });

  it('trims the line when there are no files, and logs a failed post', async () => {
    post.mockRejectedValueOnce(new Error('Slack down'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    relayToSlack(thread, 'Sam (portal)', 'Hi');
    expect(post).toHaveBeenCalledWith('D123', '*Sam (portal):* Hi', '1700000000.0001');
    await until(() => logged.mock.calls.length > 0);
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Website chat Slack relay failed',
    );
  });
});
