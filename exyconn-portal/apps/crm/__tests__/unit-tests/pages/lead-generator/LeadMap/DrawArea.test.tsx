import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { theme } from '@exyconn/shell/config/theme';
import { DrawArea } from '../../../../../src/pages/lead-generator/LeadMap/DrawArea';
import { renderWithProviders } from '../../../test-utils';
import { corners, fakeArea } from '../search-area-fake';
import { GoogleMap, googleGlobal, mapsStub, type FakeMap } from '../google-maps-stub';

vi.mock('@react-google-maps/api', () => import('../google-maps-stub'));

const noop = () => undefined;

function renderOnMap(area: ReturnType<typeof fakeArea>) {
  const view = renderWithProviders(
    <GoogleMap onLoad={noop} onUnmount={noop} onIdle={noop} options={{}}>
      <DrawArea area={area} />
    </GoogleMap>,
  );
  const map = mapsStub.map as FakeMap;
  const rerender = (next: ReturnType<typeof fakeArea>) =>
    view.rerender(
      <GoogleMap onLoad={noop} onUnmount={noop} onIdle={noop} options={{}}>
        <DrawArea area={next} />
      </GoogleMap>,
    );
  return { map, rerender, unmount: view.unmount };
}

describe('DrawArea', () => {
  beforeEach(() => {
    vi.stubGlobal('google', googleGlobal);
    mapsStub.draggedPath = [];
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows nothing and leaves the map alone before an area is drawn', () => {
    const { map } = renderOnMap(fakeArea({ points: corners(2) }));

    expect(screen.queryByTestId('polyline')).not.toBeInTheDocument();
    expect(screen.queryByTestId('polygon')).not.toBeInTheDocument();
    expect(map.addListener).not.toHaveBeenCalled();
    expect(map.setOptions).not.toHaveBeenCalled();
  });

  it('turns each map click into a corner while drawing, and follows them with an outline', () => {
    const area = fakeArea({ drawing: true, points: corners(2) });
    const { map } = renderOnMap(area);

    expect(map.setOptions).toHaveBeenCalledWith({ draggableCursor: 'crosshair' });
    act(() => map.fire('click', { latLng: { toJSON: () => ({ lat: 1, lng: 2 }) } }));
    act(() => map.fire('click', { latLng: null }));

    expect(area.addPoint).toHaveBeenCalledTimes(1);
    expect(area.addPoint).toHaveBeenCalledWith({ lat: 1, lng: 2 });
    const line = screen.getByTestId('polyline');
    expect(JSON.parse(line.dataset.path ?? '')).toEqual(corners(2));
    expect(line.dataset.stroke).toBe(theme.palette.primary.main);
    expect(screen.getAllByTestId('marker').map((m) => m.dataset.position)).toEqual(
      corners(2).map((point) => JSON.stringify(point)),
    );
  });

  it('stops taking clicks and restores the cursor once drawing ends', () => {
    const area = fakeArea({ drawing: true, points: corners(3) });
    const { map, rerender } = renderOnMap(area);

    rerender(fakeArea({ ...area, drawing: false }));
    act(() => map.fire('click', { latLng: { toJSON: () => ({ lat: 1, lng: 2 }) } }));

    expect(map.setOptions).toHaveBeenLastCalledWith({ draggableCursor: null });
    expect(area.addPoint).not.toHaveBeenCalled();
  });

  it('draws the outline even when there is no map to listen to yet', () => {
    renderWithProviders(<DrawArea area={fakeArea({ drawing: true, points: corners(1) })} />);

    expect(screen.getByTestId('polyline')).toBeInTheDocument();
    expect(screen.getAllByTestId('marker')).toHaveLength(1);
  });

  it('shows a finished area as an editable polygon', () => {
    renderOnMap(fakeArea({ points: corners(3) }));

    const polygon = screen.getByTestId('polygon');
    expect(JSON.parse(polygon.dataset.paths ?? '')).toEqual(corners(3));
    expect(polygon.dataset.editable).toBe('true');
    expect(screen.queryByTestId('polyline')).not.toBeInTheDocument();
  });

  it('reads the path back after a corner is dragged, and only when it changed', () => {
    const area = fakeArea({ points: corners(3) });
    renderOnMap(area);
    const mouseUp = () => act(() => mapsStub.polygon?.onMouseUp());

    mapsStub.draggedPath = corners(3);
    mouseUp();
    expect(area.edit).not.toHaveBeenCalled();

    const moved = [...corners(2), { lat: 40, lng: 80 }];
    mapsStub.draggedPath = moved;
    mouseUp();
    expect(area.edit).toHaveBeenLastCalledWith(moved);

    mapsStub.draggedPath = corners(4);
    mouseUp();
    expect(area.edit).toHaveBeenLastCalledWith(corners(4));
    expect(area.edit).toHaveBeenCalledTimes(2);
  });

  it('ignores a mouse-up once the polygon has gone from the map', () => {
    const area = fakeArea({ points: corners(3) });
    renderOnMap(area);
    const polygon = mapsStub.polygon;
    mapsStub.draggedPath = corners(4);

    act(() => polygon?.onUnmount());
    act(() => polygon?.onMouseUp());

    expect(area.edit).not.toHaveBeenCalled();
  });
});
