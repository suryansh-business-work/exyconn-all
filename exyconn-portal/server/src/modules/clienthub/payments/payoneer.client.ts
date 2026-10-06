import type { CheckoutRequest } from './stripe.client';

const TIMEOUT_MS = 15_000;
/** Payoneer Checkout's hosts, per account mode. */
const HOSTS = { SANDBOX: 'https://api.sandbox.oscato.com', LIVE: 'https://api.live.oscato.com' };
const MEDIA_TYPE = 'application/vnd.optile.payment.enterprise-v1-extensible+json';

export type PayoneerMode = keyof typeof HOSTS;

export interface PayoneerKeys {
  merchantCode: string;
  apiToken: string;
  /** The merchant division to charge under; '' for an account without divisions. */
  division: string;
  mode: PayoneerMode;
}

/** Payoneer Checkout's REST API with basic auth — no SDK, so nothing new ships with the server. */
async function call<T>(keys: PayoneerKeys, path: string, body?: unknown): Promise<T> {
  const auth = Buffer.from(`${keys.merchantCode}:${keys.apiToken}`).toString('base64');
  const response = await fetch(`${HOSTS[keys.mode]}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: MEDIA_TYPE,
      ...(body === undefined ? {} : { 'Content-Type': MEDIA_TYPE }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    resultInfo?: string;
  };
  if (!response.ok) {
    const reason = payload.resultInfo ?? 'request refused';
    throw new Error(`Payoneer: ${reason} (HTTP ${response.status})`);
  }
  return payload;
}

/** A Payoneer checkout request: the card/wallet page needs the payer's country (ISO 3166-1). */
export interface PayoneerCheckoutRequest extends CheckoutRequest {
  country: string;
  notificationUrl: string;
}

/**
 * A hosted Payoneer Checkout page (a LIST session) for one invoice balance. The attempt id is
 * the transaction id Payoneer reports back in its notifications.
 */
export async function createPayoneerList(keys: PayoneerKeys, request: PayoneerCheckoutRequest) {
  const list = await call<{
    links?: { redirect?: string; self?: string };
    identification?: { longId?: string };
  }>(keys, '/api/lists', {
    transactionId: request.attemptId,
    country: request.country,
    integration: 'HOSTED',
    ...(keys.division ? { division: keys.division } : {}),
    customer: { number: request.customerEmail, email: request.customerEmail },
    payment: {
      amount: request.amount,
      currency: request.currency.toUpperCase(),
      reference: request.description,
    },
    callback: {
      returnUrl: request.successUrl,
      cancelUrl: request.cancelUrl,
      notificationUrl: request.notificationUrl,
    },
  });
  if (!list.links?.redirect || !list.identification?.longId) {
    throw new Error('Payoneer: the checkout came back without a payment page');
  }
  return { externalId: list.identification.longId, url: list.links.redirect };
}

/** A charge as Payoneer itself reports it — what a notification is checked against. */
export interface PayoneerCharge {
  transactionId: string;
  statusCode: string;
  amount: number;
  currency: string;
}

/**
 * Reads a charge back from Payoneer. Notifications are not signed, so nothing is recorded on
 * a notification's word: the server asks Payoneer for the charge and trusts that answer.
 */
export async function fetchPayoneerCharge(
  keys: PayoneerKeys,
  chargeLongId: string,
): Promise<PayoneerCharge> {
  const charge = await call<{
    identification?: { transactionId?: string };
    status?: { code?: string };
    payment?: { amount?: number; currency?: string };
  }>(keys, `/api/charges/${encodeURIComponent(chargeLongId)}`);
  return {
    transactionId: charge.identification?.transactionId ?? '',
    statusCode: charge.status?.code ?? '',
    amount: charge.payment?.amount ?? 0,
    currency: charge.payment?.currency ?? '',
  };
}

/** Whether the credentials work: an unknown charge answers 404 for valid keys, 401 otherwise. */
export async function testPayoneerKeys(keys: PayoneerKeys): Promise<void> {
  try {
    await call(keys, '/api/charges/credential-check');
  } catch (error) {
    if (error instanceof Error && error.message.endsWith('(HTTP 404)')) {
      return;
    }
    throw error;
  }
}
