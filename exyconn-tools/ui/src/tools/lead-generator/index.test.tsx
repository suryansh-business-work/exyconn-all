import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderTool } from '../../__tests__/helpers/toolHarness';
import { writeSecret } from '../../shared/services/secrets';
import {
  fakeMap,
  installGoogleMaps,
  makePath,
  placeAt,
  resetMapsLoader,
  uninstallGoogleMaps,
  type GoogleMapsFake,
} from '../../__tests__/helpers/fakeGoogleMaps';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../../__tests__/helpers/toolHarness')).toolLayoutStub()
);
vi.mock('@react-google-maps/api', async () =>
  (await import('../../__tests__/helpers/fakeGoogleMaps')).reactGoogleMapsApiStub()
);

import LeadGenerator from './index';

const SQUARE = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 10 },
  { lat: 10, lng: 10 },
  { lat: 10, lng: 0 },
];

let maps: GoogleMapsFake;

const setGeolocation = (value: unknown) =>
  Object.defineProperty(navigator, 'geolocation', { value, configurable: true });

beforeEach(() => {
  localStorage.clear();
  resetMapsLoader();
  maps = installGoogleMaps();
  setGeolocation(undefined);
});

afterEach(() => {
  cleanup();
  uninstallGoogleMaps();
  localStorage.clear();
  vi.restoreAllMocks();
});

/** Walks the wizard: drag location, a custom query, the map polygon, then the search step. */
async function reachSearchStep() {
  // A step that was left stays mounted until its collapse animation ends.
  const settle = () => waitFor(() => expect(document.querySelectorAll('.MuiStepContent-transition')).toHaveLength(1));
  fireEvent.click(screen.getByRole('button', { name: /Drag & Select on Map/ }));
  await settle();
  fireEvent.change(screen.getByLabelText('Custom Search (optional)'), { target: { value: 'pizza' } });
  fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
  await settle();
  fireEvent.click(screen.getByRole('button', { name: 'Click to Draw Polygon' }));
  const path = makePath(SQUARE.map((p) => ({ ...p })));
  const polygoncomplete = maps.registrations.find((r) => r.event === 'polygoncomplete');
  expect(polygoncomplete).toBeDefined();
  await waitFor(() => expect(maps.drawingManagers).toHaveLength(1));
  act(() => polygoncomplete?.handler({ getPath: () => path, setMap: vi.fn() }));
  fireEvent.click(await screen.findByRole('button', { name: /Continue/ }));
  await settle();
}

