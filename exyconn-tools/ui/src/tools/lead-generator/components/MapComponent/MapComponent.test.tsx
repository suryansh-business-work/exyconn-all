import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SecretsProvider } from '../../../../shared/context/SecretsContext';
import { ThemeProvider } from '../../../../shared/context/ThemeContext';
import {
  fakeMap,
  fakePolygonOverlay,
  installGoogleMaps,
  makePath,
  mapsLoader,
  resetMapsLoader,
  uninstallGoogleMaps,
  type GoogleMapsFake,
} from '../../../../__tests__/helpers/fakeGoogleMaps';

vi.mock('@react-google-maps/api', async () =>
  (await import('../../../../__tests__/helpers/fakeGoogleMaps')).reactGoogleMapsApiStub()
);

import { useJsApiLoader } from '@react-google-maps/api';
import MapComponent from './index';
import type { Business } from '../../types';

const SHOP: Business = {
  placeId: 'p1',
  name: 'Corner Cafe',
  address: '1 Main St',
  location: { lat: 1, lng: 2 },
  types: ['cafe'],
  rating: 4.2,
  totalRatings: 33,
  phone: '+1 555 0100',
};
const BARE_SHOP: Business = {
  placeId: 'p2',
  name: 'Bare Shop',
  address: '2 Side St',
  location: { lat: 3, lng: 4 },
  types: [],
};
const SQUARE = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
  { lat: 1, lng: 1 },
];

type Props = React.ComponentProps<typeof MapComponent>;

const baseProps = (overrides: Partial<Props> = {}): Props => ({
  apiKey: 'maps-key',
  businesses: [],
  onPolygonComplete: vi.fn(),
  onClearPolygon: vi.fn(),
  selectedBusiness: null,
  onBusinessSelect: vi.fn(),
  polygonCoordinates: [],
  ...overrides,
});

const ui = (props: Props) => (
  <ThemeProvider>
    <SecretsProvider>
      <MapComponent {...props} />
    </SecretsProvider>
  </ThemeProvider>
);

let maps: GoogleMapsFake;
let getCurrentPosition: ReturnType<typeof vi.fn>;

const setGeolocation = (value: unknown) =>
  Object.defineProperty(navigator, 'geolocation', { value, configurable: true });

beforeEach(() => {
  resetMapsLoader();
  maps = installGoogleMaps();
  getCurrentPosition = vi.fn();
  setGeolocation({ getCurrentPosition });
});

afterEach(() => {
  cleanup();
  uninstallGoogleMaps();
  setGeolocation(undefined);
  vi.restoreAllMocks();
});

const handlerFor = (event: string, nth = 0) =>
  maps.registrations.filter((r) => r.event === event)[nth].handler as (...args: unknown[]) => void;

describe('MapComponent states', () => {
  it('asks for a Maps key when none is set', () => {
    render(ui(baseProps({ apiKey: '' })));
    expect(screen.getByText('The map needs a Google Maps key to draw your search area.')).toBeInTheDocument();
    expect(screen.queryByTestId('google-map')).toBeNull();
  });

  it('explains a load failure', () => {
    mapsLoader.loadError = new Error('RefererNotAllowed');
    render(ui(baseProps()));
    expect(screen.getByText(/Failed to load Google Maps/)).toBeInTheDocument();
  });

  it('shows progress until the script has loaded', () => {
    mapsLoader.isLoaded = false;
    render(ui(baseProps()));
    expect(screen.getByText('Loading Google Maps...')).toBeInTheDocument();
  });

  it('loads the script with the key and the drawing and places libraries', () => {
    render(ui(baseProps()));
    expect(useJsApiLoader).toHaveBeenCalledWith({ googleMapsApiKey: 'maps-key', libraries: ['drawing', 'places'] });
    expect(screen.getByTestId('google-map')).toHaveAttribute('data-center', '40.7128,-74.006');
  });
});

