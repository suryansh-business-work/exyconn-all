/**
 * Stand-ins for the two Google Maps boundaries the lead generator touches: the
 * `@react-google-maps/api` React wrapper and the `google.maps` global. They record what the
 * tool asks of them and let a test play back what Google would answer.
 */
import React from 'react';
import { vi } from 'vitest';

/** What `useJsApiLoader` answers; a test changes it before rendering. */
export const mapsLoader: { isLoaded: boolean; loadError: Error | undefined; overlayLoads: boolean } = {
  isLoaded: true,
  loadError: undefined,
  /** False simulates the polygon overlay not having finished loading yet. */
  overlayLoads: true,
};

/** The map instance handed to `onLoad`, so a test can see `panTo`/`setZoom` calls. */
export const fakeMap = { panTo: vi.fn(), setZoom: vi.fn() };

/** Every polygon overlay the wrapper "created", with its `setMap`. */
export const fakePolygonOverlay = { setMap: vi.fn() };

export function resetMapsLoader() {
  mapsLoader.isLoaded = true;
  mapsLoader.loadError = undefined;
  mapsLoader.overlayLoads = true;
  fakeMap.panTo.mockClear();
  fakeMap.setZoom.mockClear();
  fakePolygonOverlay.setMap.mockClear();
}

type Children = { children?: React.ReactNode };

/** The module `vi.mock('@react-google-maps/api', ...)` should return. */
export function reactGoogleMapsApiStub() {
  const GoogleMap = ({
    children,
    onLoad,
    onUnmount,
    center,
  }: Children & {
    onLoad: (map: unknown) => void;
    onUnmount: () => void;
    center: { lat: number; lng: number };
  }) => {
    React.useEffect(() => {
      onLoad(fakeMap);
      return () => onUnmount();
    }, [onLoad, onUnmount]);
    return (
      <div data-testid="google-map" data-center={`${center.lat},${center.lng}`}>
        {children}
      </div>
    );
  };

  const Polygon = ({ paths, onLoad }: { paths: unknown[]; onLoad: (polygon: unknown) => void }) => {
    React.useEffect(() => {
      if (mapsLoader.overlayLoads) onLoad(fakePolygonOverlay);
    }, [onLoad]);
    return <div data-testid="polygon" data-points={paths.length} />;
  };

  const Marker = ({ title, onClick }: { title: string; onClick: () => void }) => (
    <button data-testid="marker" onClick={onClick}>
      {`Marker ${title}`}
    </button>
  );

  const InfoWindow = ({ children, onCloseClick }: Children & { onCloseClick: () => void }) => (
    <div data-testid="info-window">
      {children}
      <button onClick={onCloseClick}>Close info window</button>
    </div>
  );

  return {
    GoogleMap,
    Polygon,
    Marker,
    InfoWindow,
    useJsApiLoader: vi.fn(() => ({ isLoaded: mapsLoader.isLoaded, loadError: mapsLoader.loadError })),
  };
}

type Listener = (...args: unknown[]) => void;

/** One recorded `google.maps.event.addListener` registration. */
export interface Registration {
  target: unknown;
  event: string;
  handler: Listener;
}

export interface FakePath {
  points: { lat: number; lng: number }[];
  getLength: () => number;
  getAt: (index: number) => { lat: () => number; lng: () => number };
}

export const makePath = (points: { lat: number; lng: number }[]): FakePath => ({
  points,
  getLength: () => points.length,
  getAt: (index) => ({ lat: () => points[index].lat, lng: () => points[index].lng }),
});

export interface PlaceStub {
  place_id?: string;
  name?: string;
  vicinity?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  opening_hours?: { isOpen: () => boolean };
  geometry?: { location: { lat: () => number; lng: () => number } };
}

export const placeAt = (lat: number, lng: number, extra: PlaceStub = {}): PlaceStub => ({
  place_id: `place-${lat}-${lng}`,
  name: `Shop ${lat}-${lng}`,
  vicinity: 'Main Street',
  geometry: { location: { lat: () => lat, lng: () => lng } },
  ...extra,
});

/** Controls and records for the installed `google.maps` global. */
export interface GoogleMapsFake {
  registrations: Registration[];
  drawingManagers: { options: unknown; setMap: ReturnType<typeof vi.fn>; setDrawingMode: ReturnType<typeof vi.fn> }[];
  nearbySearch: ReturnType<typeof vi.fn>;
  getDetails: ReturnType<typeof vi.fn>;
  geocode: ReturnType<typeof vi.fn>;
  /** `nearbySearch` answers: one entry is consumed per call (`undefined` once exhausted). */
  searchAnswers: { results: PlaceStub[] | null; status: string }[];
  /** `getDetails` answer for every call. */
  details: { formatted_phone_number?: string; website?: string } | null;
  /** `geocode` answer. */
  geocodeAnswer: { results: unknown[]; status: string };
  /** When set, `new PlacesService()` throws it. */
  placesServiceError: Error | null;
}

export function installGoogleMaps(): GoogleMapsFake {
  const fake: GoogleMapsFake = {
    registrations: [],
    drawingManagers: [],
    nearbySearch: vi.fn(),
    getDetails: vi.fn(),
    geocode: vi.fn(),
    searchAnswers: [],
    details: null,
    geocodeAnswer: { results: [], status: 'ZERO_RESULTS' },
    placesServiceError: null,
  };

  fake.nearbySearch.mockImplementation((_request: unknown, callback: (r: unknown, s: string) => void) => {
    const answer = fake.searchAnswers.shift() ?? { results: [], status: 'ZERO_RESULTS' };
    callback(answer.results, answer.status);
  });
  fake.getDetails.mockImplementation((_request: unknown, callback: (details: unknown) => void) => {
    callback(fake.details);
  });
  fake.geocode.mockImplementation((_request: unknown, callback: (results: unknown, status: string) => void) => {
    callback(fake.geocodeAnswer.results, fake.geocodeAnswer.status);
  });

  class PlacesService {
    nearbySearch = fake.nearbySearch;

    getDetails = fake.getDetails;

    constructor() {
      if (fake.placesServiceError) throw fake.placesServiceError;
    }
  }

  class DrawingManager {
    setMap = vi.fn();

    setDrawingMode = vi.fn();

    constructor(public options: unknown) {
      fake.drawingManagers.push(this);
    }
  }

  class Geocoder {
    geocode = fake.geocode;
  }

  class LatLng {
    constructor(
      public lat: number,
      public lng: number
    ) {}
  }

  class Size {
    constructor(
      public width: number,
      public height: number
    ) {}
  }

  (globalThis as unknown as { google: unknown }).google = {
    maps: {
      LatLng,
      Size,
      Geocoder,
      drawing: { DrawingManager, OverlayType: { POLYGON: 'polygon' } },
      event: {
        addListener: (target: unknown, event: string, handler: Listener) => {
          fake.registrations.push({ target, event, handler });
        },
      },
      places: { PlacesService, PlacesServiceStatus: { OK: 'OK' } },
    },
  };

  return fake;
}

export function uninstallGoogleMaps() {
  delete (globalThis as unknown as { google?: unknown }).google;
}
