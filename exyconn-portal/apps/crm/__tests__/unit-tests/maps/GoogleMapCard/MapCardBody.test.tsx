import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import MapCardBody from '../../../../src/maps/GoogleMapCard/MapCardBody';
import type { MapTarget } from '../../../../src/maps/mapLinks';
import { renderWithProviders } from '../../test-utils';

type Lookup =
  | { status: 'idle' | 'loading' | 'missing' }
  | { status: 'found'; position: { lat: number; lng: number } };

const maps = vi.hoisted(() => ({
  script: { isLoaded: true, loadError: undefined as Error | undefined, authFailed: false },
  lookup: { status: 'idle' } as Lookup,
  geocode: vi.fn(),
}));

vi.mock('../../../../src/maps/mapsScript', () => ({ useMapsScript: () => maps.script }));

vi.mock('../../../../src/maps/GoogleMapCard/useGeocodedPosition', () => ({
  useGeocodedPosition: (address: string, enabled: boolean) => {
    maps.geocode(address, enabled);
    return maps.lookup;
  },
}));

vi.mock('@react-google-maps/api', () => ({
  GoogleMap: ({
    center,
    children,
  }: Readonly<{ center: { lat: number; lng: number }; children: ReactNode }>) => (
    <div data-testid="google-map" data-center={`${center.lat},${center.lng}`}>
      {children}
    </div>
  ),
  MarkerF: ({ title }: Readonly<{ title: string }>) => <span data-testid="marker">{title}</span>,
}));

const STORED: MapTarget = { lat: 18.52, lng: 73.85, address: '1 Main St' };
const ADDRESS_ONLY: MapTarget = { address: '1 Main St', city: 'Pune' };

function renderBody(target: MapTarget) {
  renderWithProviders(<MapCardBody apiKey="maps-key" target={target} title="Acme HQ" />);
}

const unavailable = () => screen.queryByText('This place could not be shown on the map.');

describe('MapCardBody', () => {
  beforeEach(() => {
    maps.script = { isLoaded: true, loadError: undefined, authFailed: false };
    maps.lookup = { status: 'idle' };
    maps.geocode.mockClear();
  });

  it('pins stored coordinates without geocoding', () => {
    renderBody(STORED);

    expect(screen.getByRole('region', { name: 'Map of Acme HQ' })).toBeInTheDocument();
    expect(screen.getByTestId('google-map')).toHaveAttribute('data-center', '18.52,73.85');
    expect(screen.getByTestId('marker')).toHaveTextContent('Acme HQ');
    expect(maps.geocode).toHaveBeenCalledWith('1 Main St', false);
  });

  it('geocodes the address once the script is loaded and pins what it found', () => {
    maps.lookup = { status: 'found', position: { lat: 1.5, lng: 2.5 } };

    renderBody(ADDRESS_ONLY);

    expect(maps.geocode).toHaveBeenCalledWith('1 Main St, Pune', true);
    expect(screen.getByTestId('google-map')).toHaveAttribute('data-center', '1.5,2.5');
  });

  it('shows the loading skeleton while the script loads, without geocoding yet', () => {
    maps.script = { ...maps.script, isLoaded: false };

    renderBody(ADDRESS_ONLY);

    expect(screen.getByTestId('skeleton-map')).toBeInTheDocument();
    expect(maps.geocode).toHaveBeenCalledWith('1 Main St, Pune', false);
  });

  it('shows the loading skeleton while the address is being looked up', () => {
    maps.lookup = { status: 'loading' };

    renderBody(ADDRESS_ONLY);

    expect(screen.getByTestId('skeleton-map')).toBeInTheDocument();
    expect(screen.queryByTestId('google-map')).not.toBeInTheDocument();
  });

  it.each([
    ['the script fails to load', { loadError: new Error('offline') }, { status: 'idle' }],
    ['Google rejects the key', { authFailed: true }, { status: 'idle' }],
    ['the address cannot be found', {}, { status: 'missing' }],
  ] as const)('says the place cannot be shown when %s', (_case, script, lookup) => {
    maps.script = { ...maps.script, ...script };
    maps.lookup = lookup;

    renderBody(ADDRESS_ONLY);

    expect(unavailable()).toBeInTheDocument();
    expect(screen.queryByTestId('google-map')).not.toBeInTheDocument();
  });
});
