import { hmacHex, sameHex } from './signature';
import { minorUnits } from './minorUnits';
import type { CheckoutRequest } from './stripe.client';

const API = 'https://api.razorpay.com/v1';
const TIMEOUT_MS = 15_000;

interface RazorpayKeys {
  keyId: string;
  keySecret: string;
}

/** Razorpay's REST API with basic auth — no SDK, so nothing new ships with the server. */
async function call<T>(keys: RazorpayKeys, path: string, body?: unknown): Promise<T> {
  const auth = Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString('base64');
  const response = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: { description?: string };
  };
  if (!response.ok) {
    const reason = payload.error?.description ?? `HTTP ${response.status}`;
    throw new Error(`Razorpay: ${reason}`);
  }
  return payload;
}

/**
 * A hosted Razorpay payment link (cards, UPI, netbanking, wallets) for one invoice balance.
 * Razorpay's own notifications are off — the client already has our email.
 */
export async function createRazorpayLink(keys: RazorpayKeys, request: CheckoutRequest) {
  const link = await call<{ id: string; short_url: string }>(keys, '/payment_links', {
    amount: minorUnits(request.amount, request.currency),
    currency: request.currency.toUpperCase(),
    description: request.description,
    reference_id: request.attemptId,
    customer: { email: request.customerEmail },
    notify: { sms: false, email: false },
    callback_url: request.successUrl,
    callback_method: 'get',
    notes: { attemptId: request.attemptId },
  });
  return { externalId: link.id, url: link.short_url };
}

/** Whether the keys work: listing one payment needs valid credentials and nothing else. */
export async function testRazorpayKeys(keys: RazorpayKeys): Promise<void> {
  await call(keys, '/payments?count=1');
}

/** `X-Razorpay-Signature` is the hex HMAC-SHA256 of the raw body with the webhook secret. */
export function validRazorpaySignature(
  raw: Buffer,
  signature: string | undefined,
  webhookSecret: string,
): boolean {
  return Boolean(signature) && sameHex(signature ?? '', hmacHex(webhookSecret, raw));
}
