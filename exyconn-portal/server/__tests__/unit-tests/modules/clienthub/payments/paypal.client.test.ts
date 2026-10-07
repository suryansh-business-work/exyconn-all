import {
  createPaypalOrder,
  testPaypalKeys,
} from '../../../../../src/modules/clienthub/payments/paypal.client';
import { TOKEN_URL, freshKeys, json, token, useQueuedFetch } from './paypal.helpers';

const request = {
  amount: 120.5,
  currency: 'usd',
  description: 'Invoice INV-7',
  customerEmail: 'dana@acme.test',
  attemptId: 'attempt-1',
  successUrl: 'https://hub.test/payments/return?attempt=attempt-1',
  cancelUrl: 'https://hub.test/invoices',
};

const http = useQueuedFetch();
const { queue } = http;

describe('createPaypalOrder', () => {
  it('creates an idempotent order for the balance and returns the payer’s approval page', async () => {
    const keys = freshKeys();
    queue(
      token(3600),
      json({ id: 'ORDER-1', links: [{ rel: 'payer-action', href: 'https://pp/approve' }] }),
    );

    const order = await createPaypalOrder(keys, request);

    expect(order).toEqual({ externalId: 'ORDER-1', url: 'https://pp/approve' });
    expect(http.mock().mock.calls[0][0]).toBe(TOKEN_URL);
    const [url, init] = http.mock().mock.calls[1];
    expect(url).toBe('https://api-m.sandbox.paypal.com/v2/checkout/orders');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer access-1',
      'PayPal-Request-Id': 'order-attempt-1',
    });
    const body = JSON.parse(init.body);
    expect(body.purchase_units[0]).toMatchObject({
      reference_id: 'attempt-1',
      amount: { currency_code: 'USD', value: '120.50' },
    });
    expect(body.payment_source.paypal.email_address).toBe('dana@acme.test');
  });

  it('reuses a live token and accepts the older "approve" link', async () => {
    const keys = freshKeys('LIVE');
    const order = json({ id: 'ORDER-2', links: [{ rel: 'approve', href: 'https://pp/ok' }] });
    queue(token(3600), json({ id: 'ORDER-X', links: [{ rel: 'approve', href: 'x' }] }), order);

    await createPaypalOrder(keys, request);
    const second = await createPaypalOrder(keys, { ...request, currency: 'JPY', amount: 1500 });

    expect(second.url).toBe('https://pp/ok');
    expect(http.mock()).toHaveBeenCalledTimes(3);
    expect(http.mock().mock.calls[0][0]).toBe('https://api-m.paypal.com/v1/oauth2/token');
    expect(JSON.parse(http.mock().mock.calls[2][1].body).purchase_units[0].amount.value).toBe(
      '1500',
    );
  });

  it('refuses an order that came back without an approval link', async () => {
    queue(token(3600), json({ id: 'ORDER-3', links: [{ rel: 'self', href: 'x' }] }));

    await expect(createPaypalOrder(freshKeys(), request)).rejects.toThrow(
      /without an approval link/,
    );
  });

  it('refuses an order with no links at all', async () => {
    queue(token(3600), json({ id: 'ORDER-4' }));

    await expect(createPaypalOrder(freshKeys(), request)).rejects.toThrow(
      /without an approval link/,
    );
  });

  it('writes amounts with two decimals when the runtime reports none for the currency', async () => {
    jest
      .spyOn(Intl.NumberFormat.prototype, 'resolvedOptions')
      .mockReturnValue({} as Intl.ResolvedNumberFormatOptions);
    queue(token(3600), json({ id: 'O', links: [{ rel: 'approve', href: 'x' }] }));

    await createPaypalOrder(freshKeys(), { ...request, amount: 7 });

    expect(JSON.parse(http.mock().mock.calls[1][1].body).purchase_units[0].amount.value).toBe(
      '7.00',
    );
  });

  it.each([
    [
      'the first issue PayPal lists',
      { details: [{ issue: 'CURRENCY_NOT_SUPPORTED' }] },
      'PayPal: CURRENCY_NOT_SUPPORTED',
    ],
    [
      'PayPal’s message when no issue is listed',
      { message: 'Request is not well-formed' },
      'PayPal: Request is not well-formed',
    ],
    ['the HTTP status otherwise', { details: [{}] }, 'PayPal: HTTP 422'],
  ])('reports %s', async (_label, body, message) => {
    queue(token(3600), json(body, 422));

    await expect(createPaypalOrder(freshKeys(), request)).rejects.toThrow(message);
  });
});

describe('access tokens', () => {
  it('refuses credentials PayPal will not issue a token for', async () => {
    queue(json({ error_description: 'Client Authentication failed' }, 401));

    await expect(testPaypalKeys(freshKeys())).rejects.toThrow(
      'PayPal: Client Authentication failed',
    );
  });

  it('refuses a token answer that is not JSON or carries no token', async () => {
    queue(new Response('oops', { status: 500 }), json({}));

    await expect(testPaypalKeys(freshKeys())).rejects.toThrow('PayPal: HTTP 500');
    await expect(testPaypalKeys(freshKeys())).rejects.toThrow('PayPal: HTTP 200');
  });

  it('asks again a minute before the token expires, assuming five minutes when unsaid', async () => {
    const keys = freshKeys();
    const start = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(start);
    const order = () => json({ id: 'O', links: [{ rel: 'approve', href: 'x' }] });
    queue(token(), order(), order(), token(120), order());

    await createPaypalOrder(keys, request);
    clock.mockReturnValue(start + 239_000);
    await createPaypalOrder(keys, request);
    clock.mockReturnValue(start + 241_000);
    await createPaypalOrder(keys, request);

    const tokenCalls = http.mock().mock.calls.filter(([url]) => url === TOKEN_URL);
    expect(tokenCalls).toHaveLength(2);
  });

  it('testPaypalKeys always asks PayPal, ignoring a cached token', async () => {
    const keys = freshKeys();
    queue(token(3600), token(3600));

    await testPaypalKeys(keys);
    await testPaypalKeys(keys);

    expect(http.mock()).toHaveBeenCalledTimes(2);
  });
});
