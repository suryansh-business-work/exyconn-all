import { runAsPlatform } from '../../../../src/lib/tenant';
import { seal } from '../../../../src/utils/secretBox';
import { ConfigurationError } from '../../../../src/utils/errors';
import {
  EMAIL_ACCOUNTS_UNAVAILABLE,
  forCrmUser,
  GmailAuthError,
  gmailClient,
  gmailClientConfig,
  type Mailbox,
} from '../../../../src/modules/gmail/gmail.client';
import { GmailConfigModel } from '../../../../src/modules/gmail/gmail.models';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const mailbox: Mailbox = {
  clientId: 'client-id',
  clientSecret: process.env.TEST_GMAIL_CLIENT_SECRET ?? 'client-secret-for-tests',
  refreshToken: seal('refresh-sales'),
  email: 'sales@exyconn.test',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

interface Call {
  url: string;
  init?: RequestInit;
}

/** Google answering the token endpoint with `token`, and every API path with `api`. */
function google(token: Response | (() => Response), api: (url: URL) => Response = () => json({})) {
  const calls: Call[] = [];
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url === TOKEN_URL) {
      return typeof token === 'function' ? token() : token;
    }
    return api(new URL(url));
  });
  return calls;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('forCrmUser', () => {
  it('hands back what the work returned', async () => {
    await expect(forCrmUser(async () => 'sent')).resolves.toBe('sent');
  });

  it('tells a CRM user to ask their administrator instead of naming the Tech setup', async () => {
    const refusal = forCrmUser(() => gmailClientConfig());

    await expect(refusal).rejects.toThrow(ConfigurationError);
    await expect(refusal).rejects.toThrow(EMAIL_ACCOUNTS_UNAVAILABLE);
    await expect(refusal).rejects.not.toThrow(/Environment Variables/);
  });

  it('passes every other failure through unchanged', async () => {
    const failure = new GmailAuthError('Google refused the token');
    await expect(forCrmUser(() => Promise.reject(failure))).rejects.toBe(failure);
  });
});

describe('gmailClientConfig', () => {
  it('names what Tech still has to do while the client is off or incomplete', async () => {
    await expect(gmailClientConfig()).rejects.toThrow(ConfigurationError);
    await expect(gmailClientConfig()).rejects.toThrow(
      /Tech > Environment Variables > Email accounts/,
    );

    await runAsPlatform(() =>
      GmailConfigModel.create({ key: 'default', clientId: 'client-id', enabled: true }),
    );
    await expect(gmailClientConfig()).rejects.toThrow('Gmail is not set up');

    await runAsPlatform(() =>
      GmailConfigModel.updateOne({ key: 'default' }, { clientSecret: 's', clientId: '' }),
    );
    await expect(gmailClientConfig()).rejects.toThrow('Gmail is not set up');
  });

  it('returns the saved client once it is complete and turned on', async () => {
    await runAsPlatform(() =>
      GmailConfigModel.create({
        key: 'default',
        clientId: 'client-id',
        clientSecret: 's',
        enabled: true,
      }),
    );
    await expect(gmailClientConfig()).resolves.toMatchObject({ clientId: 'client-id' });
  });
});

describe('the access token', () => {
  it('trades the opened refresh token and calls the API with the access token', async () => {
    const calls = google(json({ access_token: 'at-1' }), () =>
      json({ emailAddress: 'sales@exyconn.test' }),
    );

    await expect(gmailClient.profile(mailbox)).resolves.toEqual({
      emailAddress: 'sales@exyconn.test',
    });

    const body = calls[0].init?.body as URLSearchParams;
    expect(body.get('refresh_token')).toBe('refresh-sales');
    expect(body.get('grant_type')).toBe('refresh_token');
    expect(new Headers(calls[1].init?.headers).get('Authorization')).toBe('Bearer at-1');
  });

  it('asks for a reconnect on invalid_grant, with or without Google’s reason', async () => {
    google(json({ error: 'invalid_grant', error_description: 'Token has been revoked.' }, 400));
    const revoked = gmailClient.profile(mailbox);
    await expect(revoked).rejects.toThrow(GmailAuthError);
    await expect(revoked).rejects.toThrow(
      'Google refused the connection to sales@exyconn.test: Token has been revoked. Connect it again.',
    );

    jest.restoreAllMocks();
    google(json({ error: 'invalid_grant' }, 400));
    await expect(gmailClient.profile(mailbox)).rejects.toThrow(': the token expired. Connect');
  });

  it('keeps Google’s reason for any other refusal, falling back to its code, then to none', async () => {
    google(json({ error: 'invalid_client', error_description: 'Unauthorized' }, 401));
    await expect(gmailClient.profile(mailbox)).rejects.toThrow(
      'Gmail refused the stored connection: Unauthorized.',
    );

    jest.restoreAllMocks();
    google(json({ error: 'invalid_client' }, 401));
    await expect(gmailClient.profile(mailbox)).rejects.toThrow(
      'Gmail refused the stored connection: invalid_client.',
    );

    jest.restoreAllMocks();
    google(json({}));
    const refused = gmailClient.profile(mailbox);
    await expect(refused).rejects.toThrow('Gmail refused the stored connection: no reason.');
    await expect(refused).rejects.not.toThrow(GmailAuthError);
  });
});

describe('Gmail API calls', () => {
  const token = () => json({ access_token: 'at-1' });

  it('marks a 401 from the API as an auth error, and any other failure as a plain one', async () => {
    google(token, () => new Response('Invalid Credentials', { status: 401 }));
    const unauthorised = gmailClient.thread(mailbox, 't1');
    await expect(unauthorised).rejects.toThrow(GmailAuthError);
    await expect(unauthorised).rejects.toThrow(
      'Gmail /threads/t1 failed (401): Invalid Credentials',
    );

    jest.restoreAllMocks();
    google(token, () => new Response('x'.repeat(400), { status: 500 }));
    const failed = gmailClient.threadIds(mailbox, 'from:a@x.test', 5);
    await expect(failed).rejects.not.toThrow(GmailAuthError);
    await expect(failed).rejects.toThrow(`Gmail /threads failed (500): ${'x'.repeat(300)}`);
  });

  it('reads an empty search and an empty thread as no ids and no messages', async () => {
    const calls = google(token, () => json({}));

    await expect(gmailClient.threadIds(mailbox, 'from:a@x.test', 5)).resolves.toEqual([]);
    await expect(gmailClient.thread(mailbox, 'a/b')).resolves.toEqual([]);

    const search = new URL(calls[1].url);
    expect(search.searchParams.get('q')).toBe('from:a@x.test');
    expect(search.searchParams.get('maxResults')).toBe('5');
    expect(calls[3].url).toContain('/threads/a%2Fb?format=full');
  });

  it('sends a new email without a thread id, and a reply with one', async () => {
    const calls = google(token, () => json({ id: 'm1', threadId: 't1' }));
    const email = { from: mailbox.email, to: ['a@x.test'], cc: [], subject: 'Hi', body: 'Hello' };

    await gmailClient.send(mailbox, email);
    await gmailClient.send(mailbox, email, 't1');

    const fresh = JSON.parse(String(calls[1].init?.body)) as Record<string, unknown>;
    const reply = JSON.parse(String(calls[3].init?.body)) as Record<string, unknown>;
    expect(calls[1].init?.method).toBe('POST');
    expect(fresh).not.toHaveProperty('threadId');
    expect(typeof fresh.raw).toBe('string');
    expect(reply.threadId).toBe('t1');
  });
});
