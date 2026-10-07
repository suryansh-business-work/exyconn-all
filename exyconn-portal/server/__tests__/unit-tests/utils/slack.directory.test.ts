import { logger } from '../../../src/utils/logger';
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

describe('members', () => {
  it('finds a member by email, preferring the profile name', async () => {
    active(config);
    fetchMock.mockResolvedValue(
      ok({
        user: { id: 'U1', real_name: 'Old', profile: { real_name: 'Asha Rao', email: 'a@x.co' } },
      }),
    );
    await expect(slackNotifier.memberByEmail('a@x.co')).resolves.toEqual({
      id: 'U1',
      name: 'Asha Rao',
      email: 'a@x.co',
    });
    expect(call()).toEqual({ method: 'users.lookupByEmail', body: { email: 'a@x.co' } });
  });

  it('falls back to the account name, then the id, and to an empty email', async () => {
    active(config);
    fetchMock.mockResolvedValueOnce(ok({ user: { id: 'U2', real_name: 'Ravi', profile: {} } }));
    await expect(slackNotifier.member('U2')).resolves.toEqual({
      id: 'U2',
      name: 'Ravi',
      email: '',
    });
    fetchMock.mockResolvedValueOnce(ok({ user: { id: 'U3' } }));
    await expect(slackNotifier.member('U3')).resolves.toEqual({ id: 'U3', name: 'U3', email: '' });
    expect(call(0)).toEqual({ method: 'users.info', body: { user: 'U2' } });
  });

  it('answers null when Slack returns no user', async () => {
    active(config);
    fetchMock.mockResolvedValueOnce(ok());
    await expect(slackNotifier.memberByEmail('none@x.co')).resolves.toBeNull();
    fetchMock.mockResolvedValueOnce(ok());
    await expect(slackNotifier.member('U9')).resolves.toBeNull();
  });

  it('answers null and warns when the email lookup fails', async () => {
    active(config);
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    fetchMock.mockResolvedValue(failed('users_not_found'));
    await expect(slackNotifier.memberByEmail('gone@x.co')).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'Slack member lookup by email failed',
    );
  });
});

describe('signingSecret', () => {
  it('reads the active configuration secret, or empty without one', async () => {
    active(config);
    await expect(slackNotifier.signingSecret()).resolves.toBe(config.signingSecret);
    jest.restoreAllMocks();
    active(null);
    await expect(slackNotifier.signingSecret()).resolves.toBe('');
  });
});

describe('listChannels', () => {
  it('pages through every channel and sorts them by name', async () => {
    active(config);
    fetchMock
      .mockResolvedValueOnce(
        ok({
          channels: [{ id: 'C2', name: 'random', is_private: false, is_member: true }],
          response_metadata: { next_cursor: 'page-2' },
        }),
      )
      .mockResolvedValueOnce(
        ok({ channels: [{ id: 'C1', name: 'alerts', is_private: true, is_member: false }] }),
      );
    await expect(slackNotifier.listChannels()).resolves.toEqual([
      { id: 'C1', name: 'alerts', isPrivate: true, isMember: false },
      { id: 'C2', name: 'random', isPrivate: false, isMember: true },
    ]);
    expect(call(0).body).toEqual({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 200,
    });
    expect(call(1).body.cursor).toBe('page-2');
  });

  it('answers an empty list when Slack sends no channels', async () => {
    active(config);
    fetchMock.mockResolvedValue(ok({ response_metadata: { next_cursor: '' } }));
    await expect(slackNotifier.listChannels()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