describe('MapComponent location', () => {
  it('centres on the visitor when geolocation is allowed', async () => {
    getCurrentPosition.mockImplementationOnce((ok: (p: unknown) => void) =>
      ok({ coords: { latitude: 12.5, longitude: 77.1 } })
    );
    render(ui(baseProps()));
    await waitFor(() => expect(screen.getByTestId('google-map')).toHaveAttribute('data-center', '12.5,77.1'));
  });

  it('keeps the default centre when geolocation is denied', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    getCurrentPosition.mockImplementationOnce((_ok: unknown, fail: () => void) => fail());
    render(ui(baseProps()));
    expect(log).toHaveBeenCalledWith('Geolocation permission denied');
    expect(screen.getByTestId('google-map')).toHaveAttribute('data-center', '40.7128,-74.006');
  });

  it('works without geolocation support and My Location then does nothing', () => {
    setGeolocation(undefined);
    render(ui(baseProps()));
    fireEvent.click(screen.getByRole('button', { name: 'My Location' }));
    expect(fakeMap.panTo).not.toHaveBeenCalled();
  });

  it('moves to the visitor from the My Location button', () => {
    render(ui(baseProps()));
    getCurrentPosition.mockImplementationOnce((ok: (p: unknown) => void) =>
      ok({ coords: { latitude: 9, longitude: 8 } })
    );
    fireEvent.click(screen.getByRole('button', { name: 'My Location' }));
    expect(fakeMap.panTo).toHaveBeenCalledWith({ lat: 9, lng: 8 });
    expect(fakeMap.setZoom).toHaveBeenCalledWith(14);
    expect(screen.getByTestId('google-map')).toHaveAttribute('data-center', '9,8');
  });

  it('tells the visitor when the location cannot be read', () => {
    const alert = vi.spyOn(globalThis, 'alert').mockImplementation(() => undefined);
    render(ui(baseProps()));
    getCurrentPosition.mockImplementationOnce((_ok: unknown, fail: () => void) => fail());
    fireEvent.click(screen.getByRole('button', { name: 'My Location' }));
    expect(alert).toHaveBeenCalledWith('Unable to get your location');
  });

  it('pans to an external centre once the map is ready', () => {
    const { rerender } = render(ui(baseProps()));
    rerender(ui(baseProps({ externalCenter: { lat: 51.5, lng: -0.12 } })));
    expect(fakeMap.panTo).toHaveBeenCalledWith({ lat: 51.5, lng: -0.12 });
    expect(fakeMap.setZoom).toHaveBeenCalledWith(14);
    expect(screen.getByTestId('google-map')).toHaveAttribute('data-center', '51.5,-0.12');
  });
});

