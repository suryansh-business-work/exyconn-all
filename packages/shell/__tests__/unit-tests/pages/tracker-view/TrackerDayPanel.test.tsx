import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { TrackerDayPanel } from '@/pages/tracker-view/TrackerDayPanel';
import { renderWithProviders } from '../../test-utils';
import { HOUR_MS, echoFormat, makeDay, makeSession, makeShot } from './fixtures';

vi.mock('react-chartjs-2', () => ({ Bar: () => <output data-testid="bar" /> }));

type PanelProps = ComponentProps<typeof TrackerDayPanel>;

function renderPanel(patch: Partial<PanelProps>) {
  const props: PanelProps = {
    day: undefined,
    loading: false,
    selected: true,
    dayLabel: 'Tuesday, 3 February',
    timezone: 'UTC',
    formatTime: echoFormat,
    formatDateTime: echoFormat,
    ...patch,
  };
  return renderWithProviders(<TrackerDayPanel {...props} />);
}

/** The value printed under a metric's label. */
const metric = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

describe('TrackerDayPanel', () => {
  it('asks for a day before anything is selected, even while one loads', () => {
    renderPanel({ selected: false, loading: true });

    expect(screen.getByText('Select a day to see the breakdown.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Loading day')).not.toBeInTheDocument();
  });

  it('shows a spinner while the selected day loads', () => {
    renderPanel({ loading: true, day: makeDay() });

    expect(screen.getByLabelText('Loading day')).toBeInTheDocument();
    expect(screen.queryByText('Tuesday, 3 February')).not.toBeInTheDocument();
  });

  it('says there was no activity when the day came back empty', () => {
    renderPanel({ day: undefined });

    expect(screen.getByText('No activity for this day.')).toBeInTheDocument();
  });

  it("totals the day's sessions into worked, idle, activity and input counts", () => {
    renderPanel({
      day: makeDay({
        sessions: [
          makeSession({ id: 'a', activeMs: 3 * HOUR_MS, idleMs: HOUR_MS / 2, keyCount: 1200 }),
          makeSession({ id: 'b', activeMs: HOUR_MS, idleMs: HOUR_MS / 2, mouseCount: 340 }),
        ],
        screenshots: [makeShot()],
      }),
    });

    expect(screen.getByRole('heading', { name: 'Tuesday, 3 February' })).toBeInTheDocument();
    expect(metric('Worked')).toBe('4h 0m');
    expect(metric('Idle')).toBe('1h 0m');
    expect(metric('Activity')).toBe('80%');
    expect(metric('Keystrokes')).toBe((1200).toLocaleString());
    expect(metric('Mouse events')).toBe('340');
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByText('Payroll revamp')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Screenshots' })).toBeInTheDocument();
    expect(screen.getByText('1 screenshot')).toBeInTheDocument();
  });

  it('reads zeros for a day with no sessions', () => {
    renderPanel({ day: makeDay() });

    expect(metric('Worked')).toBe('0m');
    expect(metric('Activity')).toBe('0%');
    expect(screen.getByText('No screenshots captured.')).toBeInTheDocument();
  });
});
