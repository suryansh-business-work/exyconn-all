import { randomUUID } from 'node:crypto';
import {
  SocialProviderError,
  getJson,
  postForm,
  postJson,
} from '../../../../src/modules/social-accounts/social.http';

/** Answers every request with this status and raw body, recording what was sent. */
function answer(status: number, body: string) {
  return jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => new Response(body, { status }));
}

const failureOf = async (promise: Promise<unknown>): Promise<Error> => {
  try {
    await promise;
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected the request to fail');
};

afterEach(() => jest.restoreAllMocks());

describe('provider replies', () => {
  it('returns the JSON a provider answers with', async () => {
    answer(200, JSON.stringify({ id: 'abc' }));
    expect(await getJson('X', 'https://api/x')).toEqual({ id: 'abc' });
  });

  it('keeps the provider’s own words, whichever field it puts them in', async () => {
    answer(400, JSON.stringify({ error: { message: 'redirect_uri mismatch' } }));
    expect((await failureOf(getJson('Meta', 'https://api/m'))).message).toBe(
      'Meta refused the connection: redirect_uri mismatch',
    );

    jest.restoreAllMocks();
    answer(400, JSON.stringify({ error: 'invalid_grant' }));
    expect((await failureOf(getJson('YouTube', 'https://api/y'))).message).toMatch('invalid_grant');

    jest.restoreAllMocks();
    answer(400, JSON.stringify({ error: null, error_description: 'Code was already used' }));
    expect((await failureOf(getJson('LinkedIn', 'https://api/l'))).message).toMatch(
      'Code was already used',
    );

    jest.restoreAllMocks();
    answer(403, JSON.stringify({ message: 'Not enough permissions' }));
    expect((await failureOf(getJson('LinkedIn', 'https://api/l'))).message).toMatch(
      'Not enough permissions',
    );
  });

  it('falls back to the HTTP status when the reply is not JSON', async () => {
    answer(502, '<html>Bad gateway</html>');
    const error = await failureOf(getJson('X', 'https://api/x'));
    expect(error).toBeInstanceOf(SocialProviderError);
    expect(error.name).toBe('SocialProviderError');
    expect(error.message).toBe('X refused the connection: HTTP 502');
  });
});

describe('provider requests', () => {
  it('sends a bearer token only when there is one', async () => {
    const token = `token-${randomUUID()}`;
    const fetched = answer(200, '{}');
    await getJson('X', 'https://api/a', token);
    await getJson('X', 'https://api/b');
    const headers = fetched.mock.calls.map(([, init]) => init?.headers as Record<string, string>);
    expect(headers[0].Authorization).toBe(`Bearer ${token}`);
    expect(headers[1].Authorization).toBeUndefined();
  });

  it('posts a form, with any extra headers the provider needs', async () => {
    const fetched = answer(200, '{}');
    await postForm('X', 'https://api/token', { code: 'c1' }, { Authorization: 'Basic abc' });
    await postForm('X', 'https://api/token', { code: 'c2' });
    const [first, second] = fetched.mock.calls.map(([, init]) => init);
    expect(first?.method).toBe('POST');
    expect(first?.body).toBe('code=c1');
    expect((first?.headers as Record<string, string>).Authorization).toBe('Basic abc');
    expect((second?.headers as Record<string, string>)['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    );
  });

  it('posts JSON as the account, with or without extra headers', async () => {
    const token = `token-${randomUUID()}`;
    const fetched = answer(201, JSON.stringify({ data: { id: 't1' } }));
    expect(await postJson('X', 'https://api/tweets', { text: 'Hi' }, token)).toEqual({
      data: { id: 't1' },
    });
    await postJson('LinkedIn', 'https://api/ugc', {}, token, { 'X-Restli-Protocol-Version': '2' });
    const [first, second] = fetched.mock.calls.map(([, init]) => init);
    expect(first?.body).toBe(JSON.stringify({ text: 'Hi' }));
    expect((first?.headers as Record<string, string>).Authorization).toBe(`Bearer ${token}`);
    expect((second?.headers as Record<string, string>)['X-Restli-Protocol-Version']).toBe('2');
  });
});
