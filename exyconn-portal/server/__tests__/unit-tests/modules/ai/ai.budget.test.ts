import {
  aiSpendSummary,
  assertWithinAiBudget,
  readAiSpendLimit,
} from '../../../../src/modules/ai/ai.budget';
import { AiJobModel } from '../../../../src/modules/ai/ai.model';
import { AiSpendLimitModel } from '../../../../src/modules/ai/ai-spend-limit.model';

/** Mid-month and mid-day on the process clock, so "this month" and "today" are unambiguous. */
const NOW = new Date(2026, 5, 15, 12);

const finished = (
  costUsd: number,
  ranAt: Date,
  createdById = 'user-1',
  over: Record<string, unknown> = {},
) =>
  AiJobModel.create({
    name: 'Run',
    model: 'gpt-4o-mini',
    prompt: 'x',
    status: 'SUCCEEDED',
    costUsd,
    ranAt,
    createdById,
    ...over,
  });

const limits = (monthlyUsdCap: number, perUserDailyUsdCap: number, enabled = true) =>
  AiSpendLimitModel.create({ key: 'global', monthlyUsdCap, perUserDailyUsdCap, enabled });

describe('readAiSpendLimit', () => {
  it('creates the defaults once and reads the same row after', async () => {
    const first = await readAiSpendLimit();
    const second = await readAiSpendLimit();

    expect(first).toMatchObject({ monthlyUsdCap: 0, perUserDailyUsdCap: 0, enabled: false });
    expect(String(second._id)).toBe(String(first._id));
  });
});

describe('assertWithinAiBudget', () => {
  it('treats a zero cap as no cap on that axis', async () => {
    await limits(0, 0);
    await finished(1_000, NOW);

    await expect(assertWithinAiBudget('user-1', NOW)).resolves.toBeUndefined();
  });

  it('refuses at the monthly cap exactly, and allows just below it', async () => {
    await limits(5, 0);
    await finished(4.75, new Date(2026, 5, 2));

    await expect(assertWithinAiBudget('user-1', NOW)).resolves.toBeUndefined();

    await finished(0.25, new Date(2026, 5, 3), 'someone-else');
    await expect(assertWithinAiBudget('user-1', NOW)).rejects.toThrow(
      'The monthly AI budget of $5.00 is used up — $5.00 spent this month. Raise it in Tech › Environment Variables › AI Pricing.',
    );
  });

  it('forgets last month’s spending', async () => {
    await limits(5, 0);
    await finished(50, new Date(2026, 4, 31, 23));

    await expect(assertWithinAiBudget('user-1', NOW)).resolves.toBeUndefined();
  });

  it('counts only today’s spending against the daily cap', async () => {
    await limits(0, 1);
    await finished(5, new Date(2026, 5, 14, 23));
    await finished(0.5, new Date(2026, 5, 15, 1));

    await expect(assertWithinAiBudget('user-1', NOW)).resolves.toBeUndefined();

    await finished(0.5, new Date(2026, 5, 15, 11));
    await expect(assertWithinAiBudget('user-1', NOW)).rejects.toThrow(
      'Your daily AI budget of $1.00 is used up — $1.00 spent today.',
    );
  });

  it('skips the daily cap for a run nobody is attributed to', async () => {
    await limits(0, 1);
    await finished(5, NOW, '');

    await expect(assertWithinAiBudget('', NOW)).resolves.toBeUndefined();
  });

  it('reads the clock itself when no time is given', async () => {
    await limits(0.01, 0);
    await finished(1, new Date());

    await expect(assertWithinAiBudget('user-1')).rejects.toThrow(/monthly AI budget/);
  });
});

describe('aiSpendSummary', () => {
  const from = new Date(2026, 5, 1);
  const to = new Date(2026, 5, 30);

  it('is all zeros for a window with no runs', async () => {
    await finished(3, new Date(2026, 6, 2));

    await expect(aiSpendSummary(from, to)).resolves.toEqual({
      totalUsd: 0,
      byUser: [],
      byModel: [],
    });
  });

  it('groups by person and by model, most expensive first', async () => {
    await finished(1, NOW, 'user-1', { createdByName: 'asha@exyconn.com' });
    await finished(2, NOW, 'user-1', { createdByName: 'asha@exyconn.com', model: 'gpt-4o' });
    await finished(4, NOW, 'user-2', { createdByName: '' });

    const summary = await aiSpendSummary(from, to);

    expect(summary.totalUsd).toBe(7);
    expect(summary.byUser).toEqual([
      { userId: 'user-2', name: 'Unattributed', usd: 4, jobs: 1 },
      { userId: 'user-1', name: 'asha@exyconn.com', usd: 3, jobs: 2 },
    ]);
    expect(summary.byModel).toEqual([
      { model: 'gpt-4o-mini', usd: 5, jobs: 2 },
      { model: 'gpt-4o', usd: 2, jobs: 1 },
    ]);
  });

  it('labels a run with no recorded person or model as empty', async () => {
    await AiJobModel.collection.insertOne({ name: 'Legacy', prompt: 'x', costUsd: 1, ranAt: NOW });

    const summary = await aiSpendSummary(from, to);

    expect(summary.byUser).toEqual([{ userId: '', name: 'Unattributed', usd: 1, jobs: 1 }]);
    expect(summary.byModel).toEqual([{ model: '', usd: 1, jobs: 1 }]);
  });
});
