import { formatMonthLabel, type PeriodLength } from '@exyconn/tracker-core';

/**
 * Stand-ins for My Report's panels, each showing the props the screen handed it and offering
 * the callbacks it was given as plain buttons — so the screen test is about the screen's own
 * wiring (tabs, the month, the selected day), not about the panels, which have their own tests.
 */

export function OverviewStub({
  length,
  onLengthChange,
}: Readonly<{ length: PeriodLength; onLengthChange: (length: PeriodLength) => void }>) {
  return (
    <button type="button" onClick={() => onLengthChange(30)}>
      {`Overview of ${length} days`}
    </button>
  );
}

export function CalendarStub({
  onSelect,
  onMonthChange,
}: Readonly<{ onSelect: (date: Date) => void; onMonthChange: (month: Date) => void }>) {
  return (
    <div>
      <button type="button" onClick={() => onSelect(new Date(2025, 11, 25))}>
        Pick Christmas
      </button>
      <button type="button" onClick={() => onMonthChange(new Date(2025, 10, 1))}>
        Show November
      </button>
    </div>
  );
}

export function DayPanelStub({ date }: Readonly<{ date: Date }>) {
  return <div data-testid="day-panel">{date.toDateString()}</div>;
}

export function MonthStub({
  month,
  canGoForward,
  onChange,
}: Readonly<{ month: Date; canGoForward: boolean; onChange: (month: Date) => void }>) {
  const reach = canGoForward ? 'can go forward' : 'latest';
  return (
    <div>
      <span data-testid="month">{`${formatMonthLabel(month)}, ${reach}`}</span>
      <button type="button" onClick={() => onChange(new Date(2026, 0, 1))}>
        Show January
      </button>
    </div>
  );
}
