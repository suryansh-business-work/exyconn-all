import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { chartPalette } from '@exyconn/ui';
import { TrackerMonthChart } from '@/pages/tracker-view/TrackerMonthChart';
import { TrackerDayCharts } from '@/pages/tracker-view/TrackerDayCharts';
import { renderWithProviders } from '../../test-utils';
import { HOUR_MS, makeBucket, makeDay, makeInterval, makeSession } from './fixtures';

interface BarProps {
  data: {
    labels: string[];
    datasets: { label: string; data: number[]; backgroundColor: string }[];
  };
}

/** chart.js needs a canvas jsdom lacks; the bar draws what it was handed as text instead. */
vi.mock('react-chartjs-2', () => ({
  Bar: ({ data }: Readonly<BarProps>) => (
    <output data-testid="bar">
      {data.labels.join(',')}
      {data.datasets.map((set) => (
        <span key={set.label} data-color={set.backgroundColor}>
          {`${set.label}=${set.data.join(',')}`}
        </span>
      ))}
    </output>
  ),
}));

const lightSeries = chartPalette('light', '#fff', '#000', '#000', '#000').series;

describe('TrackerMonthChart', () => {
  it('stacks worked, idle and off-computer hours per day in their fixed colours', () => {
    renderWithProviders(
      <TrackerMonthChart
        monthLabel="February 2026"
        buckets={[
          makeBucket({ date: '2026-02-04', activeMs: HOUR_MS, idleMs: HOUR_MS / 2 }),
          makeBucket({ date: '2026-02-03', activeMs: 2 * HOUR_MS, manualMs: HOUR_MS }),
        ]}
      />,
    );

    expect(screen.getByText('Hours this month')).toBeInTheDocument();
    expect(screen.getByText('February 2026 · each column is one day')).toBeInTheDocument();
    const bar = screen.getByTestId('bar');
    expect(bar).toHaveTextContent(/^03,04/);
    expect(within(bar).getByText('Worked=2,1')).toHaveAttribute('data-color', lightSeries[0]);
    expect(within(bar).getByText('Idle=0,0.5')).toHaveAttribute('data-color', lightSeries[3]);
    expect(within(bar).getByText('Off-computer=1,0')).toHaveAttribute('data-color', lightSeries[6]);
  });

  it('says so when the month has nothing tracked', () => {
    renderWithProviders(<TrackerMonthChart monthLabel="March 2026" buckets={[]} />);

    expect(screen.getByText('No time tracked this month.')).toBeInTheDocument();
    expect(screen.queryByTestId('bar')).not.toBeInTheDocument();
  });
});

describe('TrackerDayCharts', () => {
  it('slices one day by hour, by application and by project', () => {
    const day = makeDay({
      intervals: [
        makeInterval({ startedAt: '2026-02-03T09:00:00.000Z', activeMs: HOUR_MS / 2 }),
        makeInterval({ id: 'i2', startedAt: '2026-02-03T10:00:00.000Z', idleMs: 1.5 * HOUR_MS }),
      ],
      appUsage: [{ appName: 'Figma', durationMs: HOUR_MS }],
      sessions: [makeSession({ projectName: 'Website', activeMs: 2 * HOUR_MS })],
    });
    renderWithProviders(<TrackerDayCharts day={day} timezone="UTC" />);

    const [hours, apps, projects] = screen.getAllByTestId('bar');
    expect(hours).toHaveTextContent(/^09:00,10:00/);
    expect(within(hours).getByText('Worked=0.5,0')).toHaveAttribute('data-color', lightSeries[0]);
    expect(within(hours).getByText('Idle=0,1.5')).toHaveAttribute('data-color', lightSeries[3]);
    expect(apps).toHaveTextContent('Figma');
    expect(within(apps).getByText('In the foreground=1')).toBeInTheDocument();
    expect(within(projects).getByText('Worked=2')).toBeInTheDocument();
  });

  it('shows the empty sentence for every reading of a day not loaded', () => {
    renderWithProviders(<TrackerDayCharts day={undefined} timezone="UTC" />);

    expect(screen.getByText('No activity recorded on this day.')).toBeInTheDocument();
    expect(screen.getByText('No app usage recorded.')).toBeInTheDocument();
    expect(screen.getByText('No sessions on this day.')).toBeInTheDocument();
    expect(screen.queryByTestId('bar')).not.toBeInTheDocument();
  });
});
