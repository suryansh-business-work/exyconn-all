import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { monthTarget } from '@exyconn/tracker-core';
import { TrackerTargetSummary } from '@/pages/tracker-view/TrackerTargetSummary';
import { renderWithProviders } from '../../test-utils';

const HOUR = 3_600_000;

/** Two working days already over, one of them on leave; 6h logged and 1h 30m idle on the other. */
const TARGET = monthTarget(
  {
    workHoursPerDay: 8,
    days: [
      { date: '2026-01-05', expectedMs: 8 * HOUR, offReason: null },
      { date: '2026-01-06', expectedMs: 0, offReason: 'LEAVE', offLabel: 'CL' },
      { date: '2026-01-07', expectedMs: 8 * HOUR, offReason: null },
    ],
  },
  [{ date: '2026-01-05', activeMs: 6 * HOUR, idleMs: 1.5 * HOUR }],
  '2026-01-07',
);

const CARDS = [
  'Expected this month',
  'Logged this month',
  'Deficit so far',
  'Leave this month',
  'Idle this month',
] as const;

type Props = Parameters<typeof TrackerTargetSummary>[0];

function renderSummary(overrides: Partial<Props> = {}) {
  return renderWithProviders(
    <TrackerTargetSummary
      target={TARGET}
      workHoursPerDay={8}
      workDays={[1, 2, 3, 4, 5]}
      loading={false}
      error={undefined}
      {...overrides}
    />,
  );
}

/** The fill of the deficit card's icon bubble, which carries its accent. */
const deficitFill = (container: HTMLElement) =>
  getComputedStyle(
    container.querySelector('[data-testid="TrendingDownIcon"]')?.parentElement as Element,
  ).backgroundColor;

describe('TrackerTargetSummary', () => {
  it('shows expected, logged, the deficit so far, the leave taken and the idle time', () => {
    renderSummary();

    for (const label of CARDS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('16h 0m')).toBeInTheDocument();
    expect(screen.getByText('6h 0m')).toBeInTheDocument();
    expect(screen.getByText('-2h 0m')).toBeInTheDocument();
    expect(screen.getByText('1 days (-8h 0m)')).toBeInTheDocument();
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
  });

  it('explains every card behind its own (i)', async () => {
    renderSummary();

    for (const label of CARDS) {
      expect(screen.getByRole('button', { name: `About ${label}` })).toBeInTheDocument();
    }
    await userEvent.hover(screen.getByRole('button', { name: 'About Idle this month' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      /no keyboard, mouse or system activity was detected/,
    );
  });

  it('colours the deficit apart while behind and once caught up', () => {
    const behind = renderSummary();
    const behindFill = deficitFill(behind.container);
    behind.unmount();

    const ahead = monthTarget(
      { workHoursPerDay: 8, days: [{ date: '2026-01-05', expectedMs: 8 * HOUR, offReason: null }] },
      [{ date: '2026-01-05', activeMs: 9 * HOUR }],
      '2026-01-07',
    );
    const { container } = renderSummary({ target: ahead });

    expect(screen.getByText('+1h 0m')).toBeInTheDocument();
    expect(deficitFill(container)).not.toBe(behindFill);
  });

  it('explains the expected hours with the employee own working week', () => {
    renderSummary();
    expect(
      screen.getByText(/^8h a day on Mon, Tue, Wed, Thu,? and Fri, less holidays/),
    ).toBeInTheDocument();
  });

  it('names a week that is not Monday to Friday', () => {
    renderSummary({ workHoursPerDay: 9, workDays: [0, 1, 2, 3, 4] });
    expect(screen.getByText(/^9h a day on Mon, Tue, Wed, Thu,? and Sun,/)).toBeInTheDocument();
  });

  it('leaves the hint out until both the day length and the week are known', () => {
    renderSummary({ workDays: null });
    expect(screen.queryByText(/a day on/)).toBeNull();
    renderSummary({ workHoursPerDay: null });
    expect(screen.queryByText(/a day on/)).toBeNull();
  });

  it('shows zeros before the contract has loaded', () => {
    renderSummary({ target: null, workHoursPerDay: null, workDays: null });
    expect(screen.getAllByText('0m')).toHaveLength(4);
    expect(screen.getByText('0 days (-0m)')).toBeInTheDocument();
  });

  it('shows placeholders instead of figures while loading', () => {
    const { container } = renderSummary({ loading: true });
    expect(screen.queryByText('16h 0m')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(CARDS.length);
  });

  it('puts the given actions beside the hint', () => {
    renderSummary({ actions: <button type="button">Download report</button> });
    expect(screen.getByRole('button', { name: 'Download report' })).toBeInTheDocument();
  });

  it('offers no actions of its own', () => {
    renderSummary();
    const buttons = screen
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'));
    expect(buttons).toEqual(CARDS.map((label) => `About ${label}`));
  });

  it('says the expected hours could not be loaded instead of showing figures', () => {
    renderSummary({ error: new Error('boom'), actions: <button type="button">Download</button> });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the expected hours for this month.',
    );
    expect(screen.queryByText('Expected this month')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Download' })).toBeNull();
  });
});