describe('LeadGenerator', () => {
  it('asks for both keys and offers the empty list', () => {
    renderTool(LeadGenerator);
    expect(screen.getByRole('heading', { name: 'Lead Generator' })).toBeInTheDocument();
    expect(screen.getByText('The map needs a Google Maps key to draw your search area.')).toBeInTheDocument();
    expect(screen.getByText(/The search wizard needs a Google Maps key/)).toBeInTheDocument();
    expect(screen.getByText(/No businesses found. Draw a polygon/)).toBeInTheDocument();
  });

  it('shows the map once a Maps key is saved in the settings panel', async () => {
    renderTool(LeadGenerator);
    fireEvent.change(screen.getByLabelText('Google Maps API Key'), { target: { value: 'maps-key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Keys' }));

    expect(await screen.findByTestId('google-map')).toBeInTheDocument();
    expect(screen.queryByText(/The search wizard needs a Google Maps key/)).toBeNull();
  });

  it('picks up a Maps key saved elsewhere once the secrets drawer is closed again', async () => {
    renderTool(LeadGenerator);
    expect(screen.queryByTestId('google-map')).toBeNull();
    writeSecret('google_maps_api_key', 'from-drawer');

    fireEvent.click(screen.getAllByRole('button', { name: 'Add key' })[0]);
    const drawer = await waitFor(() => {
      const root = document.querySelector('.MuiDrawer-root');
      expect(root).not.toBeNull();
      return root as HTMLElement;
    });
    fireEvent.keyDown(drawer, { key: 'Escape' });

    expect(await screen.findByTestId('google-map')).toBeInTheDocument();
  });

  it('draws an area from the wizard, searches with the stored Places key and lists the results', async () => {
    writeSecret('google_maps_api_key', 'maps-key');
    writeSecret('google_places_api_key', 'places-key');
    maps.searchAnswers.push({ status: 'OK', results: [placeAt(5, 5, { rating: 4.4, user_ratings_total: 9 })] });
    maps.details = { formatted_phone_number: '+1 555 0100' };
    renderTool(LeadGenerator);

    await reachSearchStep();
    expect(screen.getByText('• Area: ✓ Polygon defined')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Search Businesses' }));

    expect(await screen.findByText('Found Businesses (1)', undefined, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('Shop 5-5')).toBeInTheDocument();
    expect(await screen.findByText('Found 1 businesses in the selected area')).toBeInTheDocument();
    expect(screen.getByTestId('marker')).toBeInTheDocument();
    const keyword = (maps.nearbySearch.mock.calls[0][0] as { keyword: string }).keyword;
    expect(keyword).toBe('pizza');
  });

  it('selects a business from the list and clears the results with the map', async () => {
    writeSecret('google_maps_api_key', 'maps-key');
    writeSecret('google_places_api_key', 'places-key');
    maps.searchAnswers.push({ status: 'OK', results: [placeAt(5, 5)] });
    renderTool(LeadGenerator);
    await reachSearchStep();
    fireEvent.click(screen.getByRole('button', { name: 'Search Businesses' }));
    fireEvent.click(await screen.findByText('Shop 5-5', undefined, { timeout: 5000 }));

    expect(screen.getByTestId('info-window')).toHaveTextContent('Shop 5-5');
    fireEvent.click(screen.getByRole('button', { name: 'Close info window' }));
    expect(screen.queryByTestId('info-window')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Clear Area' }));
    await waitFor(() => expect(screen.queryByText('Found Businesses (1)')).toBeNull());
    expect(screen.getByText(/No businesses found. Draw a polygon/)).toBeInTheDocument();
  });

  it('asks for the Places key instead of searching without one', async () => {
    writeSecret('google_maps_api_key', 'maps-key');
    renderTool(LeadGenerator);
    await reachSearchStep();

    fireEvent.click(screen.getByRole('button', { name: 'Search Businesses' }));

    expect(await screen.findByText(/uses the Google Places API with your own key/)).toBeInTheDocument();
    expect(maps.nearbySearch).not.toHaveBeenCalled();
  });

  it('shows the error notice and closes it', async () => {
    writeSecret('google_maps_api_key', 'maps-key');
    writeSecret('google_places_api_key', 'places-key');
    renderTool(LeadGenerator);
    await reachSearchStep();
    uninstallGoogleMaps();

    fireEvent.click(screen.getByRole('button', { name: 'Search Businesses' }));

    const message = 'Google Places library not loaded. Please refresh the page.';
    const alert = (await screen.findByText(message)).closest('[role="alert"]') as HTMLElement;
    fireEvent.click(within(alert).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText(message)).toBeNull());
  });

  it('closes the success notice', async () => {
    writeSecret('google_maps_api_key', 'maps-key');
    writeSecret('google_places_api_key', 'places-key');
    maps.searchAnswers.push({ status: 'OK', results: [placeAt(5, 5)] });
    renderTool(LeadGenerator);
    await reachSearchStep();
    fireEvent.click(screen.getByRole('button', { name: 'Search Businesses' }));
    const message = 'Found 1 businesses in the selected area';
    const alert = (await screen.findByText(message, undefined, { timeout: 5000 })).closest(
      '[role="alert"]'
    ) as HTMLElement;
    fireEvent.click(within(alert).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText(message)).toBeNull());
  });

  it('pans the map to a location chosen in the wizard', async () => {
    writeSecret('google_maps_api_key', 'maps-key');
    maps.geocodeAnswer = {
      status: 'OK',
      results: [{ formatted_address: 'Delhi', geometry: { location: { lat: () => 28.6, lng: () => 77.2 } } }],
    };
    renderTool(LeadGenerator);
    fireEvent.change(screen.getByPlaceholderText('City, area, or address...'), { target: { value: 'Delhi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));

    await waitFor(() => expect(fakeMap.panTo).toHaveBeenCalledWith({ lat: 28.6, lng: 77.2 }));
  });
});
