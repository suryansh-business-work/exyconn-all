import type { GmailMessage } from '../../../../src/modules/gmail/gmail.client';

/**
 * A stand-in for Gmail as CRM > Mail uses it: folders by label, change markers, metadata and
 * full reads, label changes, trash, attachments and sending, answered from memory.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface FakeThread {
  historyId: string;
  messages: GmailMessage[];
}

export interface FakeMailbox {
  threads: Record<string, FakeThread>;
  /** Every API call answers with this status and body (e.g. the Gmail API turned off). */
  failWith?: { status: number; body: string };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const encode = (value: string) => Buffer.from(value, 'utf8').toString('base64url');

/** One message with the headers, labels and parts the mail section reads. */
export function mailMessage(fields: {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  at: string;
  labels?: string[];
  cc?: string;
  bcc?: string;
  text?: string;
  html?: string;
  snippet?: string;
  attachment?: { id: string; filename: string; size: number };
}): GmailMessage {
  const headers = [
    { name: 'From', value: fields.from },
    { name: 'To', value: fields.to },
    { name: 'Subject', value: fields.subject },
    { name: 'Message-ID', value: `<${fields.id}@mail.test>` },
    ...(fields.cc ? [{ name: 'Cc', value: fields.cc }] : []),
    ...(fields.bcc ? [{ name: 'Bcc', value: fields.bcc }] : []),
  ];
  const parts = [
    ...(fields.text === undefined
      ? []
      : [{ mimeType: 'text/plain', body: { data: encode(fields.text) } }]),
    ...(fields.html === undefined
      ? []
      : [{ mimeType: 'text/html', body: { data: encode(fields.html) } }]),
    ...(fields.attachment
      ? [
          {
            mimeType: 'application/pdf',
            filename: fields.attachment.filename,
            body: { attachmentId: fields.attachment.id, size: fields.attachment.size },
          },
        ]
      : []),
  ];
  return {
    id: fields.id,
    threadId: fields.threadId,
    internalDate: String(Date.parse(fields.at)),
    snippet: fields.snippet ?? fields.text ?? '',
    labelIds: fields.labels ?? ['INBOX'],
    payload: {
      mimeType: fields.attachment ? 'multipart/mixed' : 'multipart/alternative',
      headers,
      parts,
    },
  };
}

const labelsOf = (thread: FakeThread) => new Set(thread.messages.flatMap((m) => m.labelIds ?? []));
const lastAt = (thread: FakeThread) => Number(thread.messages.at(-1)?.internalDate ?? 0);
const subjectOf = (thread: FakeThread) =>
  thread.messages[0]?.payload?.headers?.find((h) => h.name === 'Subject')?.value ?? '';

/** Installs the fake on fetch; returns what it was asked, path by path. */
export function fakeMail(mailboxes: Record<string, FakeMailbox>) {
  const calls: Array<{ mailbox: string; method: string; path: string; search: string }> = [];
  const sent: Array<{ mailbox: string; threadId?: string; raw: string }> = [];

  const listThreads = (box: FakeMailbox, url: URL) => {
    const labels = url.searchParams.getAll('labelIds');
    const q = url.searchParams.get('q') ?? '';
    const max = Number(url.searchParams.get('maxResults') ?? 100);
    const threads = Object.entries(box.threads)
      .filter(([, thread]) => labels.every((label) => labelsOf(thread).has(label)))
      .filter(([, thread]) => q === '' || subjectOf(thread).toLowerCase().includes(q.toLowerCase()))
      .sort(([, a], [, b]) => lastAt(b) - lastAt(a))
      .slice(0, max)
      .map(([id, thread]) => ({ id, historyId: thread.historyId }));
    return json({ threads });
  };

  const changeLabels = (thread: FakeThread, init?: RequestInit) => {
    const body = JSON.parse(init?.body as string) as {
      addLabelIds: string[];
      removeLabelIds: string[];
    };
    for (const message of thread.messages) {
      const kept = (message.labelIds ?? []).filter((label) => !body.removeLabelIds.includes(label));
      message.labelIds = [...new Set([...kept, ...body.addLabelIds])];
    }
    thread.historyId = String(Number(thread.historyId) + 1);
    return json({});
  };

  const threadCall = (box: FakeMailbox, rest: string[], method: string, init?: RequestInit) => {
    const thread = box.threads[rest[0]];
    if (!thread) {
      return json({ error: { message: 'Requested entity was not found.' } }, 404);
    }
    if (rest[1] === 'modify') {
      return changeLabels(thread, init);
    }
    if (rest[1] === 'trash') {
      delete box.threads[rest[0]];
      return json({});
    }
    return method === 'GET' ? json(thread) : json({ error: 'unexpected' }, 500);
  };

  const sendCall = (email: string, box: FakeMailbox, init?: RequestInit) => {
    const body = JSON.parse(init?.body as string) as { raw: string; threadId?: string };
    const raw = Buffer.from(body.raw, 'base64url').toString('utf8');
    sent.push({ mailbox: email, threadId: body.threadId, raw });
    const threadId = body.threadId ?? `new-${sent.length}`;
    const message = mailMessage({
      id: `sent-${sent.length}`,
      threadId,
      from: email,
      to: 'someone@else.test',
      subject: 'Re: sent',
      at: '2026-10-20T10:00:00.000Z',
      labels: ['SENT'],
      text: 'sent',
    });
    box.threads[threadId] ??= { historyId: '1', messages: [] };
    box.threads[threadId].messages.push(message);
    return json({ id: message.id, threadId });
  };

  const api = (email: string, url: URL, init?: RequestInit) => {
    const box = mailboxes[email];
    const method = init?.method ?? 'GET';
    const path = url.pathname.replace('/gmail/v1/users/me', '');
    calls.push({ mailbox: email, method, path, search: url.search });
    if (box.failWith) {
      return new Response(box.failWith.body, { status: box.failWith.status });
    }
    const [, kind, ...rest] = path.split('/').map(decodeURIComponent);
    if (kind === 'threads' && rest.length === 0) {
      return listThreads(box, url);
    }
    if (kind === 'threads') {
      return threadCall(box, rest, method, init);
    }
    if (kind === 'messages' && rest[0] === 'send') {
      return sendCall(email, box, init);
    }
    if (kind === 'messages' && rest[1] === 'attachments') {
      return json({ data: encode(`file ${rest[2]}`), size: 9 });
    }
    const message = Object.values(box.threads)
      .flatMap((thread) => thread.messages)
      .find((each) => each.id === rest[0]);
    return message ? json(message) : json({ error: 'not found' }, 404);
  };

  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : (input as Request).url);
    if (url.toString() === TOKEN_URL) {
      const refresh = (init?.body as URLSearchParams).get('refresh_token') ?? '';
      return json({ access_token: `at-${refresh.replace('refresh-', '')}` });
    }
    if (url.toString().startsWith(API)) {
      const auth = new Headers(init?.headers).get('Authorization') ?? '';
      return api(auth.replace('Bearer at-', ''), url, init);
    }
    throw new Error(`Unexpected fetch ${url.toString()}`);
  });
  return { calls, sent };
}
