import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { useGoogleMapsClientConfigQuery } from '@/graphql/generated';
import { LocationsView } from '@/pages/UserDetails/employee-locations/LocationsView';
import { renderWithProviders } from '../../../test-utils';
import { queryResult } from '../../hookMocks';
import { MORNING, NOON } from './fixtures';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useGoogleMapsClientConfigQuery: vi.fn(),
}));

// The map has its own test; here it only says what it was handed.
vi.mock('@/pages/UserDetails/employee-locations/LocationsMap', () => ({
  default: ({ connect, pins }: Readonly<{ connect: boolean; pins: readonly unknown[] }>) => (
    <p>{`map of ${pins.length} ${connect ? 'joined' : 'apart'}`}</p>
  ),
}));

const formatWhen = (value: string) => `when ${value}`;

function renderView(props: Partial<Parameters<typeof LocationsView>[0]> = {}) {
  renderWithProviders(
    <LocationsView
      pins={[MORNING, NOON]}
      loading={false}
      emptyTitle="No locations this month"
      mapLabel="Map of the month’s locations"
      formatWhen={formatWhen}
      connect={false}
      {...props}
    />,
  );
}

beforeEach(() => {
  vi.mocked(useGoogleMapsClientConfigQuery).mockReturnValue(
    queryResult({
      googleMapsClientConfig: { browserKey: 'maps-key', placesReady: true },
    }) as unknown as ReturnType<typeof useGoogleMapsClientConfigQuery>,
  );
});

describe('LocationsView', () => {
  it('names the map region as the caller asks and leaves pins unjoined when told to', async () => {
    renderView();
    expect(
      screen.getByRole('region', { name: 'Map of the month’s locations' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('map of 2 apart')).toBeInTheDocument();
    expect(screen.getByText(`when ${NOON.capturedAt}`)).toBeInTheDocument();
  });

  it('keeps showing the pins it has while a refresh is loading', async () => {
    renderView({ loading: true });
    expect(await screen.findByText('map of 2 apart')).toBeInTheDocument();
    expect(screen.getByText('Attendance · Phone GPS')).toBeInTheDocument();
  });

  it('shows the caller’s empty title when there are no pins', () => {
    renderView({ pins: [] });
    expect(screen.getByText('No locations this month')).toBeInTheDocument();
    expect(useGoogleMapsClientConfigQuery).not.toHaveBeenCalled();
  });

  it('says why the Maps key could not be read, and still lists the pins', () => {
    vi.mocked(useGoogleMapsClientConfigQuery).mockReturnValue(
      queryResult(undefined, {
        error: new Error('Maps config unavailable'),
      }) as unknown as ReturnType<typeof useGoogleMapsClientConfigQuery>,
    );
    renderView();
    expect(screen.getByRole('alert')).toHaveTextContent('Maps config unavailable');
    expect(screen.getByText('Moved · Computer location')).toBeInTheDocument();
  });
});
