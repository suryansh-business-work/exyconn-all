import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { vi } from 'vitest';

/**
 * Stand-ins for `@react-google-maps/api` and the `google.maps` global, for jsdom where Maps
 * JavaScript cannot run. Use with
 * `vi.mock('@react-google-maps/api', () => import('../google-maps-stub'))`.
 */

interface Point {
  lat: number;
  lng: number;
}

type Listener = (event: unknown) => void;

/** A map that records what the code asks of it, and lets a test fire its events. */
export class FakeMap {
  readonly listeners = new Map<string, Set<Listener>>();
  center: Point | null = { lat: 12.9, lng: 77.6 };
  zoom: number | undefined = 10;
  readonly setOptions = vi.fn();
  readonly fitBounds = vi.fn();
  readonly panTo = vi.fn();
  readonly setZoom = vi.fn();

  readonly addListener = vi.fn((name: string, listener: Listener) => {
    const set = this.listeners.get(name) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(name, set);
    return { remove: () => set.delete(listener) };
  });

  getZoom() {
    return this.zoom;
  }

  getCenter() {
    const { center } = this;
    return center ? { toJSON: () => center } : undefined;
  }

  /** Fires `name` on every listener, as Google would. */
  fire(name: string, event: unknown) {
    for (const listener of this.listeners.get(name) ?? []) {
      listener(event);
    }
  }
}

/** A Maps `LatLngBounds` that keeps the points it was extended with. */
export class FakeBounds {
  readonly points: Point[] = [];

  extend(point: Point) {
    this.points.push(point);
  }
}

/** The `google.maps` pieces the CRM's map code reads. */
export const googleGlobal = {
  maps: { SymbolPath: { CIRCLE: 0 }, LatLngBounds: FakeBounds },
};

interface PolygonProps {
  paths: Point[];
  options: { strokeColor: string };
  onLoad?: (polygon: unknown) => void;
  onUnmount?: () => void;
  onMouseUp?: () => void;
}

/** The last map and polygon rendered, and the polygon's path as the user has dragged it. */
export const mapsStub = {
  map: null as FakeMap | null,
  mapProps: null as null | { onIdle: () => void; options: unknown },
  polygon: null as PolygonProps | null,
  draggedPath: [] as Point[],
};

const latLng = (point: Point) => ({ toJSON: () => point });
const fakePolygon = { getPath: () => ({ getArray: () => mapsStub.draggedPath.map(latLng) }) };

const MapContext = createContext<FakeMap | null>(null);

/** Calls the latest `onLoad` once on mount and `onUnmount` once on unmount, like the library. */
function useLifecycle(onLoad: () => void, onUnmount: () => void) {
  const latest = useRef({ onLoad, onUnmount });
  latest.current = { onLoad, onUnmount };
  useEffect(() => {
    latest.current.onLoad();
    return () => latest.current.onUnmount();
  }, []);
}

export const useGoogleMap = () => useContext(MapContext);

export function GoogleMap({
  children,
  onLoad,
  onUnmount,
  onIdle,
  options,
}: Readonly<{
  children: ReactNode;
  onLoad: (map: FakeMap) => void;
  onUnmount: (map: FakeMap) => void;
  onIdle: () => void;
  options: unknown;
}>) {
  const [map] = useState(() => new FakeMap());
  mapsStub.map = map;
  mapsStub.mapProps = { onIdle, options };
  useLifecycle(
    () => onLoad(map),
    () => onUnmount(map),
  );
  return (
    <MapContext.Provider value={map}>
      <div data-testid="google-map">{children}</div>
    </MapContext.Provider>
  );
}

export function MarkerF({
  position,
  title,
  label,
  zIndex,
  onClick,
  clickable,
}: Readonly<{
  position: Point;
  title?: string;
  label?: string;
  zIndex?: number;
  onClick?: () => void;
  clickable?: boolean;
}>) {
  return (
    <button
      type="button"
      data-testid="marker"
      data-clickable={clickable}
      data-position={JSON.stringify(position)}
      data-label={label}
      data-z={zIndex}
      onClick={onClick}
    >
      {title}
    </button>
  );
}

export function PolygonF(props: Readonly<PolygonProps & { editable?: boolean }>) {
  mapsStub.polygon = props;
  const { onLoad, onUnmount, paths, editable, options } = props;
  useLifecycle(
    () => onLoad?.(fakePolygon),
    () => onUnmount?.(),
  );
  return (
    <div
      data-testid="polygon"
      data-paths={JSON.stringify(paths)}
      data-editable={editable}
      data-stroke={options.strokeColor}
    />
  );
}

export function CircleF({
  center,
  radius,
  options,
}: Readonly<{ center: Point; radius: number; options: { strokeColor: string } }>) {
  return (
    <div
      data-testid="circle"
      data-center={JSON.stringify(center)}
      data-radius={radius}
      data-stroke={options.strokeColor}
    />
  );
}
