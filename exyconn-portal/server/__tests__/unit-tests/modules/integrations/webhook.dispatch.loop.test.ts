import { OrganizationModel } from '../../../../src/modules/organizations';
import {
  WebhookDeliveryModel,
  WebhookModel,
} from '../../../../src/modules/integrations/webhook.model';
import {
  emitWebhook,
  generateWebhookSecret,
  startWebhookDelivery,
} from '../../../../src/modules/integrations/webhook.dispatch';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { asArg } from '../../../mockAs';

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

/** Captures the interval instead of starting a real one, so the loop never outlives a test. */
function captureInterval() {
  const unref = jest.fn();
  const interval = jest
    .spyOn(globalThis, 'setInterval')
    .mockImplementation(asArg(() => ({ unref })));
  return { interval, unref };
}

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

/** A company with an endpoint and one queued event, as a running install would hold. */
async function queuedForCompany() {
  const company = await runAsPlatform(() =>
    OrganizationModel.create({ name: 'Acme', slug: 'acme', currency: 'USD' }),
  );
  await runForOrganization(String(company._id), async () => {
    await WebhookModel.create({
      name: 'Ops',
      url: 'https://receiver.example.com/hook',
      events: ['invoice.paid'],
      secret: generateWebhookSecret(),
    });
    await emitWebhook('invoice.paid', { id: 'inv-1' });
  });
}

const deliveredCount = () =>
  runAsPlatform(() => WebhookDeliveryModel.countDocuments({ status: 'DELIVERED' }));

describe('startWebhookDelivery', () => {
  it('delivers for every company at once, then every minute without holding the process', async () => {
    await queuedForCompany();
    globalThis.fetch = (() =>
      Promise.resolve(new Response('', { status: 200 }))) as unknown as typeof fetch;
    const { interval, unref } = captureInterval();
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);

    startWebhookDelivery();

    expect(interval).toHaveBeenCalledWith(expect.any(Function), 60_000);
    expect(unref).toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith('Webhook delivery started');
    expect(await eventually(async () => (await deliveredCount()) === 1)).toBe(true);
  });

  it('logs a tick that could not list the companies, and the next tick still delivers', async () => {
    const { interval } = captureInterval();
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const failure = new Error('primary stepped down');
    jest.spyOn(OrganizationModel, 'find').mockImplementationOnce(() => {
      throw failure;
    });
    globalThis.fetch = (() =>
      Promise.resolve(new Response('', { status: 200 }))) as unknown as typeof fetch;

    expect(() => startWebhookDelivery()).not.toThrow();

    expect(await eventually(() => error.mock.calls.length > 0)).toBe(true);
    expect(error).toHaveBeenCalledWith(failure, 'Webhook delivery tick failed');

    // The failed first tick is over; the minute timer's tick is the one that delivers now.
    await queuedForCompany();
    const scheduled = interval.mock.calls.find(([, ms]) => ms === 60_000);
    const tick = scheduled?.[0] as () => void;
    tick();

    expect(await eventually(async () => (await deliveredCount()) === 1)).toBe(true);
  });
});

describe('the registered background job', () => {
  it('takes one delivery pass when run on demand', async () => {
    const job = findBackgroundJob(JOB_KEYS.webhookDelivery);

    expect(job?.label).toBe('Webhook delivery');
    await expect(job?.runOnce()).resolves.toBe(0);
  });
});
