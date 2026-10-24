import {
  getFxRates,
  refreshFxRates,
  startFxRates,
} from '../../../../src/modules/tech/fx/fx.service';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

afterEach(() => jest.restoreAllMocks());

describe('exchange rates', () => {
  it('reads as US dollars alone before the first refresh', async () => {
    await expect(getFxRates()).resolves.toEqual({
      base: 'USD',
      date: '',
      rates: [{ currency: 'USD', rate: 1 }],
    });
  });

  it('keeps the well-formed rates of the day, sorted, with the dollar itself', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        json({ date: '2026-10-23', rates: { INR: 83.1, EUR: 0.92, bad: 3, GBP: -1, JPY: 'x' } }),
      );
    await expect(refreshFxRates()).resolves.toBe('2026-10-23');
    await expect(getFxRates()).resolves.toEqual({
      base: 'USD',
      date: '2026-10-23',
      rates: [
        { currency: 'EUR', rate: 0.92 },
        { currency: 'INR', rate: 83.1 },
        { currency: 'USD', rate: 1 },
      ],
    });
    expect(readJobRuns().get(JOB_KEYS.fxRates)?.summary).toBe('Rates for 2026-10-23: 3 currencies');
  });

  it.each([
    ['an error answer', json({}, 503), 'Exchange rates request failed (503)'],
    [
      'no rates',
      json({ date: '2026-10-23', rates: null }),
      'The exchange rates answer had no rates',
    ],
    ['no date', json({ rates: { EUR: 1 } }), 'The exchange rates answer had no rates'],
  ])('refuses %s and keeps the last rates', async (_name, answer, message) => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(answer);
    await expect(refreshFxRates()).rejects.toThrow(message);
  });

  it('refreshes from boot, every six hours, logging a failed refresh, and on request', async () => {
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const unref = jest.fn();
    const every = jest
      .spyOn(globalThis, 'setInterval')
      .mockReturnValue({ unref } as unknown as ReturnType<typeof setInterval>);
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    startFxRates();
    await new Promise((resolve) => setImmediate(resolve));

    expect(every).toHaveBeenCalledWith(expect.any(Function), 6 * 60 * 60 * 1000);
    expect(unref).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'Could not refresh exchange rates; the last ones stay in use',
    );
    await expect(findBackgroundJob(JOB_KEYS.fxRates)?.runOnce()).rejects.toThrow('offline');
  });
});
