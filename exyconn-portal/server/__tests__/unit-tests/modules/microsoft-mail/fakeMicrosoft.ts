import { runAsPlatform } from '../../../../src/lib/tenant';
import { seal } from '../../../../src/utils/secretBox';
import {
  MicrosoftMailAccountModel,
  MicrosoftMailConfigModel,
} from '../../../../src/modules/microsoft-mail/microsoft.models';

/**
 * A stand-in for Microsoft: the Entra token endpoint and the few Graph calls the CRM makes, for
 * several mailboxes answered from memory, so a suite says exactly what each one allows.
 */

const TOKEN_PATH = /^https:\/\/login\.microsoftonline\.com\/[^/]+\/oauth2\/v2\.0\/token$/;
const GRAPH = 'https://graph.microsoft.com/v1.0';

export const APP_SECRET = process.env.TEST_MICROSOFT_CLIENT_SECRET ?? 'ms-secret-for-tests';

export interface FakeMicrosoftMailbox {
  /** Microsoft answers invalid_grant: the stored connection was revoked. */
  revoked?: boolean;
  /** A new refresh token handed back with each access token. */
  rotateTo?: string;
  /** Graph refuses sendMail with this status. */
  sendFails?: number;
}

export interface TokenCall {
  url: string;
  form: Record<string, string>;
}

export interface SendCall {
  mailbox: string;
  message: {
    subject: string;
    body: { contentType: string; content: string };
    toRecipients: Array<{ emailAddress: { address: string } }>;
    ccRecipients: Array<{ emailAddress: { address: string } }>;
  };
  saveToSentItems: boolean;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Installs the fake on fetch and returns what it recorded. */
export function fakeMicrosoft(mailboxes: Record<string, FakeMicrosoftMailbox>) {
  const tokens: TokenCall[] = [];
  const sent: SendCall[] = [];

  const tokenFor = (url: string, body: URLSearchParams) => {
    const form = Object.fromEntries(body.entries());
    tokens.push({ url, form });
    const presented = form.grant_type === 'refresh_token' ? form.refresh_token : form.code;
    const email = presented.replace(/^(refresh|code)-/, '');
    const box = mailboxes[email];
    if (!box || box.revoked) {
      return json({ error: 'invalid_grant', error_description: 'AADSTS70000: revoked.' }, 400);
    }
    return json({ access_token: `at-${email}`, refresh_token: box.rotateTo ?? `refresh-${email}` });
  };

  const graphFor = (email: string, path: string, init?: RequestInit) => {
    const box = mailboxes[email];
    if (!box) {
      return new Response('InvalidAuthenticationToken', { status: 401 });
    }
    if (path.startsWith('/me?')) {
      return json({ mail: email, userPrincipalName: email });
    }
    if (path === '/me/sendMail') {
      if (box.sendFails) {
        return new Response('ErrorAccessDenied', { status: box.sendFails });
      }
      sent.push({ mailbox: email, ...(JSON.parse(String(init?.body)) as Omit<SendCall, 'mailbox'>) });
      return new Response(null, { status: 202 });
    }
    return json({ error: 'unexpected call' }, 500);
  };

  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    if (TOKEN_PATH.test(url)) {
      return tokenFor(url, init?.body as URLSearchParams);
    }
    if (url.startsWith(GRAPH)) {
      const auth = new Headers(init?.headers).get('Authorization') ?? '';
      return graphFor(auth.replace('Bearer at-', ''), url.slice(GRAPH.length), init);
    }
    throw new Error(`Unexpected fetch ${url}`);
  });
  return { tokens, sent };
}

/** The Entra app Tech saves, turned on. */
export const saveApp = (fields: Record<string, unknown> = {}) =>
  runAsPlatform(() =>
    MicrosoftMailConfigModel.create({
      key: 'default',
      clientId: 'ms-client-id',
      clientSecret: APP_SECRET,
      tenant: 'common',
      enabled: true,
      ...fields,
    }),
  );

/** A connected mailbox whose refresh token the fake recognises; resolves to its id. */
export const connectMailbox = (email: string, fields: Record<string, unknown> = {}) =>
  runAsPlatform(() =>
    MicrosoftMailAccountModel.create({ email, refreshToken: seal(`refresh-${email}`), ...fields }),
  ).then((account) => account._id.toHexString());
