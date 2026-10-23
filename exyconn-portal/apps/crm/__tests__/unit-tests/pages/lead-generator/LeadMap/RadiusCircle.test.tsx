import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { theme } from '@exyconn/shell/config/theme';
import { RadiusCircle } from '../../../../../src/pages/lead-generator/LeadMap/RadiusCircle';
import { renderWithProviders } from '../../../test-utils';
import { GoogleMap, googleGlobal, mapsStub, type FakeMap } from '../google-maps-stub';

vi.mock('@react-google-maps/api', () => import('../google-maps-stub'));

const noop = () => undefined;

function renderOnMap(circle: Parameters<typeof RadiusCircle>[0]['circle']) {
  renderWithProviders(
    <GoogleMap onLoad={noop} onUnmount={noop} onIdle={noop} options={{}}>
      <RadiusCircle circle={circle} />
    </GoogleMap>,
  );
  return mapsStub.map as FakeMap;
}

const centreOf = () => JSON.parse(screen.getByTestId('circle').dataset.center ?? '');

describe('RadiusCircle', () => {
  beforeEach(() => vi.stubGlobal('google', googleGlobal));
  afterEach(() => vi.unstubAllGlobals());

  it('draws a red circle around a point and moves the map to it', () => {
    const map = renderOnMap({ centre: { lat: 1, lng: 2 }, radiusKm: 2.5 });

    const circle = screen.getByTestId('circle');
    expect(centreOf()).toEqual({ lat: 1, lng: 2 });
    expect(circle.dataset.radius).toBe('2500');
    expect(circle.dataset.stroke).toBe(theme.palette.error.main);
    expect(map.panTo).toHaveBeenCalledWith({ lat: 1, lng: 2 });
  });

  it('follows the map centre when there is no point', () => {
    const map = renderOnMap({ centre: null, radiusKm: 5 });
    expect(centreOf()).toEqual({ lat: 12.9, lng: 77.6 });

    map.center = { lat: 20, lng: 30 };
    act(() => map.fire('idle', undefined));

    expect(centreOf()).toEqual({ lat: 20, lng: 30 });
    expect(map.panTo).not.toHaveBeenCalled();
  });

  it('draws nothing while there is no map to centre on', () => {
    renderWithProviders(<RadiusCircle circle={{ centre: null, radiusKm: 5 }} />);

    expect(screen.queryByTestId('circle')).not.toBeInTheDocument();
  });

  it('stops following the map once it is gone', () => {
    const map = renderOnMap({ centre: null, radiusKm: 5 });
    map.center = null;
    act(() => map.fire('idle', undefined));

    expect(screen.queryByTestId('circle')).not.toBeInTheDocument();
  });
});
