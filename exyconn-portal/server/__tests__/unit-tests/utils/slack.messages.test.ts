import { ConfigurationError } from '../../../src/utils/errors';
import { slackNotifier } from '../../../src/utils/slack';
import { active, config, failed, ok, sentCall, stubSlack } from './slack.fixtures';

let fetchMock: jest.SpyInstance;
const call = (index = 0) => sentCall(fetchMock, index);

beforeEach(() => {
  fetchMock = stubSlack();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('sendMessage', () => {
  it('posts to the default channel with the bot token', async () => {
    active(config);
    fetchMock.mockResolvedValue(ok());
    await slackNotifier.sendMessage('Deploy finished');
    expect(call()).toEqual({
      method: 'chat.postMessage',
      body: { channel: '#general', text: 'Deploy finished' },
    });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      Authorization: `Bearer ${config.botToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    });
  });

  it('posts to an explicit channel when given one', async () => {
    active(config);
    fetchMock.mockResolvedValue(ok());
    await slackNotifier.sendMessage('Hi', '#ops');
    expect(call().body.channel).toBe('#ops');
  });

  it('refuses when no Slack configuration is active', async () => {
    active(null);
    await expect(slackNotifier.sendMessage('Hi')).rejects.toBeInstanceOf(ConfigurationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces the Slack error, or says it is unknown', async () => {
    active(config);
    fetchMock.mockResolvedValueOnce(failed('channel_not_found'));
    await expect(slackNotifier.sendMessage('Hi')).rejects.toThrow(
      'Slack chat.postMessage failed: channel_not_found',
    );
    fetchMock.mockResolvedValueOnce(failed());
    await expect(slackNotifier.sendMessage('Hi')).rejects.toThrow(
      'Slack chat.postMessage failed: unknown error',
    );
  });
});

describe('post', () => {
  it('says where the message landed', async () => {
    active(config);
    fetchMock.mockResolvedValue(ok({ channel: 'C1', ts: '171.1' }));
    await expect(slackNotifier.post('C1', 'Hello')).resolves.toEqual({
      channel: 'C1',
      ts: '171.1',
    });
    expect(call().body).toEqual({ channel: 'C1', text: 'Hello' });
  });

  it('replies in a thread when given its timestamp', async () => {
    active(config);
    fetchMock.mockResolvedValue(ok({ channel: 'C1', ts: '171.2' }));
    await slackNotifier.post('C1', 'Reply', '171.1');
    expect(call().body).toEqual({ channel: 'C1', text: 'Reply', thread_ts: '171.1' });
  });
});

describe('sendTestMessage', () => {
  it('checks the token, then posts through the given configuration', async () => {
    const findOne = active(null);
    fetchMock.mockResolvedValueOnce(ok()).mockResolvedValueOnce(ok());
    await slackNotifier.sendTestMessage(config, '#tests');
    expect(findOne).not.toHaveBeenCalled();
    expect(call(0)).toEqual({ method: 'auth.test', body: {} });
    expect(call(1).method).toBe('chat.postMessage');
    expect(call(1).body.channel).toBe('#tests');
    expect(String(call(1).body.text)).toContain('"Workspace bot"');
  });

  it('stops when the token is refused', async () => {
    fetchMock.mockResolvedValueOnce(failed('invalid_auth'));
    await expect(slackNotifier.sendTestMessage(config, '#tests')).rejects.toThrow(
      'Slack auth.test failed: invalid_auth',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
