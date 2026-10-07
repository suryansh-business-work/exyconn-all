import {
  createRazorpayLink,
  testRazorpayKeys,
  validRazorpaySignature,
} from '../../../../../src/modules/clienthub/payments/razorpay.client';
import { hmacHex } from '../../../../../src/modules/clienthub/payments/signature';

/** Never a literal credential: each only has to look like a long key. */
const keys = { keyId: 'rzp_test_id', keySecret: `ks_${'k'.repeat(24)}` };
const HOOK_SECRET = `wh_${'w'.repeat(24)}`;
const credentials = `${keys.keyId}:${keys.keySecret}`;
const basicAuth = `Basic ${Buffer.from(credentials).toString('base64')}`;

const request = {
  amount: 2500,
  currency: 'inr',
  description: 'Invoice INV-9',
  customerEmail: 'ravi@acme.test',
  attemptId: 'attempt-9',
  successUrl: 'https://hub.test/payments/return?attempt=attempt-9',
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

describe('createRazorpayLink', () => {
  it('opens a payment link in paise with Razorpay’s own notifications off', async () => {
    respond(200, JSON.stringify({ id: 'plink_1', short_url: 'https://rzp.io/i/abc' }));

    const link = await createRazorpayLink(keys, request);

    expect(link).toEqual({ externalId: 'plink_1', url: 'https://rzp.io/i/abc' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.razorpay.com/v1/payment_links');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Authorization: basicAuth, 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toMatchObject({
      amount: 250000,
      currency: 'INR',
      reference_id: 'attempt-9',
      customer: { email: 'ravi@acme.test' },
      notify: { sms: false, email: false },
      callback_url: request.successUrl,
      notes: { attemptId: 'attempt-9' },
    });
  });

  it('reports Razorpay’s own error description', async () => {
    respond(400, JSON.stringify({ error: { description: 'amount exceeds maximum' } }));

    await expect(createRazorpayLink(keys, request)).rejects.toThrow(
      'Razorpay: amount exceeds maximum',
    );
  });

  it('reports the HTTP status when the answer is not JSON', async () => {
    respond(503, 'unavailable');

    await expect(createRazorpayLink(keys, request)).rejects.toThrow('Razorpay: HTTP 503');
  });
});

describe('testRazorpayKeys', () => {
  it('lists one payment with a GET and no body', async () => {
    respond(200, '{"items":[]}');

    await expect(testRazorpayKeys(keys)).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.razorpay.com/v1/payments?count=1');
    expect(init).toMatchObject({ method: 'GET', body: undefined });
    expect(init.headers).toEqual({ Authorization: basicAuth });
  });
});

describe('validRazorpaySignature', () => {
  const raw = Buffer.from('{"event":"payment_link.paid"}');

  it('accepts the hex HMAC of the raw body', () => {
    expect(validRazorpaySignature(raw, hmacHex(HOOK_SECRET, raw), HOOK_SECRET)).toBe(true);
  });

  it('refuses a missing, empty or wrong signature', () => {
    expect(validRazorpaySignature(raw, undefined, HOOK_SECRET)).toBe(false);
    expect(validRazorpaySignature(raw, '', HOOK_SECRET)).toBe(false);
    expect(validRazorpaySignature(Buffer.from('{}'), hmacHex(HOOK_SECRET, raw), HOOK_SECRET)).toBe(
      false,
    );
  });
});
