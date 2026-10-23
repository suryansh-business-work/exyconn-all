import { Button } from '@exyconn/shell/components/ui';
import type {
  LeadSearchValues,
  SearchMode,
} from '../../../../src/pages/lead-generator/forms/lead-search';
import type { LeadPlace } from '../../../../src/pages/lead-generator/leadTypes';
import type { LatLng } from '../../../../src/maps/mapLinks';

const AROUND_MAP = { centre: 'map', lat: '', lng: '' } as const;

/** What the stand-in form submits for each mode. */
export const SEARCH_VALUES: Record<SearchMode, LeadSearchValues> = {
  place: {
    query: 'dentists',
    mode: 'place',
    location: 'Pune',
    radiusKm: 5,
    ...AROUND_MAP,
    area: [],
  },
  map: { query: 'dentists', mode: 'map', location: '', radiusKm: 2.5, ...AROUND_MAP, area: [] },
  area: {
    query: 'dentists',
    mode: 'area',
    location: '',
    radiusKm: 5,
    ...AROUND_MAP,
    area: [
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
      { lat: 5, lng: 6 },
    ],
  },
};

const MODES: readonly SearchMode[] = ['place', 'map', 'area'];

interface FormStubProps {
  searching: boolean;
  mapReady: boolean;
  mapHint: string;
  onModeChange: (mode: SearchMode) => void;
  onSearch: (values: LeadSearchValues) => void;
}

/** The lead search form, reduced to its contract: a button per mode and per search. */
export function LeadSearchFormStub({
  searching,
  mapReady,
  mapHint,
  onModeChange,
  onSearch,
}: Readonly<FormStubProps>) {
  return (
    <div>
      <p>{`hint: ${mapHint}`}</p>
      <p>{`searching: ${String(searching)}, map ready: ${String(mapReady)}`}</p>
      {MODES.map((mode) => (
        <Button key={mode} onClick={() => onModeChange(mode)}>{`Mode ${mode}`}</Button>
      ))}
      {MODES.map((mode) => (
        <Button key={mode} onClick={() => onSearch(SEARCH_VALUES[mode])}>{`Search ${mode}`}</Button>
      ))}
    </div>
  );
}

interface MapStubProps {
  apiKey: string | null;
  places: LeadPlace[];
  focusedId: string | null;
  drawEnabled: boolean;
  onFocus: (placeId: string) => void;
  onReadyChange: (ready: boolean) => void;
  onCentreChange: (centre: LatLng) => void;
}

/** The lead map, reduced to what the workspace passes it and the callbacks it fires. */
export function LeadMapStub({
  apiKey,
  places,
  focusedId,
  drawEnabled,
  onFocus,
  onReadyChange,
  onCentreChange,
}: Readonly<MapStubProps>) {
  return (
    <section aria-label="Map stand-in">
      <p>{`key: ${apiKey ?? 'none'}, drawing: ${String(drawEnabled)}`}</p>
      <p>{`markers: ${places.map((place) => place.placeId).join(',')}`}</p>
      <p>{`focused marker: ${focusedId ?? 'none'}`}</p>
      <Button onClick={() => onReadyChange(true)}>Map loaded</Button>
      <Button onClick={() => onCentreChange({ lat: 18.5, lng: 73.8 })}>Pan map</Button>
      {places.map((place) => (
        <Button key={place.placeId} onClick={() => onFocus(place.placeId)}>
          {`Marker ${place.placeId}`}
        </Button>
      ))}
    </section>
  );
}
