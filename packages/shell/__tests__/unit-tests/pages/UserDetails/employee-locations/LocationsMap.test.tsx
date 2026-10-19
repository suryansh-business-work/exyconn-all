import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect, type ReactNode } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationsMap from '@/pages/UserDetails/employee-locations/LocationsMap';
import { useMapsScript } from '@/components/maps/mapsScript';
import { portalLogger } from '@/logging/portalLogger';
import { renderWithProviders } from '../../../test-utils';
import { MORNING, NOON } from './fixtures';

const fake = vi.hoisted(() => ({
  map: { setCenter: vi.fn(), setZoom: vi.fn(), fitBounds: vi.fn() },
  polyline: undefined as unknown,
  unmounted: vi.fn(),
}));

vi.mock('@/components/maps/mapsScript', () => ({ useMapsScript: vi.fn() }));

interface MapProps {
  children: ReactNode;
  onLoad: (map: unknown) => void;
  onUnmount: () => void;
}

vi.mock('@react-google-maps/api', () => ({
  GoogleMap: function FakeMap({ children, onLoad, onUnmount }: Readonly<MapProps>) {
    useEffect(() => {
      onLoad(fake.map);
      return () => {
        onUnmount();
        fake.unmounted();
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return <div data-testid="map">{children}</div>;
  },
  PolylineF: ({ path }: Readonly<{ path: unknown }>) => {
    fake.polyline = path;
    return null;
  },
  MarkerF: ({
    label,
    zIndex,
    onClick,
  }: Readonly<{ label: string; zIndex: number; onClick: () => void }>) => (
    <button type="button" onClick={onClick}>{`marker ${label} z${zIndex}`}</button>
  ),
  InfoWindowF: ({
    children,
    onCloseClick,
  }: Readonly<{ children: ReactNode; onCloseClick: () => void }>) => (
    <div role="dialog" aria-label="pin">
      {children}
      <button type="button" onClick={onCloseClick}>
        close pin
      </button>
    </div>
  ),
}));

class FakeBounds {
  readonly points: unknown[] = [];
  extend(point: unknown) {
    this.points.push(point);
  }
}

function script(state: Partial<ReturnType<typeof useMapsScript>>) {
  vi.mocked(useMapsScript).mockReturnValue({
    isLoaded: true,
    loadError: undefined,
    authFailed: false,
    ...state,
  } as ReturnType<typeof useMapsScript>);
}

beforeEach(() => {
  vi.stubGlobal('google', { maps: { LatLngBounds: FakeBounds } });
  fake.map.setCenter.mockReset();
  fake.map.setZoom.mockReset();
  fake.map.fitBounds.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('LocationsMap', () => {
  it('numbers the pins in time order, joins them, and fits the map to all of them', () => {
    script({});
    renderWithProviders(
      <LocationsMap
        apiKey="maps-key"
        pins={[MORNING, NOON]}
        selectedId="pin-2"
        onSelect={vi.fn()}
      />,
    );
    expect(useMapsScript).toHaveBeenCalledWith('maps-key');
    expect(screen.getByRole('button', { name: 'marker 1 z1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'marker 2 z2' })).toBeInTheDocument();
    expect(fake.polyline).toEqual([
      { lat: MORNING.lat, lng: MORNING.lng },
      { lat: NOON.lat, lng: NOON.lng },
    ]);
    const bounds = fake.map.fitBounds.mock.lastCall?.[0] as FakeBounds;
    expect(bounds.points).toEqual(fake.polyline);
    expect(fake.map.setZoom).not.toHaveBeenCalled();
  });

  it('centres on a single pin at street level', () => {
    script({});
    renderWithProviders(
      <LocationsMap apiKey="maps-key" pins={[MORNING]} selectedId={null} onSelect={vi.fn()} />,
    );
    expect(fake.map.setCenter).toHaveBeenCalledWith({ lat: MORNING.lat, lng: MORNING.lng });
    expect(fake.map.setZoom).toHaveBeenCalledWith(16);
    expect(fake.map.fitBounds).not.toHaveBeenCalled();
  });

  it('moves nothing when there are no pins', () => {
    script({});
    renderWithProviders(
      <LocationsMap apiKey="maps-key" pins={[]} selectedId={null} onSelect={vi.fn()} />,
    );
    expect(fake.map.setCenter).not.toHaveBeenCalled();
    expect(fake.map.fitBounds).not.toHaveBeenCalled();
  });

  it('opens the selected pin with when, why, from what and how precisely', async () => {
    script({});
    const onSelect = vi.fn();
    const { unmount } = renderWithProviders(
      <LocationsMap
        apiKey="maps-key"
        pins={[MORNING, NOON]}
        selectedId="pin-1"
        onSelect={onSelect}
      />,
    );
    const detail = screen.getByRole('dialog', { name: 'pin' });
    expect(detail).toHaveTextContent('Attendance · Phone GPS');
    expect(detail).toHaveTextContent('Within 18 m');

    await userEvent.click(screen.getByRole('button', { name: 'marker 2 z1' }));
    expect(onSelect).toHaveBeenCalledWith('pin-2');
    await userEvent.click(screen.getByRole('button', { name: 'close pin' }));
    expect(onSelect).toHaveBeenCalledWith(null);
    unmount();
    expect(fake.unmounted).toHaveBeenCalled();
  });

  it('holds the place while Maps loads', () => {
    script({ isLoaded: false });
    renderWithProviders(
      <LocationsMap apiKey="k" pins={[MORNING]} selectedId={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('status', { name: 'Loading the map' })).toBeInTheDocument();
    expect(screen.queryByTestId('map')).not.toBeInTheDocument();
  });

  it('says Google rejected the key', () => {
    script({ authFailed: true, isLoaded: true });
    renderWithProviders(
      <LocationsMap apiKey="k" pins={[MORNING]} selectedId={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Google rejected the Maps key');
  });

  it('says, and logs, when the script could not load', () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('blocked');
    script({ loadError: failure, isLoaded: false });
    renderWithProviders(
      <LocationsMap apiKey="k" pins={[MORNING]} selectedId={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Google Maps could not be loaded');
    expect(warn).toHaveBeenCalledWith('maps: Google Maps JavaScript failed to load', failure);
  });
});
