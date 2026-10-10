import { runInNewContext } from 'node:vm';
import {
  WebhookDeliveryModel,
  WebhookModel,
} from '../../../../src/modules/integrations/webhook.model';
import {
  deliverDueWebhooks,
  emitWebhook,
  emitWebhookBestEffort,
  generateWebhookSecret,
} from '../../../../src/modules/integrations/webhook.dispatch';
import { readJobRuns, JOB_KEYS } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';

// safeFetch resolves the receiver's host first; these hosts are fictional, so make them public.
jest.mock('node:dns/promises', () =>
  jest
    .requireActual<typeof import('../../../fixtures/publicDns')>('../../../fixtures/publicDns')
    .publicDnsMock(),
);

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.restoreAllMocks();
});

const answer = (handler: () => Promise<Response>) => {
  globalThis.fetch = () => handler();
};

const hook = () =>
  WebhookModel.create({
    name: 'Ops',
    url: 'https://receiver.example.com/hook',
    events: ['invoice.paid'],
    secret: generateWebhookSecret(),
  });

async function eventually(check: () => boolean | Promise<boolean>) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await check()) {
      return true;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
  }
  return false;
}

describe('generateWebhookSecret', () => {
  it('mints a distinct, recognisable secret every time', () => {
    const secrets = new Set(Array.from({ length: 20 }, () => generateWebhookSecret()));

    expect(secrets.size).toBe(20);
    expect([...secrets].every((secret) => /^whsec_[\w-]{32}$/.test(secret))).toBe(true);
  });
});

describe('emitWebhookBestEffort', () => {
  it('queues the event without the caller awaiting it', async () => {
    await hook();

    emitWebhookBestEffort('invoice.paid', { id: 'inv-1' });

    expect(await eventually(async () => (await WebhookDeliveryModel.countDocuments()) === 1)).toBe(
      true,
    );
  });

  it('logs a queueing failure instead of passing it to the caller', async () => {
    await hook();
    const failure = new Error('insert refused');
    jest.spyOn(WebhookDeliveryModel, 'insertMany').mockRejectedValueOnce(failure);
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    expect(() => emitWebhookBestEffort('invoice.paid', {})).not.toThrow();

    expect(await eventually(() => error.mock.calls.length > 0)).toBe(true);
    expect(error).toHaveBeenCalledWith(failure, 'Queueing invoice.paid failed');
  });
});

describe('a delivery attempt', () => {
  it('kills a delivery whose endpoint was deleted', async () => {
    const row = await hook();
    await emitWebhook('invoice.paid', {});
    await WebhookModel.deleteOne({ _id: row._id });

    await deliverDueWebhooks();

    const delivery = await WebhookDeliveryModel.findOne().lean();
    expect(delivery?.status).toBe('DEAD');
    expect(delivery?.error).toBe('The endpoint no longer exists or is inactive');
  });

  it('records a network failure with its message and counts it against the endpoint', async () => {
    const row = await hook();
    await emitWebhook('invoice.paid', {});
    answer(() => Promise.reject(new Error('socket hang up')));

    await deliverDueWebhooks();

    const delivery = await WebhookDeliveryModel.findOne().lean();
    expect(delivery).toMatchObject({
      status: 'FAILED',
      error: 'socket hang up',
      responseStatus: null,
    });
    expect((await WebhookModel.findById(row._id).lean())?.failureCount).toBe(1);
  });

  it('records a generic reason when the failure carries no usable message', async () => {
    await hook();
    await emitWebhook('invoice.paid', {});
    // An error from another V8 context is not `instanceof Error` in this one.
    const foreign: unknown = runInNewContext('new Error("opaque")');
    answer(() => Promise.reject(foreign));

    await deliverDueWebhooks();

    expect((await WebhookDeliveryModel.findOne().lean())?.error).toBe('Delivery failed');
  });

  it('records the receiver’s status on an HTTP failure', async () => {
    await hook();
    await emitWebhook('invoice.paid', {});
    answer(() => Promise.resolve(new Response('', { status: 503 })));

    await deliverDueWebhooks();

    const delivery = await WebhookDeliveryModel.findOne().lean();
    expect(delivery).toMatchObject({ status: 'FAILED', error: 'HTTP 503', responseStatus: 503 });
  });

  it('leaves a delivery that is not yet due alone', async () => {
    await hook();
    await emitWebhook('invoice.paid', {});
    await WebhookDeliveryModel.updateMany({}, { nextAttemptAt: new Date(Date.now() + 60_000) });
    const fetched = jest.fn();
    globalThis.fetch = fetched;

    await expect(deliverDueWebhooks()).resolves.toBe(0);
    expect(fetched).not.toHaveBeenCalled();
  });
});

describe('one delivery tick', () => {
  it('attempts at most 25 deliveries and reports the count to the heartbeat', async () => {
    await hook();
    for (let index = 0; index < 26; index += 1) {
      await emitWebhook('invoice.paid', { index });
    }
    answer(() => Promise.resolve(new Response('', { status: 200 })));

    await expect(deliverDueWebhooks()).resolves.toBe(25);

    expect(await WebhookDeliveryModel.countDocuments({ status: 'DELIVERED' })).toBe(25);
    expect(await WebhookDeliveryModel.countDocuments({ status: 'PENDING' })).toBe(1);
    expect(readJobRuns().get(JOB_KEYS.webhookDelivery)?.summary).toBe('25 delivery attempt(s)');
  });
});
