import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEmployeeLocationsQuery, useGoogleMapsClientConfigQuery } from '@/graphql/generated';
import { EmployeeLocationsPanel } from '@/pages/UserDetails/employee-locations';
import { renderWithProviders } from '../../../test-utils';
import { queryResult } from '../../hookMocks';
import { MORNING, NOON } from './fixtures';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useEmployeeLocationsQuery: vi.fn(),
  useGoogleMapsClientConfigQuery: vi.fn(),
}));

interface MapStubProps {
  apiKey: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

// The map has its own test; here it only shows what it was handed.
vi.mock('@/pages/UserDetails/employee-locations/LocationsMap', () => ({
  default: ({ apiKey, selectedId, onSelect }: Readonly<MapStubProps>) => (
    <button type="button" onClick={() => onSelect(null)}>
      {`map ${apiKey} ${selectedId ?? 'none'}`}
    </button>
  ),
}));

type Result = ReturnType<typeof queryResult>;

function show(locations: Result, config: Result = queryResult(undefined)) {
  vi.mocked(useEmployeeLocationsQuery).mockReturnValue(
    locations as unknown as ReturnType<typeof useEmployeeLocationsQuery>,
  );
  vi.mocked(useGoogleMapsClientConfigQuery).mockReturnValue(
    config as unknown as ReturnType<typeof useGoogleMapsClientConfigQuery>,
  );
  renderWithProviders(<EmployeeLocationsPanel employeeId="emp-1" />);
}

const withKey = queryResult({
  googleMapsClientConfig: { browserKey: 'maps-key', placesReady: true },
});
const dayInput = () =>
  screen.getByText('Day', { selector: 'label' }).parentElement!.querySelector('input')!;

beforeEach(() => {
  vi.mocked(useEmployeeLocationsQuery).mockReset();
  vi.mocked(useGoogleMapsClientConfigQuery).mockReset();
});

describe('EmployeeLocationsPanel', () => {
  it("reads today's pins and holds the map's place while they load", () => {
    show(queryResult(undefined, { loading: true }));
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    expect(vi.mocked(useEmployeeLocationsQuery).mock.lastCall?.[0]?.variables).toEqual({
      employeeId: 'emp-1',
      date: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    });
    // No pins yet, so the Maps key is not even asked for.
    expect(vi.mocked(useGoogleMapsClientConfigQuery).mock.lastCall?.[0]).toEqual({ skip: true });
    expect(screen.getByRole('status', { name: 'Loading the map' })).toBeInTheDocument();
  });

  it('says so when the day has no pins', () => {
    show(queryResult({ employeeLocations: [] }));
    expect(screen.getByText('No locations on this day')).toBeInTheDocument();
  });

  it('says why the pins could not be read', () => {
    show(queryResult(undefined, { error: new Error('Forbidden') }));
    expect(screen.getByRole('alert')).toHaveTextContent('Forbidden');
  });

  it('shows the pins on the map and in the list, kept in step', async () => {
    show(queryResult({ employeeLocations: [MORNING, NOON] }), withKey);
    expect(vi.mocked(useGoogleMapsClientConfigQuery).mock.lastCall?.[0]).toEqual({ skip: false });
    const region = screen.getByRole('region', { name: 'Map of the day’s locations' });
    expect(await screen.findByRole('button', { name: 'map maps-key none' })).toBeInTheDocument();
    expect(region).toBeInTheDocument();

    await userEvent.click(screen.getByText('Moved · Computer location'));
    expect(screen.getByRole('button', { name: 'map maps-key pin-2' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'map maps-key pin-2' }));
    expect(screen.getByRole('button', { name: 'map maps-key none' })).toBeInTheDocument();
  });

  it('holds the map while the key loads, then says when Tech has not set one', () => {
    show(queryResult({ employeeLocations: [MORNING] }), queryResult(undefined, { loading: true }));
    expect(screen.getByRole('status', { name: 'Loading the map' })).toBeInTheDocument();
    expect(screen.getByText('Attendance · Phone GPS')).toBeInTheDocument();
  });

  it('points at Tech when no Maps key is saved', () => {
    show(
      queryResult({ employeeLocations: [MORNING] }),
      queryResult({ googleMapsClientConfig: { browserKey: null, placesReady: false } }),
    );
    expect(screen.getByText('The map needs a Maps JavaScript key')).toBeInTheDocument();
  });

  it('reads another day when one is picked, clearing the open pin, and ignores a half-typed day', async () => {
    show(queryResult({ employeeLocations: [MORNING, NOON] }), withKey);
    await userEvent.click(screen.getByText('Moved · Computer location'));
    fireEvent.change(dayInput(), { target: { value: '06/10/2026' } });
    expect(vi.mocked(useEmployeeLocationsQuery).mock.lastCall?.[0]?.variables).toEqual({
      employeeId: 'emp-1',
      date: '2026-06-10',
    });
    expect(await screen.findByRole('button', { name: 'map maps-key none' })).toBeInTheDocument();

    fireEvent.change(dayInput(), { target: { value: '99/99/2026' } });
    expect(vi.mocked(useEmployeeLocationsQuery).mock.lastCall?.[0]?.variables?.date).toBe(
      '2026-06-10',
    );
  });
});