describe('MapComponent drawing', () => {
  it('hands the draw trigger to the parent, which is a no-op until the map has loaded', () => {
    const onDrawPolygonRef = vi.fn();
    render(ui(baseProps({ onDrawPolygonRef })));
    const first = onDrawPolygonRef.mock.calls[0][0] as () => void;
    first();
    expect(maps.drawingManagers).toHaveLength(0);

    const latest = onDrawPolygonRef.mock.calls.at(-1)?.[0] as () => void;
    latest();
    expect(maps.drawingManagers).toHaveLength(1);
  });

  it('draws a polygon, reports its corners and follows edits to its path', () => {
    const onPolygonComplete = vi.fn();
    render(ui(baseProps({ onPolygonComplete })));

    fireEvent.click(screen.getByRole('button', { name: 'Draw Polygon' }));

    expect(maps.drawingManagers).toHaveLength(1);
    expect(maps.drawingManagers[0].options).toMatchObject({ drawingMode: 'polygon', drawingControl: false });
    expect(maps.drawingManagers[0].setMap).toHaveBeenCalledWith(fakeMap);
    expect(screen.getByRole('button', { name: 'Drawing... Click on map' })).toBeDisabled();

    const path = makePath(SQUARE.map((p) => ({ ...p })));
    act(() => handlerFor('polygoncomplete')({ getPath: () => path, setMap: vi.fn() }));

    expect(onPolygonComplete).toHaveBeenLastCalledWith(SQUARE);
    expect(maps.drawingManagers[0].setDrawingMode).toHaveBeenCalledWith(null);
    expect(screen.getByRole('button', { name: 'Draw Polygon' })).toBeEnabled();

    path.points[0] = { lat: 5, lng: 5 };
    handlerFor('set_at')();
    expect(onPolygonComplete).toHaveBeenLastCalledWith([{ lat: 5, lng: 5 }, SQUARE[1], SQUARE[2]]);

    path.points.push({ lat: 9, lng: 9 });
    handlerFor('insert_at')();
    expect(onPolygonComplete).toHaveBeenLastCalledWith([{ lat: 5, lng: 5 }, SQUARE[1], SQUARE[2], { lat: 9, lng: 9 }]);
  });

  it('removes the old polygon and reuses the drawing manager when redrawing', () => {
    const onClearPolygon = vi.fn();
    const { rerender } = render(ui(baseProps({ onClearPolygon })));
    fireEvent.click(screen.getByRole('button', { name: 'Draw Polygon' }));
    const polygon = { getPath: () => makePath(SQUARE), setMap: vi.fn() };
    act(() => handlerFor('polygoncomplete')(polygon));
    rerender(ui(baseProps({ onClearPolygon, polygonCoordinates: SQUARE })));

    fireEvent.click(screen.getByRole('button', { name: 'Redraw Polygon' }));

    expect(polygon.setMap).toHaveBeenCalledWith(null);
    expect(onClearPolygon).toHaveBeenCalledTimes(1);
    expect(maps.drawingManagers).toHaveLength(1);
    expect(maps.drawingManagers[0].setDrawingMode).toHaveBeenLastCalledWith('polygon');
    expect(screen.getByRole('button', { name: 'Drawing... Click on map' })).toBeDisabled();
  });

  it('draws again without clearing when no polygon was kept', () => {
    const onClearPolygon = vi.fn();
    render(ui(baseProps({ onClearPolygon })));
    fireEvent.click(screen.getByRole('button', { name: 'Draw Polygon' }));
    expect(maps.drawingManagers).toHaveLength(1);
    expect(onClearPolygon).not.toHaveBeenCalled();
  });

  it('removes the polygon overlay with Clear Area', () => {
    const onClearPolygon = vi.fn();
    render(ui(baseProps({ onClearPolygon, polygonCoordinates: SQUARE })));

    fireEvent.click(screen.getByRole('button', { name: 'Clear Area' }));

    expect(fakePolygonOverlay.setMap).toHaveBeenCalledWith(null);
    expect(onClearPolygon).toHaveBeenCalledTimes(1);
  });

  it('clears the area even when the overlay has not loaded', () => {
    mapsLoader.overlayLoads = false;
    const onClearPolygon = vi.fn();
    render(ui(baseProps({ onClearPolygon, polygonCoordinates: SQUARE })));
    fireEvent.click(screen.getByRole('button', { name: 'Clear Area' }));
    expect(fakePolygonOverlay.setMap).not.toHaveBeenCalled();
    expect(onClearPolygon).toHaveBeenCalledTimes(1);
  });
});

describe('MapComponent businesses', () => {
  it('shows a marker per business and selects one when clicked', () => {
    const onBusinessSelect = vi.fn();
    render(ui(baseProps({ businesses: [SHOP, BARE_SHOP], onBusinessSelect })));
    expect(screen.getAllByTestId('marker')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Marker Corner Cafe' }));
    expect(onBusinessSelect).toHaveBeenCalledWith(SHOP);
  });

  it('shows the selected business with rating and phone, and closes the window', () => {
    const onBusinessSelect = vi.fn();
    render(ui(baseProps({ businesses: [SHOP], selectedBusiness: SHOP, onBusinessSelect })));
    const info = screen.getByTestId('info-window');
    expect(info).toHaveTextContent('Corner Cafe');
    expect(info).toHaveTextContent('1 Main St');
    expect(info).toHaveTextContent('4.2 (33 reviews)');
    expect(info).toHaveTextContent('+1 555 0100');
    fireEvent.click(screen.getByRole('button', { name: 'Close info window' }));
    expect(onBusinessSelect).toHaveBeenCalledWith(null);
  });

  it('leaves out the rating and phone lines when the business has none', () => {
    render(ui(baseProps({ businesses: [BARE_SHOP], selectedBusiness: BARE_SHOP })));
    const info = screen.getByTestId('info-window');
    expect(info).toHaveTextContent('Bare Shop');
    expect(info).not.toHaveTextContent('reviews');
    expect(info).not.toHaveTextContent('+1');
  });
});
