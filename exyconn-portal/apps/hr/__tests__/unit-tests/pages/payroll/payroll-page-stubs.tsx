import { vi } from 'vitest';

interface RunControlProps {
  month: number;
  year: number;
  period: string;
  onRan: () => Promise<unknown>;
}

/** Stands in for the run control (tested on its own): shows the period and reports a run. */
export function RunControlStub({ month, year, period, onRan }: Readonly<RunControlProps>) {
  return (
    <button
      type="button"
      onClick={() => {
        onRan().catch(() => undefined);
      }}
    >
      {`Run ${period} (${month}/${year})`}
    </button>
  );
}

interface SlipsTableProps {
  month: number;
  year: number;
  refreshKey: string;
}

/** Stands in for the slips table (tested on its own): shows what it was asked to list. */
export function SlipsTableStub({ month, year, refreshKey }: Readonly<SlipsTableProps>) {
  return <p>{`Slips for ${month}/${year} at ${refreshKey}`}</p>;
}

/** A month with five slips, two of them paid. */
export const SUMMARY = {
  month: 10,
  year: 2026,
  slips: 5,
  paid: 2,
  totalGross: 250000,
  totalDeductions: 12500,
  totalNet: 237500,
};

/** Pins "now" to mid-October 2026 without faking the timers the UI waits on. */
export function freezeOctober2026(): void {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 15, 12));
}
