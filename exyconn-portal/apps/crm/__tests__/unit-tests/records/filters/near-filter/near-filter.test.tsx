import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import {
  LeadLocationSuggestionsDocument,
  PlaceCoordinatesDocument,
} from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  NearFilterButton,
  NearFilterChip,
  nearFilterSchema,
  nearInputOf,
  toNearFilter,
  toNearFormValues,
  type NearFilter,
} from '../../../../../src/records/filters/near-filter';
import { renderWithProviders } from '../../../test-utils';

const KORAMANGALA: NearFilter = { lat: 12.93, lng: 77.62, radiusKm: 5, label: 'Koramangala' };

const suggestions: MockLink.MockedResponse = {
  request: { query: LeadLocationSuggestionsDocument, variables: { input: 'Kora' } },
  result: {
    data: {
      leadLocationSuggestions: [
        {
          __typename: 'LeadLocationSuggestion',
          placeId: 'place-1',
          text: 'Koramangala, Bengaluru',
          mainText: 'Koramangala',
          secondaryText: 'Bengaluru',
        },
      ],
    },
  },
};

const coordinates = (found: boolean): MockLink.MockedResponse => ({
  request: { query: PlaceCoordinatesDocument, variables: { placeId: 'place-1' } },
  ...(found
    ? { result: { data: { placeCoordinates: { __typename: 'LatLng', lat: 12.93, lng: 77.62 } } } }
    : { error: new Error('Google Places is not configured') }),
});

async function open(near: NearFilter | null = null, mocks: MockLink.MockedResponse[] = []) {
  const onApply = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(<NearFilterButton near={near} onApply={onApply} />, { mocks });
  await user.click(screen.getByRole('button', { name: 'Near a location' }));
  return { onApply, user };
}

const field = (name: string) => screen.getByRole('textbox', { name: new RegExp(`^${name}`) });

