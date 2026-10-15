import { createHmac, timingSafeEqual } from 'node:crypto';
import { getJson, postJson } from '../../social-accounts/social.http';

/**
 * The two things the server says to Meta's WhatsApp Cloud API: send a message, and mark the
 * customer's message read. https://developers.facebook.com/docs/whatsapp/cloud-api
 */
const GRAPH = 'https://graph.facebook.com/v21.0';
const PROVIDER = 'WhatsApp';

/** A Cloud API message body, without the envelope `send` adds. */
export type WaPayload = Record<string, unknown> & { type: string };

/** Where messages go out from: the number's id and its (opened) access token. */
export interface Sender {
  phoneNumberId: string;
  accessToken: string;
}

const messagesUrl = (sender: Sender) =>
  `${GRAPH}/${encodeURIComponent(sender.phoneNumberId)}/messages`;

export async function sendMessage(sender: Sender, to: string, payload: WaPayload): Promise<void> {
  await postJson(
    PROVIDER,
    messagesUrl(sender),
    { messaging_product: 'whatsapp', recipient_type: 'individual', to, ...payload },
    sender.accessToken,
  );
}

/** Blue ticks on the customer's message, and "typing…" until the reply goes out. */
export async function markRead(sender: Sender, messageId: string): Promise<void> {
  await postJson(
    PROVIDER,
    messagesUrl(sender),
    {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
      typing_indicator: { type: 'text' },
    },
    sender.accessToken,
  );
}

/** Whether `X-Hub-Signature-256` is Meta's HMAC of the exact bytes received. */
export function validSignature(rawBody: Buffer, header: string | undefined, appSecret: string) {
  const prefix = 'sha256=';
  if (!header?.startsWith(prefix)) {
    return false;
  }
  const expected = createHmac('sha256', appSecret).update(rawBody).digest();
  const given = Buffer.from(header.slice(prefix.length), 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** The WhatsApp scopes whose targets are the business accounts a token can act for. */
const WABA_SCOPES: ReadonlySet<string> = new Set([
  'whatsapp_business_management',
  'whatsapp_business_messaging',
]);

interface TokenDebug {
  data?: { granular_scopes?: { scope?: string; target_ids?: string[] }[] };
}

/**
 * Subscribes the app to every WhatsApp Business Account the token can act for. Meta delivers
 * a number's messages only to apps subscribed to its account: a verified webhook alone receives
 * nothing. Idempotent on Meta's side. Resolves to the account ids subscribed.
 * https://developers.facebook.com/docs/whatsapp/embedded-signup/webhooks#subscribe-to-webhooks
 */
export async function subscribeApp(accessToken: string): Promise<string[]> {
  const token = encodeURIComponent(accessToken);
  const debug = (await getJson(
    PROVIDER,
    `${GRAPH}/debug_token?input_token=${token}`,
    accessToken,
  )) as TokenDebug;
  const accounts = [
    ...new Set(
      (debug.data?.granular_scopes ?? [])
        .filter((grant) => WABA_SCOPES.has(grant.scope ?? ''))
        .flatMap((grant) => grant.target_ids ?? []),
    ),
  ];
  if (accounts.length === 0) {
    throw new Error(
      'the token is not granted whatsapp_business_management for any WhatsApp Business Account',
    );
  }
  for (const account of accounts) {
    await postJson(
      PROVIDER,
      `${GRAPH}/${encodeURIComponent(account)}/subscribed_apps`,
      {},
      accessToken,
    );
  }
  return accounts;
}

/**
 * Proves a Phone number ID and access token belong together: reads the number with the token.
 * Resolves to how Meta names it, e.g. "+1 555-010-0000 (Acme Clinic)".
 */
export async function verifyNumber(sender: Sender): Promise<string> {
  const fields = 'display_phone_number,verified_name';
  const response = await fetch(
    `${GRAPH}/${encodeURIComponent(sender.phoneNumberId)}?fields=${fields}`,
    { headers: { Authorization: `Bearer ${sender.accessToken}` } },
  );
  const body = (await response.json().catch(() => ({}))) as {
    display_phone_number?: string;
    verified_name?: string;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(body.error?.message ?? `HTTP ${response.status}`);
  }
  return [body.display_phone_number, body.verified_name && `(${body.verified_name})`]
    .filter(Boolean)
    .join(' ');
}
