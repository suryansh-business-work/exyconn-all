import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { TrackingPanel } from '../../../../../src/pages/meetings/tracking/TrackingPanel';
import { renderWithProviders } from '../../../test-utils';
import { chooseOption, optionsOf } from '../../../form-helpers';
import { answered, pending } from '../../../fixtures';
import { meetingTypeRow, trackingData } from '../meetings-fixtures';

const gql = vi.hoisted(() => ({ tracking: vi.fn(), trackingArgs: vi.fn(), types: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMeetingTrackingQuery: (options: unknown) => {
    gql.trackingArgs(options);
    return gql.tracking();
  },
  useMeetingTypesQuery: () => gql.types(),
}));

interface Stat {
  label: string;
  value: string;
  series?: number[];
}

// The real tiles draw sparklines with chart.js, which needs a canvas jsdom lacks.
vi.mock('@exyconn/shell/components/dashboard/StatRow', () => ({
  StatRow: ({ stats, loading }: Readonly<{ stats: Stat[]; loading: boolean }>) => (
    <ul aria-label="stats" aria-busy={loading}>
      {stats.map((stat) => (
        <li key={stat.label}>
          {stat.label}: {stat.value}
          {stat.series ? ` [${stat.series.join(',')}]` : ''}
        </li>
      ))}
    </ul>
  ),
}));

/** The stat tiles, as "label: value [series]" lines. */
function statLines() {
  return within(screen.getByRole('list', { name: 'stats' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);
}

describe('TrackingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.tracking.mockReturnValue(answered({ meetingTracking: trackingData() }));
    gql.types.mockReturnValue(answered({ meetingTypes: [meetingTypeRow()] }));
  });

  it('counts views, bookings, the share booked and the countries', () => {
    renderWithProviders(<TrackingPanel />);

    expect(statLines()).toEqual([
      'Link views: 8 [5,3]',
      'Bookings: 2 [1,1]',
      'Booked after viewing: 25%',
      'Countries: 2',
    ]);
    expect(screen.getByRole('list', { name: 'stats' })).toHaveAttribute('aria-busy', 'false');
  });

  it('names meetings by their title once the types load', () => {
    renderWithProviders(<TrackingPanel />);

    expect(screen.getAllByText('Intro call').length).toBeGreaterThan(0);
  });

  it('shows meetings by their link part while the types are unknown', () => {
    gql.types.mockReturnValue(pending());
    renderWithProviders(<TrackingPanel />);

    expect(screen.getAllByText('intro-call').length).toBeGreaterThan(0);
  });

  it('looks at the last 30 days first and reloads for the period picked', async () => {
    renderWithProviders(<TrackingPanel />);
    expect(gql.trackingArgs).toHaveBeenLastCalledWith({ variables: { days: 30 } });

    expect(await optionsOf('Period')).toEqual([
      'Last 7 days',
      'Last 30 days',
      'Last 90 days',
      'Last 365 days',
    ]);
    await chooseOption('Period', 'Last 90 days');

    expect(gql.trackingArgs).toHaveBeenLastCalledWith({ variables: { days: 90 } });
  });

  it('reads zero everywhere and a dash for the share before anything loads', () => {
    gql.tracking.mockReturnValue(pending());
    renderWithProviders(<TrackingPanel />);

    expect(statLines()).toEqual([
      'Link views: 0',
      'Bookings: 0',
      'Booked after viewing: –',
      'Countries: 0',
    ]);
    expect(screen.getByRole('list', { name: 'stats' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Could not load the tracking.')).not.toBeInTheDocument();
  });

  it('says the tracking could not load', () => {
    gql.tracking.mockReturnValue({ data: undefined, loading: false, error: 'down' });
    renderWithProviders(<TrackingPanel />);

    expect(screen.getByText('Could not load the tracking.')).toBeInTheDocument();
    expect(statLines()[0]).toBe('Link views: 0');
    expect(screen.getByRole('list', { name: 'stats' })).toHaveAttribute('aria-busy', 'false');
  });
});
