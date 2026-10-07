import {
  capturePaypalOrder,
  verifyPaypalWebhook,
} from '../../../../../src/modules/clienthub/payments/paypal.client';
import { freshKeys, json, token, useQueuedFetch } from './paypal.helpers';

const http = useQueuedFetch();
const { queue } = http;

describe('capturePaypalOrder', () => {
  const captured = (status: string, captureStatus: string) =>
    json({
      id: 'O',
      status,
      purchase_units: [{ payments: { captures: [{ id: 'CAP-1', status: captureStatus }] } }],
    });

  it('captures an approved order, idempotently, and reports the capture', async () => {
    queue(token(3600), json({ id: 'O 1', status: 'APPROVED' }), captured('COMPLETED', 'COMPLETED'));

    const result = await capturePaypalOrder(freshKeys(), 'O 1');

    expect(result).toEqual({ completed: true, captureId: 'CAP-1' });
    expect(http.mock().mock.calls[1][0]).toBe(
      'https://api-m.sandbox.paypal.com/v2/checkout/orders/O%201',
    );
    const [url, init] = http.mock().mock.calls[2];
    expect(url).toBe('https://api-m.sandbox.paypal.com/v2/checkout/orders/O%201/capture');
    expect(init).toMatchObject({ method: 'POST', body: '{}' });
    expect(init.headers['PayPal-Request-Id']).toBe('capture-O 1');
  });

  it('reads an order captured earlier without charging again', async () => {
    queue(token(3600), captured('COMPLETED', 'COMPLETED'));

    expect(await capturePaypalOrder(freshKeys(), 'O')).toEqual({
      completed: true,
      captureId: 'CAP-1',
    });
    expect(http.mock()).toHaveBeenCalledTimes(2);
  });

  it('reports no money moved for a pending capture or an order not yet approved', async () => {
    queue(token(3600), captured('COMPLETED', 'PENDING'));
    const keys = freshKeys();
    expect(await capturePaypalOrder(keys, 'O')).toEqual({ completed: false, captureId: 'CAP-1' });

    queue(json({ id: 'O', status: 'CREATED' }));
    expect(await capturePaypalOrder(keys, 'O')).toEqual({ completed: false, captureId: '' });
  });
});

describe('verifyPaypalWebhook', () => {
  const headers = {
    transmissionId: 't-1',
    transmissionTime: '2026-10-01T00:00:00Z',
    transmissionSig: 'sig',
    certUrl: 'https://api.paypal.com/cert',
    authAlgo: 'SHA256withRSA',
  };

  it('asks PayPal to verify the delivery against the account’s webhook id', async () => {
    queue(token(3600), json({ verification_status: 'SUCCESS' }));

    expect(await verifyPaypalWebhook(freshKeys(), 'WH-1', headers, { id: 'EV-1' })).toBe(true);

    const body = JSON.parse(http.mock().mock.calls[1][1].body);
    expect(body).toEqual({
      transmission_id: 't-1',
      transmission_time: '2026-10-01T00:00:00Z',
      transmission_sig: 'sig',
      cert_url: 'https://api.paypal.com/cert',
      auth_algo: 'SHA256withRSA',
      webhook_id: 'WH-1',
      webhook_event: { id: 'EV-1' },
    });
  });

  it('refuses anything PayPal does not call a success', async () => {
    queue(token(3600), json({ verification_status: 'FAILURE' }));

    expect(await verifyPaypalWebhook(freshKeys(), 'WH-1', {}, {})).toBe(false);
  });
});