function withBrowser(getCurrentPosition: Geolocation['getCurrentPosition']) {
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('nearFilterSchema', () => {
  const parse = (lat: string, lng: string, radiusKm: unknown = 10) =>
    nearFilterSchema.safeParse({ lat, lng, radiusKm }).error?.issues.map((issue) => issue.message);

  it('accepts a centre in range and a listed radius', () => {
    expect(nearFilterSchema.parse({ lat: ' -90 ', lng: '180', radiusKm: '25' })).toEqual({
      lat: '-90',
      lng: '180',
      radiusKm: 25,
    });
  });

  it('needs both coordinates as numbers in range, and a listed radius', () => {
    expect(parse('', '')).toEqual([
      'Enter the latitude, or use your location or a place',
      'Enter the longitude, or use your location or a place',
    ]);
    expect(parse('north', '77,5')).toEqual([
      'The latitude is a number, e.g. 12.9716',
      'The longitude is a number, e.g. 77.5946',
    ]);
    expect(parse('90.1', '-180.5', 7)).toEqual([
      'Latitude is from -90 to 90',
      'Longitude is from -180 to 180',
      'Choose a radius',
    ]);
  });
});

describe('near filter values', () => {
  it('starts empty at 10 km, or from the filter in place', () => {
    expect(toNearFormValues(null)).toEqual({ lat: '', lng: '', radiusKm: 10 });
    expect(toNearFormValues(KORAMANGALA)).toEqual({ lat: '12.93', lng: '77.62', radiusKm: 5 });
  });

  it('keeps the centre name only while its coordinates are unchanged', () => {
    const values = { lat: '12.93', lng: '77.62', radiusKm: 5 };
    expect(toNearFilter(values, KORAMANGALA)).toEqual(KORAMANGALA);
    expect(toNearFilter({ ...values, lng: '77.7' }, KORAMANGALA).label).toBe('');
    expect(toNearFilter(values, null).label).toBe('');
  });

  it('sends the server the circle only', () => {
    expect(nearInputOf(KORAMANGALA)).toEqual({ lat: 12.93, lng: 77.62, radiusKm: 5 });
    expect(nearInputOf(null)).toBeUndefined();
  });
});

describe('NearFilterButton', () => {
  it('applies typed coordinates and a chosen radius', async () => {
    const { onApply, user } = await open();
    await user.type(field('Latitude'), '12.97');
    await user.type(field('Longitude'), '77.59');
    await user.click(screen.getByRole('combobox', { name: /^Radius/ }));
    await user.click(screen.getByRole('option', { name: '25 km' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({ lat: 12.97, lng: 77.59, radiusKm: 25, label: '' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('explains what is missing instead of applying', async () => {
    const { onApply, user } = await open();
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(
      await screen.findByText('Enter the latitude, or use your location or a place'),
    ).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Remove filter' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('centres on the browser position, named until it is edited', async () => {
    withBrowser((done: PositionCallback) =>
      done({ coords: { latitude: 12.5, longitude: 77.5 } } as GeolocationPosition),
    );
    const { onApply, user } = await open();
    await user.click(screen.getByRole('button', { name: 'Use my location' }));
    await waitFor(() => expect(field('Latitude')).toHaveValue('12.5'));
    expect(field('Longitude')).toHaveValue('77.5');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() =>
      expect(onApply).toHaveBeenLastCalledWith({
        lat: 12.5,
        lng: 77.5,
        radiusKm: 10,
        label: 'Your location',
      }),
    );
  });

  it('shows that it is finding the browser position', async () => {
    withBrowser(vi.fn());
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: 'Use my location' }));
    expect(screen.getByRole('button', { name: 'Finding your location…' })).toBeDisabled();
  });

  it('says why the browser position is unavailable', async () => {
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    withBrowser((_done: PositionCallback, fail?: PositionErrorCallback | null) =>
      fail?.({ code: 1, PERMISSION_DENIED: 1, TIMEOUT: 3 } as GeolocationPositionError),
    );
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: 'Use my location' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Location access is blocked.');
  });

  it('centres on a suggested place', async () => {
    const { onApply, user } = await open(null, [suggestions, coordinates(true)]);
    await user.type(screen.getByRole('combobox', { name: 'Search a place' }), 'Kora');
    await user.click(await screen.findByRole('option', { name: 'Koramangala, Bengaluru' }));
    await waitFor(() => expect(field('Latitude')).toHaveValue('12.93'));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({
        lat: 12.93,
        lng: 77.62,
        radiusKm: 10,
        label: 'Koramangala, Bengaluru',
      }),
    );
  });

  it('leaves the centre alone when the place is cleared', async () => {
    const { user } = await open(null, [suggestions, coordinates(true)]);
    await user.type(screen.getByRole('combobox', { name: 'Search a place' }), 'Kora');
    await user.click(await screen.findByRole('option', { name: 'Koramangala, Bengaluru' }));
    await waitFor(() => expect(field('Latitude')).toHaveValue('12.93'));
    await user.clear(screen.getByRole('combobox', { name: 'Search a place' }));
    expect(screen.getByRole('combobox', { name: 'Search a place' })).toHaveValue('');
    expect(field('Latitude')).toHaveValue('12.93');
  });

  it('says when a place cannot be found on the map', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const { user } = await open(null, [suggestions, coordinates(false)]);
    await user.type(screen.getByRole('combobox', { name: 'Search a place' }), 'Kora');
    await user.click(await screen.findByRole('option', { name: 'Koramangala, Bengaluru' }));
    expect(
      await screen.findByText(
        'That place could not be found on the map. Try another, or enter the coordinates.',
      ),
    ).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith('crm: place coordinates lookup failed', expect.any(Error));
    expect(field('Latitude')).toHaveValue('');
  });

  it('edits the filter in place, or removes it', async () => {
    const { onApply, user } = await open(KORAMANGALA);
    expect(field('Latitude')).toHaveValue('12.93');
    await user.click(screen.getByRole('button', { name: 'Remove filter' }));
    expect(onApply).toHaveBeenCalledWith(null);
  });
});

describe('NearFilterChip', () => {
  it('names the circle by its place, else its coordinates, and removes it', async () => {
    const onRemove = vi.fn();
    const { rerender } = renderWithProviders(
      <NearFilterChip near={KORAMANGALA} onRemove={onRemove} />,
    );
    expect(screen.getByText('Within 5 km of Koramangala')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('CancelIcon'));
    expect(onRemove).toHaveBeenCalled();

    rerender(<NearFilterChip near={{ ...KORAMANGALA, label: '' }} onRemove={onRemove} />);
    expect(screen.getByText('Within 5 km of 12.93, 77.62')).toBeInTheDocument();

    rerender(<NearFilterChip near={null} onRemove={onRemove} />);
    expect(screen.queryByText(/Within/)).not.toBeInTheDocument();
  });
});
