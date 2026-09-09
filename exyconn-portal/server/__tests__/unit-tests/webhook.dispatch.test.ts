import { WebhookModel, WebhookDeliveryModel } from '../../src/modules/integrations/webhook.model';
import { deliverDueWebhooks, emitWebhook } from '../../src/modules/integrations/webhook.dispatch';
import {
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  verifySignature,
} from '../../src/modules/integrations/webhook.signing';

const SECRET = 'whsec_test';

async function hook(overrides: Record<string, unknown> = {}) {
  return WebhookModel.create({
    name: 'Ops',
    url: 'https://receiver.example.com/hook',
    events: ['invoice.paid'],
    secret: SECRET,
    active: true,
    ...overrides,
  });
}

/** Replaces global fetch for one test, recording what it was called with. */
function stubFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = ((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve(handler(url, init));
  }) as unknown as typeof fetch;
  return calls;
}

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('emitWebhook', () => {
  it('queues one delivery per subscribed endpoint', async () => {
    await hook();
    await hook({ name: 'Second' });
    await hook({ name: 'Uninterested', events: ['lead.created'] });

    const queued = await emitWebhook('invoice.paid', { id: 'inv-1' });

    expect(queued).toBe(2);
    expect(await WebhookDeliveryModel.countDocuments({ event: 'invoice.paid' })).toBe(2);
  });

  it('skips an inactive endpoint', async () => {
    await hook({ active: false });

    expect(await emitWebhook('invoice.paid', {})).toBe(0);
  });

  it('queues nothing when nobody subscribed', async () => {
    await hook();

    expect(await emitWebhook('deal.won', {})).toBe(0);
  });
});

describe('deliverDueWebhooks', () => {
  it('posts the payload with a signature the receiver can verify', async () => {
    await hook();
    await emitWebhook('invoice.paid', { id: 'inv-1' });
    const calls = stubFetch(() => new Response('', { status: 200 }));

    await deliverDueWebhooks();

    expect(calls).toHaveLength(1);
    const headers = calls[0].init.headers as Record<string, string>;
    const body = calls[0].init.body as string;
    // The receiver's whole contract: this must verify with the shared secret.
    expect(
      verifySignature(SECRET, headers[TIMESTAMP_HEADER], body, headers[SIGNATURE_HEADER]),
    ).toBe(true);
    expect(JSON.parse(body).data).toEqual({ id: 'inv-1' });
  });

  it('marks a 2xx delivered and clears the endpoint’s failure count', async () => {
    const row = await hook({ failureCount: 3 });
    await emitWebhook('invoice.paid', {});
    stubFetch(() => new Response('', { status: 202 }));

    await deliverDueWebhooks();

    const delivery = await WebhookDeliveryModel.findOne().lean();
    expect(delivery?.status).toBe('DELIVERED');
    expect(delivery?.responseStatus).toBe(202);
    expect((await WebhookModel.findById(row._id).lean())?.failureCount).toBe(0);
  });

  it('retries a failure later rather than giving up or hammering', async () => {
    await hook();
    await emitWebhook('invoice.paid', {});
    stubFetch(() => new Response('nope', { status: 500 }));

    const before = new Date();
    await deliverDueWebhooks();

    const delivery = await WebhookDeliveryModel.findOne().lean();
    expect(delivery?.status).toBe('FAILED');
    expect(delivery?.attempts).toBe(1);
    // Pushed into the future, so the next tick does not immediately hammer the same endpoint.
    expect(delivery?.nextAttemptAt.getTime()).toBeGreaterThan(before.getTime());
  });

  it('gives up after the retries are exhausted rather than retrying for ever', async () => {
    await hook();
    await emitWebhook('invoice.paid', {});
    stubFetch(() => new Response('', { status: 500 }));

    // Each pass is due because the test drives `now` forward past the backoff.
    for (let i = 0; i < 5; i += 1) {
      await deliverDueWebhooks(new Date(Date.now() + i * 60 * 60_000));
    }

    expect((await WebhookDeliveryModel.findOne().lean())?.status).toBe('DEAD');
  });

  it('does not deliver twice, however many times the loop runs', async () => {
    await hook();
    await emitWebhook('invoice.paid', {});
    const calls = stubFetch(() => new Response('', { status: 200 }));

    await deliverDueWebhooks();
    await deliverDueWebhooks();

    // A customer's endpoint being called twice for one event is the failure they notice.
    expect(calls).toHaveLength(1);
  });

  it('kills a delivery whose endpoint has been switched off', async () => {
    const row = await hook();
    await emitWebhook('invoice.paid', {});
    await WebhookModel.updateOne({ _id: row._id }, { active: false });
    const calls = stubFetch(() => new Response('', { status: 200 }));

    await deliverDueWebhooks();

    expect(calls).toHaveLength(0);
    expect((await WebhookDeliveryModel.findOne().lean())?.status).toBe('DEAD');
  });
});
