import { IntegrationUsageModel } from '../../../../../src/modules/tech/usage/usage.model';
import {
  meterCall,
  metered,
  meteredFetch,
  usageDay,
} from '../../../../../src/modules/tech/usage/usage.meter';
import { integrationUsage, windowDays } from '../../../../../src/modules/tech/usage/usage.service';
import { AiModelPriceModel } from '../../../../../src/modules/ai/ai-price.model';
import { runAsPlatform } from '../../../../../src/lib/tenant';
import { logger } from '../../../../../src/utils/logger';
import { codeOf } from '../../codeOf';

const rows = () => runAsPlatform(() => IntegrationUsageModel.find().lean());

/** Waits for the fire-and-forget counts to land: until the stored calls add up to `calls`. */
async function landed(calls: number): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const stored = (await rows()).reduce((sum, row) => sum + row.calls, 0);
    if (stored >= calls) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Only some of the ${calls} counted calls landed`);
}

afterEach(() => jest.restoreAllMocks());

describe('counting integration calls', () => {
  it('adds every call to its day, failures and tokens included', async () => {
    meterCall({
      provider: 'OPENAI',
      action: 'gpt-4o-mini',
      ok: true,
      inputTokens: 10,
      outputTokens: 5,
    });
    await landed(1);
    meterCall({ provider: 'OPENAI', action: ' gpt-4o-mini ', ok: false });
    await landed(2);
    const [row] = await rows();
    expect(row).toMatchObject({
      provider: 'OPENAI',
      action: 'gpt-4o-mini',
      day: usageDay(new Date()),
      calls: 2,
      failures: 1,
      inputTokens: 10,
      outputTokens: 5,
    });
  });

  it('names a nameless call, and never throws when counting fails', async () => {
    meterCall({ provider: 'SLACK', action: '  ', ok: true });
    await landed(1);
    expect((await rows())[0].action).toBe('call');
    jest.spyOn(IntegrationUsageModel, 'updateOne').mockImplementationOnce(() => {
      throw new Error('database down');
    });
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    expect(() => meterCall({ provider: 'SLACK', action: 'x', ok: true })).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'SLACK' }),
      'Could not count an integration call',
    );
  });

  it('counts a wrapped call either way and passes its answer or error on', async () => {
    await expect(
      metered(
        'OPENAI',
        'm',
        async () => ({ used: 7 }),
        (r) => ({ inputTokens: r.used, outputTokens: 1 }),
      ),
    ).resolves.toEqual({ used: 7 });
    await expect(
      metered('PEXELS', '/search', () => Promise.reject(new Error('no'))),
    ).rejects.toThrow('no');
    await expect(metered('GITHUB', 'GET /x', async () => 1)).resolves.toBe(1);
    await landed(3);
    const byProvider = Object.fromEntries((await rows()).map((r) => [r.provider, r]));
    expect(byProvider.OPENAI).toMatchObject({ calls: 1, inputTokens: 7, outputTokens: 1 });
    expect(byProvider.PEXELS).toMatchObject({ calls: 1, failures: 1 });
    expect(byProvider.GITHUB).toMatchObject({ calls: 1, failures: 0 });
  });

  it('counts an HTTP error answer as a failure, and a network error too', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('nope', { status: 500 }))
      .mockRejectedValueOnce(new Error('offline'));
    const answer = await meteredFetch('FIRECRAWL', 'scrape', 'https://f.test');
    expect(answer.status).toBe(500);
    await expect(meteredFetch('FIRECRAWL', 'scrape', 'https://f.test')).rejects.toThrow('offline');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await landed(2);
    expect((await rows())[0]).toMatchObject({ calls: 2, failures: 2 });
  });
});

describe('reading usage back', () => {
  // A fixed day long past, so no call counted by another test lands in the window.
  const today = new Date('2025-06-10T12:00:00Z');

  it('has a day for every day of the window, oldest first', () => {
    expect(windowDays(3, today)).toEqual(['2025-06-08', '2025-06-09', '2025-06-10']);
  });

  it('lists every integration, priced from the AI price table, quiet ones as zeros', async () => {
    await runAsPlatform(async () => {
      await AiModelPriceModel.create({
        model: 'gpt-x',
        inputPer1kUsd: 1,
        outputPer1kUsd: 2,
        active: true,
      });
      await IntegrationUsageModel.create([
        {
          provider: 'OPENAI',
          action: 'gpt-x',
          day: '2025-06-10',
          calls: 2,
          inputTokens: 1000,
          outputTokens: 500,
        },
        { provider: 'OPENAI', action: 'no-price', day: '2025-06-09', calls: 1, inputTokens: 1000 },
        { provider: 'SLACK', action: 'chat.postMessage', day: '2025-06-10', calls: 3, failures: 1 },
        { provider: 'SLACK', action: 'old', day: '2025-01-01', calls: 9 },
      ]);
    });

    const usage = await integrationUsage(2, today);

    expect(usage.map((u) => u.provider)).toEqual([
      'OPENAI',
      'SMTP',
      'IMAGEKIT',
      'SLACK',
      'GITHUB',
      'PEXELS',
      'FIRECRAWL',
      'GOOGLE_MAPS',
    ]);
    const openai = usage[0];
    expect(openai).toMatchObject({ calls: 3, costUsd: 2 });
    expect(openai.days).toEqual([
      expect.objectContaining({ day: '2025-06-09', calls: 1, costUsd: 0 }),
      expect.objectContaining({ day: '2025-06-10', calls: 2, costUsd: 2 }),
    ]);
    expect(openai.actions.map((a) => a.action)).toEqual(['gpt-x', 'no-price']);
    expect(usage[3]).toMatchObject({ calls: 3, failures: 1, costUsd: 0 });
    expect(usage[1]).toMatchObject({ calls: 0, actions: [] });
  });

  it.each([0, 367, 1.5])('refuses a window of %s days', async (days) => {
    expect(await codeOf(integrationUsage(days))).toBe('BAD_USER_INPUT');
  });
});
