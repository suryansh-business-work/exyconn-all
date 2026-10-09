import { hmacHex, sameHex } from './signature';
import { minorUnits } from './minorUnits';

const API = 'https://api.stripe.com/v1';
const TIMEOUT_MS = 15_000;
/** How old a signed webhook may be before it is treated as a replay. */
const TOLERANCE_SEC = 300;

/** Stripe's REST API with a secret key — no SDK, so nothing new ships with the server. */
async function call<T>(secretKey: string, path: string, body?: URLSearchParams): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!response.ok) {
    const reason = payload.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Stripe: ${reason}`);
  }
  return payload;
}

export interface CheckoutRequest {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  attemptId: string;
  successUrl: string;
  cancelUrl: string;
}

/** A hosted Stripe Checkout page for one invoice balance. Card details never touch our servers. */
export async function createStripeCheckout(secretKey: string, request: CheckoutRequest) {
  const body = new URLSearchParams({
    mode: 'payment',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': request.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(minorUnits(request.amount, request.currency)),
    'line_items[0][price_data][product_data][name]': request.description,
    customer_email: request.customerEmail,
    client_reference_id: request.attemptId,
    'metadata[attemptId]': request.attemptId,
    success_url: request.successUrl,
    cancel_url: request.cancelUrl,
  });
  const session = await call<{ id: string; url: string }>(secretKey, '/checkout/sessions', body);
  return { externalId: session.id, url: session.url };
}

/** Whether the key works: Stripe answers the account balance for any valid secret key. */
export async function testStripeKey(secretKey: string): Promise<void> {
  await call(secretKey, '/balance');
}

/**
 * Checks the `Stripe-Signature` header (`t=…,v1=…`) over the raw body, and that it is recent.
 * https://docs.stripe.com/webhooks#verify-manually
 */
export function validStripeSignature(
  raw: Buffer,
  header: string | undefined,
  webhookSecret: string,
  nowSec = Math.floor(Date.now() / 1000),
): boolean {
  const parts = new Map<string, string[]>();
  for (const piece of (header ?? '').split(',')) {
    const [key, value] = piece.split('=');
    if (key && value) parts.set(key, [...(parts.get(key) ?? []), value]);
  }
  const timestamp = Number.parseInt(parts.get('t')?.[0] ?? '', 10);
  if (!Number.isFinite(timestamp) || Math.abs(nowSec - timestamp) > TOLERANCE_SEC) {
    return false;
  }
  const expected = hmacHex(webhookSecret, `${timestamp}.${raw.toString('utf8')}`);
  return (parts.get('v1') ?? []).some((signature) => sameHex(signature, expected));
}
