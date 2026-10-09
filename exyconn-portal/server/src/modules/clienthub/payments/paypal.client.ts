import type { CheckoutRequest } from './stripe.client';

const TIMEOUT_MS = 15_000;
/** PayPal's REST hosts, per account mode. */
const HOSTS = { SANDBOX: 'https://api-m.sandbox.paypal.com', LIVE: 'https://api-m.paypal.com' };

export type PaypalMode = keyof typeof HOSTS;

export interface PaypalKeys {
  clientId: string;
  clientSecret: string;
  mode: PaypalMode;
}

/** An access token, kept until a minute before PayPal says it expires. */
const tokens = new Map<string, { token: string; expiresAt: number }>();

async function accessToken(keys: PaypalKeys): Promise<string> {
  const key = `${keys.mode}:${keys.clientId}`;
  const cached = tokens.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }
  const auth = Buffer.from(`${keys.clientId}:${keys.clientSecret}`).toString('base64');
  const response = await fetch(`${HOSTS[keys.mode]}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    const reason = payload.error_description ?? `HTTP ${response.status}`;
    throw new Error(`PayPal: ${reason}`);
  }
  const lifetimeMs = ((payload.expires_in ?? 300) - 60) * 1000;
  tokens.set(key, { token: payload.access_token, expiresAt: Date.now() + lifetimeMs });
  return payload.access_token;
}

/** PayPal's REST API with an OAuth token — no SDK, so nothing new ships with the server. */
async function call<T>(keys: PaypalKeys, path: string, body?: unknown, idempotencyKey?: string) {
  const response = await fetch(`${HOSTS[keys.mode]}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${await accessToken(keys)}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'PayPal-Request-Id': idempotencyKey } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    details?: Array<{ issue?: string }>;
  };
  if (!response.ok) {
    const issue = payload.details?.[0]?.issue ?? payload.message ?? `HTTP ${response.status}`;
    throw new Error(`PayPal: ${issue}`);
  }
  return payload;
}

/** PayPal wants the amount as a decimal string with the currency's own number of decimals. */
function amountValue(amount: number, currency: string): string {
  const digits =
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  return amount.toFixed(digits);
}

interface PaypalOrder {
  id: string;
  status: string;
  links?: Array<{ rel: string; href: string }>;
  purchase_units?: Array<{
    reference_id?: string;
    payments?: { captures?: Array<{ id: string; status: string }> };
  }>;
}

/**
 * A PayPal order for one invoice balance, approved by the payer on PayPal's own page (cards,
 * PayPal balance, Pay Later). The attempt id travels as the order's reference, and is the
 * idempotency key, so a retried request never opens a second order.
 */
export async function createPaypalOrder(keys: PaypalKeys, request: CheckoutRequest) {
  const order = await call<PaypalOrder>(
    keys,
    '/v2/checkout/orders',
    {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: request.attemptId,
          custom_id: request.attemptId,
          description: request.description,
          amount: {
            currency_code: request.currency.toUpperCase(),
            value: amountValue(request.amount, request.currency),
          },
        },
      ],
      payment_source: {
        paypal: {
          email_address: request.customerEmail,
          experience_context: {
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING',
            return_url: request.successUrl,
            cancel_url: request.cancelUrl,
          },
        },
      },
    },
    `order-${request.attemptId}`,
  );
  const approve = order.links?.find(
    (link) => link.rel === 'payer-action' || link.rel === 'approve',
  );
  if (!approve) {
    throw new Error('PayPal: the order came back without an approval link');
  }
  return { externalId: order.id, url: approve.href };
}

/** What capturing an approved order produced: whether money moved, and the capture's id. */
export interface PaypalCapture {
  completed: boolean;
  captureId: string;
}

/**
 * Captures an order the payer approved. Safe to repeat: an order already captured answers
 * with its existing capture rather than charging again.
 */
export async function capturePaypalOrder(
  keys: PaypalKeys,
  orderId: string,
): Promise<PaypalCapture> {
  let order = await call<PaypalOrder>(keys, `/v2/checkout/orders/${encodeURIComponent(orderId)}`);
  if (order.status === 'APPROVED') {
    order = await call<PaypalOrder>(
      keys,
      `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {},
      `capture-${orderId}`,
    );
  }
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    completed: order.status === 'COMPLETED' && capture?.status === 'COMPLETED',
    captureId: capture?.id ?? '',
  };
}

/** Whether the credentials work: PayPal only issues a token for valid ones. */
export async function testPaypalKeys(keys: PaypalKeys): Promise<void> {
  tokens.delete(`${keys.mode}:${keys.clientId}`);
  await accessToken(keys);
}

/** The headers PayPal signs a webhook delivery with. */
export interface PaypalWebhookHeaders {
  transmissionId?: string;
  transmissionTime?: string;
  transmissionSig?: string;
  certUrl?: string;
  authAlgo?: string;
}

/**
 * Asks PayPal whether a webhook delivery is genuine — PayPal checks its own signature against
 * the webhook id configured for the account. Anything but SUCCESS is refused.
 */
export async function verifyPaypalWebhook(
  keys: PaypalKeys,
  webhookId: string,
  headers: PaypalWebhookHeaders,
  event: unknown,
): Promise<boolean> {
  const result = await call<{ verification_status?: string }>(
    keys,
    '/v1/notifications/verify-webhook-signature',
    {
      transmission_id: headers.transmissionId,
      transmission_time: headers.transmissionTime,
      transmission_sig: headers.transmissionSig,
      cert_url: headers.certUrl,
      auth_algo: headers.authAlgo,
      webhook_id: webhookId,
      webhook_event: event,
    },
  );
  return result.verification_status === 'SUCCESS';
}
