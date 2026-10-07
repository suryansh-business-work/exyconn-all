import {
  createStripeCheckout,
  testStripeKey,
  validStripeSignature,
} from '../../../../../src/modules/clienthub/payments/stripe.client';
import { hmacHex } from '../../../../../src/modules/clienthub/payments/signature';

/** Never a literal credential: each only has to look like a long key. */
const SECRET_KEY = `sk_test_${'k'.repeat(24)}`;
const HOOK_SECRET = `whsec_${'w'.repeat(24)}`;
const OTHER_SECRET = `whsec_${'o'.repeat(24)}`;

const request = {
  amount: 120.5,
  currency: 'usd',
  description: 'Invoice INV-7',
  customerEmail: 'dana@acme.test',
  attemptId: 'attempt-1',
  successUrl: 'https://hub.test/payments/return?attempt=attempt-1',
  cancelUrl: 'https://hub.test/invoices',
};

let fetchMock: jest.SpyInstance;

const respond = (status: number, body: string) => {
  fetchMock.mockImplementation(async () => new Response(body, { status }));
};

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('createStripeCheckout', () => {
  it('opens a hosted checkout for the balance in minor units and returns its address', async () => {
    respond(200, JSON.stringify({ id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' }));

    const checkout = await createStripeCheckout(SECRET_KEY, request);

    expect(checkout).toEqual({ externalId: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.stripe.com/v1/checkout/sessions');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      Authorization: `Bearer ${SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = init.body as URLSearchParams;
    expect(body.get('line_items[0][price_data][currency]')).toBe('usd');
    expect(body.get('line_items[0][price_data][unit_amount]')).toBe('12050');
    expect(body.get('client_reference_id')).toBe('attempt-1');
    expect(body.get('metadata[attemptId]')).toBe('attempt-1');
    expect(body.get('customer_email')).toBe('dana@acme.test');
  });

  it('reports Stripe’s own error message', async () => {
    respond(400, JSON.stringify({ error: { message: 'Amount too small' } }));

    await expect(createStripeCheckout(SECRET_KEY, request)).rejects.toThrow(
      'Stripe: Amount too small',
    );
  });

  it('reports the HTTP status when the answer is not JSON', async () => {
    respond(502, '<html>Bad gateway</html>');

    await expect(createStripeCheckout(SECRET_KEY, request)).rejects.toThrow('Stripe: HTTP 502');
  });
});

describe('testStripeKey', () => {
  it('reads the account balance with a GET and no body', async () => {
    respond(200, '{}');

    await expect(testStripeKey(SECRET_KEY)).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.stripe.com/v1/balance');
    expect(init.method).toBe('GET');
    expect(init.headers).toEqual({ Authorization: `Bearer ${SECRET_KEY}` });
  });
});

describe('validStripeSignature', () => {
  const NOW = 1_800_000_000;
  const raw = Buffer.from('{"type":"checkout.session.completed"}');
  const sign = (timestamp: number, secret = HOOK_SECRET) =>
    hmacHex(secret, `${timestamp}.${raw.toString('utf8')}`);

  it('accepts a recent signature over the raw body', () => {
    const header = `t=${NOW},v1=${sign(NOW)}`;

    expect(validStripeSignature(raw, header, HOOK_SECRET, NOW + 10)).toBe(true);
  });

  it('accepts the header when any of several v1 signatures matches (secret rotation)', () => {
    const header = `t=${NOW},v1=${sign(NOW, OTHER_SECRET)},v1=${sign(NOW)},v0=ignored`;

    expect(validStripeSignature(raw, header, HOOK_SECRET, NOW)).toBe(true);
  });

  it('refuses a signature older than five minutes as a replay', () => {
    const header = `t=${NOW},v1=${sign(NOW)}`;

    expect(validStripeSignature(raw, header, HOOK_SECRET, NOW + 301)).toBe(false);
  });

  it('refuses a signature made with another secret or over another body', () => {
    expect(
      validStripeSignature(raw, `t=${NOW},v1=${sign(NOW, OTHER_SECRET)}`, HOOK_SECRET, NOW),
    ).toBe(false);
    expect(
      validStripeSignature(Buffer.from('{}'), `t=${NOW},v1=${sign(NOW)}`, HOOK_SECRET, NOW),
    ).toBe(false);
  });

  it('refuses a missing, malformed or timestamp-less header', () => {
    expect(validStripeSignature(raw, undefined, HOOK_SECRET, NOW)).toBe(false);
    expect(validStripeSignature(raw, 'garbage,=x,t=', HOOK_SECRET, NOW)).toBe(false);
    expect(validStripeSignature(raw, `v1=${sign(NOW)}`, HOOK_SECRET, NOW)).toBe(false);
    expect(validStripeSignature(raw, `t=${NOW}`, HOOK_SECRET, NOW)).toBe(false);
  });

  it('checks against the current time by default', () => {
    const now = Math.floor(Date.now() / 1000);

    expect(validStripeSignature(raw, `t=${now},v1=${sign(now)}`, HOOK_SECRET)).toBe(true);
  });
});
