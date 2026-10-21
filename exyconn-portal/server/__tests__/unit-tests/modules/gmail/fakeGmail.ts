import { seal } from '../../../../src/utils/secretBox';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { GmailAccountModel, GmailConfigModel } from '../../../../src/modules/gmail/gmail.models';
import type { GmailMessage } from '../../../../src/modules/gmail/gmail.client';

/**
 * A stand-in for Google: the token endpoint and the Gmail API of several mailboxes, answered
 * from memory so a suite can say exactly what each mailbox holds and refuses.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface FakeMailbox {
  /** Thread id → its messages, oldest first. */
  threads: Record<string, GmailMessage[]>;
  /** Google answers invalid_grant: the stored connection was revoked. */
  revoked?: boolean;
}

export interface SentCall {
  mailbox: string;
  threadId?: string;
  /** The decoded RFC 5322 message. */
  raw: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** A Gmail message with the headers the CRM reads. */
export function gmailMessage(fields: {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  at: string;
  messageId?: string;
  text?: string;
  html?: string;
}): GmailMessage {
  const data = (value: string) => Buffer.from(value, 'utf8').toString('base64url');
  const parts = [
    ...(fields.text === undefined
      ? []
      : [{ mimeType: 'text/plain', body: { data: data(fields.text) } }]),
    ...(fields.html === undefined
      ? []
      : [{ mimeType: 'text/html', body: { data: data(fields.html) } }]),
  ];
  return {
    id: fields.id,
    threadId: fields.threadId,
    internalDate: String(Date.parse(fields.at)),
    snippet: fields.text ?? '',
    payload: {
      mimeType: 'multipart/alternative',
      parts,
      headers: [
        { name: 'From', value: fields.from },
        { name: 'To', value: fields.to },
        { name: 'Subject', value: fields.subject },
        { name: 'Message-ID', value: fields.messageId ?? `<${fields.id}@mail.gmail.com>` },
      ],
    },
  };
}

const headerOf = (raw: string, name: string) =>
  raw
    .split('\r\n')
    .find((line) => line.startsWith(`${name}: `))
    ?.slice(name.length + 2) ?? '';

/** Installs the fake on fetch and returns what it recorded. */
export function fakeGmail(mailboxes: Record<string, FakeMailbox>) {
  const sent: SentCall[] = [];
  const queries: Array<{ mailbox: string; q: string }> = [];
  let nextId = 1;

  const tokenFor = (body: URLSearchParams) => {
    const email = (body.get('refresh_token') ?? '').replace('refresh-', '');
    if (!mailboxes[email] || mailboxes[email].revoked) {
      return json(
        { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' },
        400,
      );
    }
    return json({ access_token: `at-${email}` });
  };

  const api = (email: string, url: URL, init?: RequestInit) => {
    const box = mailboxes[email];
    const path = url.pathname.replace('/gmail/v1/users/me', '');
    if (path === '/threads') {
      queries.push({ mailbox: email, q: url.searchParams.get('q') ?? '' });
      return json({ threads: Object.keys(box.threads).map((id) => ({ id })) });
    }
    if (path.startsWith('/threads/')) {
      return json({ messages: box.threads[decodeURIComponent(path.slice(9))] ?? [] });
    }
    if (path === '/messages/send') {
      const body = JSON.parse(init?.body as string) as { raw: string; threadId?: string };
      const raw = Buffer.from(body.raw, 'base64url').toString('utf8');
      sent.push({ mailbox: email, threadId: body.threadId, raw });
      const id = `sent-${nextId++}`;
      const threadId = body.threadId ?? `new-thread-${id}`;
      box.threads[threadId] = [
        ...(box.threads[threadId] ?? []),
        gmailMessage({
          id,
          threadId,
          from: email,
          to: headerOf(raw, 'To'),
          subject: 'sent',
          at: '2026-10-16T10:00:00.000Z',
          text: 'sent body',
        }),
      ];
      return json({ id, threadId });
    }
    if (path.startsWith('/messages/')) {
      const id = decodeURIComponent(path.slice(10));
      const found = Object.values(box.threads)
        .flat()
        .find((message) => message.id === id);
      return found ? json(found) : json({ error: 'not found' }, 404);
    }
    return json({ error: 'unexpected call' }, 500);
  };

  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : (input as Request).url);
    if (url.toString() === TOKEN_URL) {
      return tokenFor(init?.body as URLSearchParams);
    }
    if (url.toString().startsWith(API)) {
      const auth = new Headers(init?.headers).get('Authorization') ?? '';
      return api(auth.replace('Bearer at-', ''), url, init);
    }
    throw new Error(`Unexpected fetch ${url.toString()}`);
  });
  return { sent, queries, headerOf };
}

/** The Google client Tech saves, turned on. */
export const saveClient = () =>
  runAsPlatform(() =>
    GmailConfigModel.create({
      key: 'default',
      clientId: 'client-id',
      clientSecret: process.env.TEST_GMAIL_CLIENT_SECRET ?? 'client-secret-for-tests',
      enabled: true,
    }),
  );

/** A connected account of one company whose refresh token the fake recognises. */
export const connectAccount = (
  organizationId: string,
  email: string,
  fields: Record<string, unknown> = {},
) =>
  runForOrganization(organizationId, () =>
    GmailAccountModel.create({ email, refreshToken: seal(`refresh-${email}`), ...fields }),
  ).then((account) => account._id.toHexString());
