import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import LeadMapBody, {
  type LeadMapProps,
} from '../../../../../src/pages/lead-generator/LeadMap/LeadMapBody';
import type { LeadPlace } from '../../../../../src/pages/lead-generator/leadTypes';
import { renderWithProviders } from '../../../test-utils';
import { corners, fakeArea } from '../search-area-fake';
import { FakeBounds, googleGlobal, mapsStub, type FakeMap } from '../google-maps-stub';

vi.mock('@react-google-maps/api', () => import('../google-maps-stub'));

const script = vi.hoisted(() => ({
  state: { isLoaded: true, loadError: undefined as Error | undefined, authFailed: false },
}));

vi.mock('@exyconn/shell/components/maps/mapsScript', () => ({
  useMapsScript: () => script.state,
}));

function place(placeId: string, name: string, lat: number, lng: number): LeadPlace {
  return {
    placeId,
    name,
    address: '',
    city: '',
    country: '',
    phone: '',
    website: '',
    lat,
    lng,
    mapUrl: '',
    primaryType: '',
  };
}

const CAFE = place('p1', 'Blue Cafe', 12.1, 77.1);
const BAKERY = place('p2', 'Corner Bakery', 12.2, 77.2);

function renderBody(overrides: Partial<LeadMapProps> = {}) {
  const props: LeadMapProps = {
    apiKey: 'maps-key',
    places: [CAFE, BAKERY],
    focusedId: null,
    onFocus: vi.fn(),
    onReadyChange: vi.fn(),
    onCentreChange: vi.fn(),
    area: fakeArea(),
    drawEnabled: false,
    ...overrides,
  };
  const view = renderWithProviders(<LeadMapBody {...props} />);
  const rerender = (next: Partial<LeadMapProps>) => {
    Object.assign(props, next);
    view.rerender(<LeadMapBody {...props} />);
  };
  return { props, rerender, map: () => mapsStub.map as FakeMap };
}

const fittedTo = (map: FakeMap) =>
  map.fitBounds.mock.calls.map(([bounds]) => (bounds as FakeBounds).points);

describe('LeadMapBody', () => {
  beforeEach(() => {
    vi.stubGlobal('google', googleGlobal);
    script.state = { isLoaded: true, loadError: undefined, authFailed: false };
    mapsStub.map = null;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows the results as numbered markers that select their row', async () => {
    const { props } = renderBody({ focusedId: 'p2' });

    const markers = screen.getAllByTestId('marker');
    expect(markers.map((marker) => [marker.textContent, marker.dataset.label])).toEqual([
      ['Blue Cafe', '1'],
      ['Corner Bakery', '2'],
    ]);
    expect(markers.map((marker) => marker.dataset.z)).toEqual(['1', '2']);
    await userEvent.click(screen.getByRole('button', { name: 'Blue Cafe' }));

    expect(props.onFocus).toHaveBeenCalledWith('p1');
    expect(props.onReadyChange).toHaveBeenLastCalledWith(true);
  });

  it('starts on the whole world, then frames the results', () => {
    const { map } = renderBody();

    expect(mapsStub.mapProps?.options).toMatchObject({ center: { lat: 20, lng: 0 }, zoom: 2 });
    expect(fittedTo(map())).toEqual([
      [
        { lat: 12.1, lng: 77.1 },
        { lat: 12.2, lng: 77.2 },
      ],
    ]);
  });

  it('refits only when the set of places changes', () => {
    const { rerender, map } = renderBody();

    rerender({ places: [{ ...CAFE, existingCompanyId: 'c1' }, BAKERY] });
    expect(map().fitBounds).toHaveBeenCalledTimes(1);

    rerender({ places: [BAKERY] });
    expect(fittedTo(map())[1]).toEqual([{ lat: 12.2, lng: 77.2 }]);

    rerender({ places: [] });
    expect(map().fitBounds).toHaveBeenCalledTimes(2);
  });

  it('pans to a focused place, zooming in to street level but never out', () => {
    const { rerender, map } = renderBody();

    rerender({ focusedId: 'p1' });
    expect(map().panTo).toHaveBeenLastCalledWith({ lat: 12.1, lng: 77.1 });
    expect(map().setZoom).toHaveBeenLastCalledWith(16);

    map().zoom = 18;
    rerender({ focusedId: 'p2' });
    expect(map().setZoom).toHaveBeenLastCalledWith(18);

    map().zoom = undefined;
    rerender({ focusedId: 'p1' });
    expect(map().setZoom).toHaveBeenLastCalledWith(16);
  });

  it('ignores a focus that is not on the map', () => {
    const { map } = renderBody({ focusedId: 'gone' });

    expect(map().panTo).not.toHaveBeenCalled();
  });

  it('reports the centre whenever the map comes to rest', () => {
    const { props, map } = renderBody();

    act(() => mapsStub.mapProps?.onIdle());
    expect(props.onCentreChange).toHaveBeenCalledWith({ lat: 12.9, lng: 77.6 });

    map().center = null;
    act(() => mapsStub.mapProps?.onIdle());
    expect(props.onCentreChange).toHaveBeenCalledTimes(1);
  });

  it('draws the search area only for an area search', () => {
    const area = fakeArea({ drawing: true, points: corners(2) });
    const { rerender } = renderBody({ area });
    expect(screen.queryByTestId('polyline')).not.toBeInTheDocument();

    rerender({ drawEnabled: true });
    expect(screen.getByTestId('polyline')).toBeInTheDocument();
  });

  it('explains a rejected key, and stops counting the map as ready', () => {
    const { props, rerender } = renderBody();
    expect(props.onReadyChange).toHaveBeenLastCalledWith(true);

    script.state = { ...script.state, authFailed: true };
    rerender({});

    expect(screen.getByRole('alert')).toHaveTextContent('Google rejected the Maps key');
    expect(screen.queryByTestId('google-map')).not.toBeInTheDocument();
    expect(props.onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it('logs and explains a script that failed to load', () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('blocked');
    script.state = { isLoaded: false, loadError: failure, authFailed: false };
    const { props } = renderBody();

    expect(screen.getByRole('alert')).toHaveTextContent('Google Maps could not be loaded');
    expect(warn).toHaveBeenCalledWith('crm: Google Maps JavaScript failed to load', failure);
    expect(props.onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it('holds the map box with a skeleton while the script downloads', () => {
    const warn = vi.spyOn(portalLogger, 'warn');
    script.state = { isLoaded: false, loadError: undefined, authFailed: false };
    renderBody();

    expect(screen.getByTestId('skeleton-map')).toBeInTheDocument();
    expect(screen.queryAllByTestId('marker')).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
  });
});
