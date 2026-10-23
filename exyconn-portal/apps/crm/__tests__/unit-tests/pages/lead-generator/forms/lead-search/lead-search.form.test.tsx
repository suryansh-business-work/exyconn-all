import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadSearchForm } from '../../../../../../src/pages/lead-generator/forms/lead-search';
import { renderWithProviders } from '../../../../test-utils';
import { fillField, press } from '../../../../form-helpers';
import { corners } from '../../search-area-fake';

/** A field's label as written, or followed by the red star a required field adds. */
function labelled(label: string | RegExp): RegExp {
  if (label instanceof RegExp) {
    return label;
  }
  const escaped = label.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return new RegExp(String.raw`^${escaped}\s*\*?$`);
}

const suggestions = vi.hoisted(() => ({ result: {} as Record<string, unknown> }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useLeadLocationSuggestionsQuery: () => suggestions.result,
}));

const MAP_HINT = 'The map is still loading';

interface Props {
  searching: boolean;
  mapReady: boolean;
  area: { lat: number; lng: number }[];
}

function renderForm(overrides: Partial<Props> = {}) {
  const props = { searching: false, mapReady: true, area: [], ...overrides };
  const onSearch = vi.fn();
  const onModeChange = vi.fn();
  const onCircleChange = vi.fn();
  const element = (next: Props) => (
    <LeadSearchForm
      {...next}
      mapHint={MAP_HINT}
      onModeChange={onModeChange}
      onCircleChange={onCircleChange}
      onSearch={onSearch}
    />
  );
  const view = renderWithProviders(element(props));
  const rerender = (next: Partial<Props>) => view.rerender(element({ ...props, ...next }));
  return { onSearch, onModeChange, onCircleChange, rerender };
}

/** Pastes `text` into the field labelled `label`; typing 201 characters one by one is slow. */
async function pasteInto(label: string, text: string) {
  await userEvent.click(screen.getByLabelText(labelled(label)));
  await userEvent.paste(text);
}

const mode = (name: string) => screen.getByRole('button', { name });

async function chooseRadius(label: string) {
  await userEvent.click(screen.getByRole('combobox', { name: labelled('Radius') }));
  await userEvent.click(await screen.findByRole('option', { name: label }));
}
const searched = (onSearch: ReturnType<typeof vi.fn>) => onSearch.mock.calls[0]?.[0];

