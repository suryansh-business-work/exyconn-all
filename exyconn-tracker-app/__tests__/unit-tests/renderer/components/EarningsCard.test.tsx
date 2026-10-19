// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TrackerEarnings } from '@shared/types';
import EarningsCard from '../../../../src/renderer/components/EarningsCard';
import {
  deferred,
  installTracker,
  overrideTracker,
  render,
  rerender,
  settle,
  trackerState,
  unmountAll,
} from '../../test-utils';

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

const DAY_MS = 86_400_000;

function earnings(overrides: Partial<TrackerEarnings> = {}): TrackerEarnings {
  return {
    payType: 'HOURLY',
    rate: 20,
    currency: 'USD',
    trackedMs: 5_400_000,
    amount: 30,
    ...overrides,
  };
}

type Read = (from: string, to: string) => Promise<TrackerEarnings>;

/** Today's read and the month's are told apart by how long a range they ask for. */
function answering(today: Read, month: Read): Read {
  return (from, to) =>
    Date.parse(to) - Date.parse(from) > DAY_MS ? month(from, to) : today(from, to);
}

async function show(getEarnings: Read, lastSyncAt: string | null = null): Promise<void> {
  installTracker(trackerState('idle'));
  overrideTracker({ getEarnings });
  await render(<EarningsCard timezone="UTC" lastSyncAt={lastSyncAt} />);
  await settle();
}

const text = (): string => document.body.textContent ?? '';

describe('EarningsCard', () => {
  it('shows today’s and the month’s pay, with the hours and rate behind each', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-14T10:00:00.000Z'));
    const getEarnings = vi.fn(
      answering(
        () => Promise.resolve(earnings()),
        () => Promise.resolve(earnings({ trackedMs: 36_000_000, amount: 200 })),
      ),
    );
    await show(getEarnings);
    vi.useRealTimers();

    expect(document.querySelector('h2')?.textContent).toBe('Earnings');
    expect(text()).toContain('Tracked hours × your hourly rate.');
    expect(text()).toContain('Today$30.001.5 h × $20.00 per hour');
    expect(text()).toContain('This month$200.0010 h × $20.00 per hour');
    expect(getEarnings).toHaveBeenCalledWith(
      '2026-09-14T00:00:00.000Z',
      '2026-09-15T00:00:00.000Z',
    );
    expect(getEarnings).toHaveBeenCalledWith(
      '2026-09-01T00:00:00.000Z',
      '2026-10-01T00:00:00.000Z',
    );
  });

  it('does not appear for pay that is not by the hour', async () => {
    await show(() => Promise.resolve(earnings({ payType: 'FIXED', amount: null })));
    expect(text()).toBe('');
  });

  it('does not appear when the month cannot be read, so salaried staff see no error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await show(() => Promise.reject(new Error('offline')));
    expect(text()).toBe('');
  });

  it('shows a dash for today while the month is already in', async () => {
    const today = deferred<TrackerEarnings>();
    await show(
      answering(
        () => today.promise,
        () => Promise.resolve(earnings({ amount: 200 })),
      ),
    );
    expect(text()).toContain('Today—This month$200.00');
  });

  it('keeps the last figures and warns when a re-read fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let fail = false;
    await show(() => (fail ? Promise.reject(new Error('offline')) : Promise.resolve(earnings())));
    fail = true;

    await rerender(<EarningsCard timezone="UTC" lastSyncAt="2026-09-14T11:00:00.000Z" />);
    await settle();

    expect(document.querySelector('.MuiAlert-colorWarning')?.textContent).toBe(
      'Could not load your earnings.',
    );
    expect(text()).toContain('This month$30.00');
    expect(error).toHaveBeenCalledWith('Failed to load this month’s earnings', expect.any(Error));
  });
});
