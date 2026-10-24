import { billingKeys } from '../../../../src/modules/tech/billing/billing-keys.service';
import { BillingKeyModel } from '../../../../src/modules/tech/billing/billing-key.model';
import { fetchOpenAiCosts } from '../../../../src/modules/tech/billing/openai.costs';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { open } from '../../../../src/utils/secretBox';
import { codeOf } from '../codeOf';

const KEY = `sk-admin-${Date.now()}`;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const DAY = 24 * 60 * 60;
const costs = (buckets: Array<{ start: number; values: number[] }>) =>
  json({
    data: buckets.map((bucket) => ({
      start_time: bucket.start,
      results: bucket.values.map((value) => ({ amount: { value, currency: 'usd' } })),
    })),
  });

const input = (overrides: Record<string, unknown> = {}) => ({
  provider: 'OPENAI' as const,
  label: 'Billing',
  key: KEY,
  isActive: true,
  ...overrides,
});

afterEach(() => jest.restoreAllMocks());

describe('OpenAI costs', () => {
  it('asks for whole days with the admin key and sums each day', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      costs([
        { start: 1_761_177_600, values: [1.5, 0.25] },
        { start: 1_761_177_600 + DAY, values: [] },
      ]),
    );
    fetchMock.mockResolvedValueOnce(
      costs([
        { start: 1_761_177_600, values: [1.5, 0.25] },
        { start: 1_761_177_600 + DAY, values: [] },
      ]),
    );
    const days = await fetchOpenAiCosts(KEY, 2, new Date('2026-10-24T12:00:00Z'));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('bucket_width=1d&limit=2');
    expect(Number(new URL(url).searchParams.get('start_time')) % DAY).toBe(0);
    expect(init.headers).toEqual({ Authorization: `Bearer ${KEY}` });
    expect(days).toEqual([
      { day: '2025-10-23', amountUsd: 1.75 },
      { day: '2025-10-24', amountUsd: 0 },
    ]);
  });

  it('passes on what OpenAI refuses, and reads an empty answer as no days', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('bad key', { status: 401 }))
      .mockResolvedValueOnce(json({}));
    await expect(fetchOpenAiCosts(KEY, 1)).rejects.toThrow('OpenAI costs failed (401): bad key');
    await expect(fetchOpenAiCosts(KEY, 1)).resolves.toEqual([]);
  });
});

describe('billing keys', () => {
  it('stores the key sealed, with its hint, and one active key per provider', async () => {
    const first = await billingKeys.create(input());
    const second = await billingKeys.create(input({ label: 'New' }));
    const stored = await runAsPlatform(() => BillingKeyModel.findById(first._id).lean());
    expect(stored?.key).not.toBe(KEY);
    expect(open(stored?.key ?? '')).toBe(KEY);
    expect(stored?.keyHint).toBe(KEY.slice(-4));
    expect(stored?.isActive).toBe(false);
    expect((await billingKeys.list()).map((row) => row.label)).toEqual(['New', 'Billing']);
    expect(second.isActive).toBe(true);
  });

  it('needs a key to add one, keeps it on a blank edit, and replaces it on a new one', async () => {
    expect(await codeOf(billingKeys.create(input({ key: ' ' })))).toBe('BAD_USER_INPUT');
    const created = await billingKeys.create(input({ isActive: false }));
    const id = String(created._id);
    await billingKeys.update(id, input({ key: '', label: 'Renamed', isActive: false }));
    let stored = await runAsPlatform(() => BillingKeyModel.findById(id).lean());
    expect([stored?.label, open(stored?.key ?? '')]).toEqual(['Renamed', KEY]);
    await billingKeys.update(id, input({ key: 'sk-admin-rotated-key' }));
    stored = await runAsPlatform(() => BillingKeyModel.findById(id).lean());
    expect([open(stored?.key ?? ''), stored?.isActive]).toEqual(['sk-admin-rotated-key', true]);
  });

  it('answers a missing key as not found, and deletes', async () => {
    const missing = '0123456789abcdef01234567';
    expect(await codeOf(billingKeys.update(missing, input()))).toBe('NOT_FOUND');
    expect(await codeOf(billingKeys.remove(missing))).toBe('NOT_FOUND');
    expect(await codeOf(billingKeys.test(missing))).toBe('NOT_FOUND');
    const created = await billingKeys.create(input());
    await expect(billingKeys.remove(String(created._id))).resolves.toBe(true);
  });

  it('tests a key by reading two days, and reads the bill with the active key', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => costs([{ start: 1_761_177_600, values: [2] }]));
    expect(await billingKeys.bill('OPENAI', 7)).toBeNull();
    const created = await billingKeys.create(input());
    await expect(billingKeys.test(String(created._id))).resolves.toBe(
      'The key works: 1 days of costs read, $2.00 in all.',
    );
    await expect(billingKeys.bill('OPENAI', 7)).resolves.toEqual({
      provider: 'OPENAI',
      totalUsd: 2,
      days: [{ day: '2025-10-23', amountUsd: 2 }],
    });
    expect(fetchMock.mock.calls[1][0]).toContain('limit=7');
  });

  it.each([0, 181, 2.5])('refuses a bill for %s days', async (days) => {
    expect(await codeOf(billingKeys.bill('OPENAI', days))).toBe('BAD_USER_INPUT');
  });
});