describe('LeadSearchForm', () => {
  beforeEach(() => {
    suggestions.result = { loading: false };
  });

  it('needs something to look for and a place', async () => {
    const { onSearch } = renderForm();

    await press('Search Google Places');

    expect(await screen.findByText('Describe what to look for, e.g. dentists')).toBeInTheDocument();
    expect(
      screen.getByText('Enter a place, e.g. Pune, India — or search on the map'),
    ).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('limits what is typed to 200 characters', async () => {
    const { onSearch } = renderForm();
    await pasteInto('What to look for', 'x'.repeat(201));
    await pasteInto('Where', 'y'.repeat(201));

    await press('Search Google Places');

    expect(await screen.findAllByText('At most 200 characters')).toHaveLength(2);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('searches a typed place, trimmed', async () => {
    const { onSearch, onModeChange } = renderForm();
    await fillField('What to look for', '  dentists ');
    await fillField('Where', 'Pune, India ');

    await press('Search Google Places');

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    expect(searched(onSearch)).toEqual({
      query: 'dentists',
      mode: 'place',
      location: 'Pune, India',
      radiusKm: 5,
      centre: 'map',
      lat: '',
      lng: '',
      area: [],
    });
    expect(onModeChange).toHaveBeenLastCalledWith('place');
  });

  it('offers the map searches only once the map works, and says why', () => {
    renderForm({ mapReady: false });

    expect(mode('A place')).toBeEnabled();
    expect(mode('Around a point')).toBeDisabled();
    expect(mode('Inside a drawn area')).toBeDisabled();
    expect(screen.getByText(MAP_HINT)).toBeInTheDocument();
  });

  it('shows no hint for a place search while the map works', () => {
    renderForm();

    expect(screen.queryByText(MAP_HINT)).not.toBeInTheDocument();
  });

  it('keeps the chosen mode when it is clicked again', async () => {
    const { onModeChange } = renderForm();

    await userEvent.click(mode('A place'));

    expect(mode('A place')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/^Where\s*\*?$/)).toBeInTheDocument();
    expect(onModeChange).toHaveBeenCalledTimes(1);
  });

  it('searches around the map centre within the radius chosen', async () => {
    const { onSearch, onModeChange, onCircleChange } = renderForm();
    expect(onCircleChange).toHaveBeenLastCalledWith(null);
    await userEvent.click(mode('Around a point'));
    expect(onModeChange).toHaveBeenLastCalledWith('map');
    expect(screen.queryByLabelText(/^Where\s*\*?$/)).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /The map centre/ })).toBeChecked();
    await fillField('What to look for', 'bakeries');

    await chooseRadius('10 km');
    expect(onCircleChange).toHaveBeenLastCalledWith({ centre: null, radiusKm: 10 });
    await press('Search Google Places');

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    expect(searched(onSearch)).toMatchObject({
      mode: 'map',
      centre: 'map',
      radiusKm: 10,
      query: 'bakeries',
    });
  });

  it('searches around typed coordinates, and only real ones', async () => {
    const { onSearch, onCircleChange } = renderForm();
    await userEvent.click(mode('Around a point'));
    await userEvent.click(screen.getByRole('radio', { name: /Latitude and longitude/ }));
    await fillField('What to look for', 'bakeries');
    await fillField('Latitude', '95');
    await fillField('Longitude', '-181');

    await press('Search Google Places');
    expect(await screen.findByText('Enter a latitude between -90 and 90')).toBeInTheDocument();
    expect(screen.getByText('Enter a longitude between -180 and 180')).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();

    await fillField('Latitude', '12.97');
    await fillField('Longitude', '77.59');
    await press('Search Google Places');

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    expect(searched(onSearch)).toMatchObject({ centre: 'coords', lat: '12.97', lng: '77.59' });
    expect(onCircleChange).toHaveBeenLastCalledWith({
      centre: { lat: 12.97, lng: 77.59 },
      radiusKm: 5,
    });
  });

  it('searches near the reader once the browser says where they are', async () => {
    const located = vi.fn((done: PositionCallback) =>
      done({ coords: { latitude: 18.5204, longitude: 73.8567 } } as GeolocationPosition),
    );
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: located } });
    const { onSearch } = renderForm();
    await userEvent.click(mode('Around a point'));
    await userEvent.click(screen.getByRole('radio', { name: /Near me/ }));
    await fillField('What to look for', 'bakeries');

    expect(await screen.findByText('Your location: 18.520400, 73.856700')).toBeInTheDocument();
    await press('Search Google Places');

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    expect(searched(onSearch)).toMatchObject({ centre: 'me', lat: '18.520400', lng: '73.856700' });
    vi.unstubAllGlobals();
  });

  it('shows that it is still finding the reader', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: vi.fn() } });
    renderForm();
    await userEvent.click(mode('Around a point'));
    await userEvent.click(screen.getByRole('radio', { name: /Near me/ }));

    expect(screen.getByRole('button', { name: 'Finding you…' })).toBeDisabled();
    vi.unstubAllGlobals();
  });

  it('explains a blocked location and will not search near the reader without it', async () => {
    const denied = { code: 1, PERMISSION_DENIED: 1, TIMEOUT: 3 } as GeolocationPositionError;
    const blocked = vi.fn((_done: PositionCallback, fail: PositionErrorCallback) => fail(denied));
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: blocked } });
    const { onSearch } = renderForm();
    await userEvent.click(mode('Around a point'));
    await userEvent.click(screen.getByRole('radio', { name: /Near me/ }));
    await fillField('What to look for', 'bakeries');

    expect(await screen.findByText(/Location access is blocked/)).toBeInTheDocument();
    await press('Search Google Places');
    expect(await screen.findByText(/Your location is not known yet/)).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();

    await press('Locate me');
    expect(blocked).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it('goes back to a place search when the map stops working', async () => {
    const { onModeChange, rerender } = renderForm();
    await userEvent.click(mode('Around a point'));

    rerender({ mapReady: false });

    await waitFor(() => expect(onModeChange).toHaveBeenLastCalledWith('place'));
    expect(screen.getByLabelText(/^Where\s*\*?$/)).toBeInTheDocument();
  });

  it('needs a drawn area of at least 3 corners, and takes it once drawn', async () => {
    const { onSearch, rerender } = renderForm();
    await userEvent.click(mode('Inside a drawn area'));
    expect(screen.getByText(/^Use Draw area by the map/)).toBeInTheDocument();
    await fillField('What to look for', 'dentists');

    await press('Search Google Places');
    const error = 'Draw an area on the map with at least 3 points, then choose Finish area';
    expect(await screen.findByText(error)).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();

    rerender({ area: corners(3) });
    await waitFor(() => expect(screen.queryByText(error)).not.toBeInTheDocument());
    await press('Search Google Places');

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    expect(searched(onSearch)).toMatchObject({ mode: 'area', area: corners(3) });
  });

  it('refuses an area with more than 50 corners', async () => {
    const { onSearch } = renderForm({ area: corners(51) });
    await userEvent.click(mode('Inside a drawn area'));
    await fillField('What to look for', 'dentists');

    await press('Search Google Places');

    expect(await screen.findByText('An area can have at most 50 points')).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('cannot be sent again while a search is running', () => {
    renderForm({ searching: true });

    expect(screen.getByRole('button', { name: 'Searching…' })).toBeDisabled();
  });
});
