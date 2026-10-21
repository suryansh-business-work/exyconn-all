import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  TrackerLocationKind,
  TrackerLocationSource,
  useEmployeeLocationsBetweenQuery,
  useGoogleMapsClientConfigQuery,
} from '@exyconn/shell/graphql/generated';
import { TrackerMonthLocations } from '../../../../../src/pages/tracker/month-locations';
import { renderWithProviders } from '../../../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useEmployeeLocationsBetweenQuery: vi.fn(),
  useGoogleMapsClientConfigQuery: vi.fn(),
}));

// The map itself is the shell's; here it only says how it was asked to draw the pins.
vi.mock('@exyconn/shell/pages/UserDetails/employee-locations/LocationsMap', () => ({
  default: ({ connect, pins }: Readonly<{ connect: boolean; pins: readonly unknown[] }>) => (
    <p>{`map of ${pins.length} pins, ${connect ? 'joined' : 'apart'}`}</p>
  ),
}));

const pin = (id: string, kind: TrackerLocationKind, capturedAt: string) => ({
  __typename: 'TrackerLocation' as const,
  id,
  lat: 12.97,
  lng: 77.59,
  accuracyM: 20,
  source: TrackerLocationSource.Gps,
  kind,
  capturedAt,
});

function answer(result: Partial<ReturnType<typeof useEmployeeLocationsBetweenQuery>>) {
  vi.mocked(useEmployeeLocationsBetweenQuery).mockReturnValue({
    data: undefined,
    loading: false,
    error: undefined,
    ...result,
  } as ReturnType<typeof useEmployeeLocationsBetweenQuery>);
}

const renderMonth = (month = new Date(2026, 0, 1)) =>
  renderWithProviders(<TrackerMonthLocations employeeId="u1" month={month} />);

describe('TrackerMonthLocations', () => {
  beforeEach(() => {
    vi.mocked(useGoogleMapsClientConfigQuery).mockReturnValue({
      data: { googleMapsClientConfig: { browserKey: 'maps-key', placesReady: true } },
      loading: false,
    } as ReturnType<typeof useGoogleMapsClientConfigQuery>);
  });

  it('asks for every local day of the month, refreshing what it has', () => {
    answer({ loading: true });
    renderMonth(new Date(2024, 1, 1));
    expect(vi.mocked(useEmployeeLocationsBetweenQuery).mock.lastCall?.[0]).toEqual({
      variables: { employeeId: 'u1', from: '2024-02-01', to: '2024-02-29' },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByText('Loading the map')).toBeInTheDocument();
  });

  it("puts the month's pins on one map, unjoined, each with its date and time", async () => {
    answer({
      data: {
        employeeLocationsBetween: [
          pin('p1', TrackerLocationKind.Attendance, '2026-01-05T04:00:00.000Z'),
          pin('p2', TrackerLocationKind.Move, '2026-01-20T09:30:00.000Z'),
        ],
      },
    });
    renderMonth();

    expect(screen.getByRole('heading', { name: 'Locations' })).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Map of the month’s locations' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('map of 2 pins, apart')).toBeInTheDocument();
    // A month's list names the day too, not just the time.
    expect(screen.getAllByRole('button', { name: /2026/ })).toHaveLength(2);
  });

  it('says so when the month has no pins', () => {
    answer({ data: { employeeLocationsBetween: [] } });
    renderMonth();
    expect(screen.getByText('No location pins this month')).toBeInTheDocument();
  });

  it('says why the pins could not be read', () => {
    answer({ error: new Error('Not your team') as never });
    renderMonth();
    expect(screen.getByRole('alert')).toHaveTextContent('Not your team');
  });
});
