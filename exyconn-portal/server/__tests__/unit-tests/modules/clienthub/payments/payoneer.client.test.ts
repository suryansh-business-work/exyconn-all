import {
  createPayoneerList,
  fetchPayoneerCharge,
  testPayoneerKeys,
  type PayoneerKeys,
} from '../../../../../src/modules/clienthub/payments/payoneer.client';

const MEDIA_TYPE = 'application/vnd.optile.payment.enterprise-v1-extensible+json';
/** Never a literal credential: it only has to look like a long token. */
const keys: PayoneerKeys = {
  merchantCode: 'MERCHANT',
  apiToken: `po_${'t'.repeat(24)}`,
  division: '',
  mode: 'SANDBOX',
};
const credentials = `${keys.merchantCode}:${keys.apiToken}`;
const basicAuth = `Basic ${Buffer.from(credentials).toString('base64')}`;

const request = {
  amount: 300,
  currency: 'eur',
  description: 'Invoice INV-3',
  customerEmail: 'lea@acme.test',
  attemptId: 'attempt-3',
  successUrl: 'https://hub.test/payments/return?attempt=attempt-3',
  cancelUrl: 'https://hub.test/invoices',
  country: 'DE',
  notificationUrl: 'https://api.test/webhooks/payoneer',
};

let fetchMock: jest.SpyInstance;
const respond = (status: number, body: unknown) => {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  fetchMock.mockImplementation(async () => new Response(text, { status }));
};

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('createPayoneerList', () => {
  const page = { links: { redirect: 'https://pay.test/l/1' }, identification: { longId: 'L-1' } };

  it('opens a hosted checkout keyed by the attempt, without a division when the account has none', async () => {
    respond(200, page);

    expect(await createPayoneerList(keys, request)).toEqual({
      externalId: 'L-1',
      url: 'https://pay.test/l/1',
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.sandbox.oscato.com/api/lists');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      Authorization: basicAuth,
      Accept: MEDIA_TYPE,
      'Content-Type': MEDIA_TYPE,
    });
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      transactionId: 'attempt-3',
      country: 'DE',
      integration: 'HOSTED',
      payment: { amount: 300, currency: 'EUR', reference: 'Invoice INV-3' },
      callback: { notificationUrl: 'https://api.test/webhooks/payoneer' },
    });
    expect(body).not.toHaveProperty('division');
  });

  it('charges under the account’s division on the live host', async () => {
    respond(200, page);

    await createPayoneerList({ ...keys, division: 'EU', mode: 'LIVE' }, request);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.live.oscato.com/api/lists');
    expect(JSON.parse(init.body).division).toBe('EU');
  });

  it.each([
    ['no payment page', { identification: { longId: 'L-1' } }],
    ['no list id', { links: { redirect: 'https://pay.test/l/1' } }],
    ['an empty body', {}],
  ])('refuses a checkout that came back with %s', async (_label, body) => {
    respond(200, body);

    await expect(createPayoneerList(keys, request)).rejects.toThrow(/without a payment page/);
  });

  it('reports Payoneer’s reason with the status, or a generic one when the answer is not JSON', async () => {
    respond(422, { resultInfo: 'Invalid country' });
    await expect(createPayoneerList(keys, request)).rejects.toThrow(
      'Payoneer: Invalid country (HTTP 422)',
    );

    respond(500, 'boom');
    await expect(createPayoneerList(keys, request)).rejects.toThrow(
      'Payoneer: request refused (HTTP 500)',
    );
  });
});

describe('fetchPayoneerCharge', () => {
  it('reads the charge back with a GET', async () => {
    respond(200, {
      identification: { transactionId: 'attempt-3' },
      status: { code: 'charged' },
      payment: { amount: 300, currency: 'EUR' },
    });

    const charge = await fetchPayoneerCharge(keys, 'C/1');

    expect(charge).toEqual({
      transactionId: 'attempt-3',
      statusCode: 'charged',
      amount: 300,
      currency: 'EUR',
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.sandbox.oscato.com/api/charges/C%2F1');
    expect(init).toMatchObject({ method: 'GET', body: undefined });
    expect(init.headers).toEqual({ Authorization: basicAuth, Accept: MEDIA_TYPE });
  });

  it('reads missing fields as empty, so nothing partial can match an attempt', async () => {
    respond(200, {});

    expect(await fetchPayoneerCharge(keys, 'C-2')).toEqual({
      transactionId: '',
      statusCode: '',
      amount: 0,
      currency: '',
    });
  });
});

describe('testPayoneerKeys', () => {
  it('accepts valid keys, which Payoneer answers with a 404 for an unknown charge', async () => {
    respond(404, { resultInfo: 'Not found' });

    await expect(testPayoneerKeys(keys)).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.sandbox.oscato.com/api/charges/credential-check',
    );
  });

  it('accepts a 200 as well', async () => {
    respond(200, {});

    await expect(testPayoneerKeys(keys)).resolves.toBeUndefined();
  });

  it('refuses keys Payoneer rejects', async () => {
    respond(401, { resultInfo: 'Unauthorized' });

    await expect(testPayoneerKeys(keys)).rejects.toThrow('Payoneer: Unauthorized (HTTP 401)');
  });

  it('passes on a network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(testPayoneerKeys(keys)).rejects.toThrow('fetch failed');
  });

  it('passes on a failure that is not even an Error', async () => {
    fetchMock.mockRejectedValue('offline');

    await expect(testPayoneerKeys(keys)).rejects.toBe('offline');
  });
});
