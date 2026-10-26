import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { IntegrationCallModel } from '../../../../../src/modules/tech/usage/call-log.model';
import { callLog } from '../../../../../src/modules/tech/usage/call-log.service';
import {
  metered,
  meteredFetch,
  pathAction,
} from '../../../../../src/modules/tech/usage/usage.meter';
import { techUsageResolvers } from '../../../../../src/modules/tech/tech.usage.resolvers';
import { runWithRequestInfo, setRequestActor } from '../../../../../src/lib/requestInfo';
import { AiModelPriceModel } from '../../../../../src/modules/ai/ai-price.model';
import { runAsPlatform } from '../../../../../src/lib/tenant';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';

const calls = () => runAsPlatform(() => IntegrationCallModel.find().sort({ createdAt: 1 }).lean());

/** Waits for the fire-and-forget log rows to land. */
async function landed(count: number) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if ((await calls()).length >= count) return calls();
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Only some of the ${count} calls were logged`);
}

let server: http.Server;
let base = '';
beforeAll(async () => {
  server = http.createServer((req, res) => {
    res.statusCode = req.url === '/fail' ? 500 : 200;
    res.end('{}');
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe('pathAction', () => {
  it('names a call by its kind, with record ids and query strings removed', () => {
    expect(pathAction('get', '/v1/payment_intents/pi_3Nabc123XYZ?expand=x')).toBe(
      'GET /v1/payment_intents/:id',
    );
    expect(pathAction('POST', '/v1/checkout/sessions')).toBe('POST /v1/checkout/sessions');
    expect(pathAction('GET', '/users/me/messages/18c9a7f3e2d1b0aa')).toBe(
      'GET /users/me/messages/:id',
    );
  });
});

describe('the call log', () => {
  it('records who on which portal caused each call, how it went and how long it took', async () => {
    await runWithRequestInfo(
      { actorId: '', actorEmail: '', origin: 'https://crm.exyconn.com', path: '/graphql' },
      async () => {
        setRequestActor('u1', 'sales@exyconn.com');
        await meteredFetch('STRIPE', 'GET /v1/balance', `${base}/ok`);
        await meteredFetch('STRIPE', 'GET /fail', `${base}/fail`);
      },
    );

    const rows = await landed(2);
    const ok = rows.find((row) => row.ok);
    const failed = rows.find((row) => !row.ok);
    expect(ok).toMatchObject({
      provider: 'STRIPE',
      ok: true,
      actorEmail: 'sales@exyconn.com',
      source: 'https://crm.exyconn.com',
      error: '',
      costUsd: null,
    });
    expect(ok?.durationMs).toBeGreaterThanOrEqual(0);
    expect(failed).toMatchObject({ ok: false, error: 'HTTP 500' });
  });

  it('prices AI calls from the price table and labels work no request caused', async () => {
    await runAsPlatform(() =>
      AiModelPriceModel.create({
        model: 'gpt-x',
        inputPer1kUsd: 1,
        outputPer1kUsd: 2,
        active: true,
      }),
    );
    await metered(
      'OPENAI',
      'gpt-x',
      async () => ({}),
      () => ({ inputTokens: 1000, outputTokens: 500 }),
    );
    await metered(
      'OPENAI',
      'not-a-priced-model',
      async () => ({}),
      () => ({ inputTokens: 1, outputTokens: 1 }),
    );
    await expect(
      metered('SLACK', 'chat.postMessage', () => Promise.reject(new Error('timeout'))),
    ).rejects.toThrow('timeout');

    // Logged fire-and-forget, so the rows are found by what was called, not by order.
    const rows = await landed(3);
    const byAction = (action: string) => rows.find((row) => row.action === action);
    const [priced, unpriced, failed] = ['gpt-x', 'not-a-priced-model', 'chat.postMessage'].map(
      byAction,
    );
    // 1000 tokens in at $1 per 1k, 500 out at $2 per 1k.
    expect(priced?.costUsd).toBe(2);
    expect(priced).toMatchObject({
      inputTokens: 1000,
      outputTokens: 500,
      source: 'Background job',
    });
    expect(unpriced?.costUsd).toBeNull();
    expect(failed).toMatchObject({ ok: false, error: 'timeout', costUsd: null });
  });

  it('records a network failure with its reason', async () => {
    await expect(
      meteredFetch('GODADDY', 'GET /v1/domains', 'http://127.0.0.1:1/x'),
    ).rejects.toThrow();
    const [row] = await landed(1);
    expect(row).toMatchObject({ provider: 'GODADDY', ok: false });
    expect(row.error).not.toBe('');
  });

  it('pages, searches and totals the log on the server, for Tech staff only', async () => {
    await runWithRequestInfo(
      { actorId: 'u1', actorEmail: 'sales@exyconn.com', origin: '', path: '/webhook' },
      () => meteredFetch('STRIPE', 'GET /v1/balance', `${base}/ok`),
    );
    await meteredFetch('GODADDY', 'GET /v1/domains', `${base}/fail`);
    await landed(2);

    const admin: GraphQLContext = {
      user: { id: 'a', email: 'a@x.com', roles: [ROLES.SUPER_ADMIN], organizationId: null },
      organizationId: null,
    };
    const page = await techUsageResolvers.Query.listIntegrationCallsPaged(
      null,
      { input: { page: 0, pageSize: 10, search: 'sales@' } },
      admin,
    );
    expect(page.totalCount).toBe(1);
    expect((page.rows[0] as { source: string }).source).toBe('/webhook');

    const stats = await techUsageResolvers.Query.listIntegrationCallsStats(null, null, admin);
    expect(stats.total).toBe(2);
    expect(stats.counts.find((count) => count.field === 'ok')?.buckets).toEqual(
      expect.arrayContaining([{ value: 'false', count: 1 }]),
    );
    expect(await callLog.page({ page: 0, pageSize: 10 })).toMatchObject({ totalCount: 2 });
  });
});
