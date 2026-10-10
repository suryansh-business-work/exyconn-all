import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { SecretsProvider } from '../../../../shared/context/SecretsContext';
import { ThemeProvider } from '../../../../shared/context/ThemeContext';
import {
  installGoogleMaps,
  uninstallGoogleMaps,
  type GoogleMapsFake,
} from '../../../../__tests__/helpers/fakeGoogleMaps';
import Stepper from '@mui/material/Stepper';
import SearchStepper from './index';
import SearchStep from './SearchStep';

interface HarnessProps {
  hasApiKey?: boolean;
  isSearching?: boolean;
  initialTypes?: string[];
  initialQuery?: string;
  onSearch?: () => void;
  onLocationChange?: (lat: number, lng: number) => void;
  onLocationModeChange?: (mode: 'current' | 'search' | 'drag') => void;
}

/** Holds the state the real LeadGenerator owns, so the wizard can be walked through. */
const Harness: React.FC<HarnessProps> = ({
  hasApiKey = true,
  isSearching = false,
  initialTypes = [],
  initialQuery = '',
  onSearch = vi.fn(),
  onLocationChange,
  onLocationModeChange,
}) => {
  const [types, setTypes] = useState(initialTypes);
  const [query, setQuery] = useState(initialQuery);
  const [maxResults, setMaxResults] = useState(10);
  const [hasPolygon, setHasPolygon] = useState(false);
  return (
    <SearchStepper
      selectedTypes={types}
      onTypesChange={setTypes}
      searchQuery={query}
      onSearchQueryChange={setQuery}
      maxResults={maxResults}
      onMaxResultsChange={setMaxResults}
      onSearch={onSearch}
      isSearching={isSearching}
      hasPolygon={hasPolygon}
      onDrawPolygon={() => setHasPolygon(true)}
      hasApiKey={hasApiKey}
      onLocationChange={onLocationChange}
      onLocationModeChange={onLocationModeChange}
    />
  );
};

const mount = (props: HarnessProps = {}) =>
  render(
    <ThemeProvider>
      <SecretsProvider>
        <Harness {...props} />
      </SecretsProvider>
    </ThemeProvider>
  );

let maps: GoogleMapsFake;
let getCurrentPosition: ReturnType<typeof vi.fn>;

const setGeolocation = (value: unknown) =>
  Object.defineProperty(navigator, 'geolocation', { value, configurable: true });

beforeEach(() => {
  maps = installGoogleMaps();
  getCurrentPosition = vi.fn();
  setGeolocation({ getCurrentPosition });
});

afterEach(() => {
  cleanup();
  uninstallGoogleMaps();
  setGeolocation(undefined);
});

const LOCATION_PLACEHOLDER = 'City, area, or address...';
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

/** A step that was left stays mounted until its collapse animation ends; wait for that. */
const settle = () => waitFor(() => expect(document.querySelectorAll('.MuiStepContent-transition')).toHaveLength(1));

/** Clicks a button that moves the wizard and waits for the new step to be the only one open. */
const advance = async (name: string | RegExp) => {
  click(name);
  await settle();
};

/** Gets to the category step through the drag option. */
const goToCategories = () => advance(/Drag & Select on Map/);

describe('SearchStepper location step', () => {
  it('starts on the location step with Continue-less options', async () => {
    mount();
    expect(screen.getByText('Select Location')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use Current Location' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();
    expect(screen.getByText('🔍 Business Search Wizard')).toBeInTheDocument();
  });

  it('asks for a Maps key and disables every option without one', async () => {
    mount({ hasApiKey: false });
    expect(screen.getByText(/The search wizard needs a Google Maps key/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use Current Location' })).toBeDisabled();
    expect(screen.getByPlaceholderText(LOCATION_PLACEHOLDER)).toBeDisabled();
    expect(screen.getByRole('button', { name: /Drag & Select on Map/ })).toBeDisabled();
  });

  it('uses the current location and moves to the categories', async () => {
    const onLocationChange = vi.fn();
    const onLocationModeChange = vi.fn();
    getCurrentPosition.mockImplementationOnce((ok: (p: unknown) => void) =>
      ok({ coords: { latitude: 28.6, longitude: 77.2 } })
    );
    mount({ onLocationChange, onLocationModeChange });

    await advance('Use Current Location');

    expect(onLocationChange).toHaveBeenCalledWith(28.6, 77.2);
    expect(onLocationModeChange).toHaveBeenCalledWith('current');
    expect(screen.getByText('✓ Current Location')).toBeInTheDocument();
    expect(screen.getByText('Select Business Categories')).toBeInTheDocument();
    expect(screen.getByLabelText('Custom Search (optional)')).toBeVisible();
  });

  it('works without the optional location callbacks', async () => {
    getCurrentPosition.mockImplementationOnce((ok: (p: unknown) => void) =>
      ok({ coords: { latitude: 1, longitude: 2 } })
    );
    mount();
    await advance('Use Current Location');
    expect(screen.getByText('✓ Current Location')).toBeInTheDocument();
  });

  it('shows the busy state while waiting for the browser', async () => {
    mount();
    await advance('Use Current Location');
    expect(screen.getByRole('button', { name: 'Getting Location...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();
  });

  it('reports a denied location and lets the visitor dismiss the message', async () => {
    getCurrentPosition.mockImplementationOnce((_ok: unknown, fail: (e: { message: string }) => void) =>
      fail({ message: 'User denied Geolocation' })
    );
    mount();
    await advance('Use Current Location');
    expect(screen.getByText('Location error: User denied Geolocation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use Current Location' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText(/Location error/)).toBeNull();
  });

  it('reports a browser without geolocation', async () => {
    setGeolocation(undefined);
    mount();
    await advance('Use Current Location');
    expect(screen.getByText('Geolocation is not supported')).toBeInTheDocument();
  });

  it('geocodes a typed place and shows the resolved name', async () => {
    const onLocationChange = vi.fn();
    maps.geocodeAnswer = {
      status: 'OK',
      results: [{ formatted_address: 'Mumbai, India', geometry: { location: { lat: () => 19.07, lng: () => 72.87 } } }],
    };
    mount({ onLocationChange });
    fireEvent.change(screen.getByPlaceholderText(LOCATION_PLACEHOLDER), { target: { value: 'Mumbai' } });

    await advance('Go');

    expect(maps.geocode).toHaveBeenCalledWith({ address: 'Mumbai' }, expect.any(Function));
    expect(onLocationChange).toHaveBeenCalledWith(19.07, 72.87);
    expect(screen.getByText('✓ Mumbai, India')).toBeInTheDocument();
    expect(screen.getByText('Select Business Categories')).toBeInTheDocument();
  });

  it('searches when Enter is pressed in the location box, and asks for text when it is blank', async () => {
    maps.geocodeAnswer = {
      status: 'OK',
      results: [{ formatted_address: 'Pune', geometry: { location: { lat: () => 18.5, lng: () => 73.8 } } }],
    };
    mount();
    const box = screen.getByPlaceholderText(LOCATION_PLACEHOLDER);

    fireEvent.keyPress(box, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(screen.getByText('Please enter a location')).toBeInTheDocument();

    fireEvent.change(box, { target: { value: 'Pune' } });
    fireEvent.keyPress(box, { key: 'a', code: 'KeyA', charCode: 97 });
    expect(maps.geocode).not.toHaveBeenCalled();
    fireEvent.keyPress(box, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(screen.getByText('✓ Pune')).toBeInTheDocument();
  });

  it('reports a place Google cannot find, and one that came back empty', async () => {
    maps.geocodeAnswer = { status: 'ZERO_RESULTS', results: [] };
    mount();
    fireEvent.change(screen.getByPlaceholderText(LOCATION_PLACEHOLDER), { target: { value: 'Nowhere' } });
    await advance('Go');
    expect(screen.getByText('Location not found')).toBeInTheDocument();

    maps.geocodeAnswer = { status: 'OK', results: [] };
    await advance('Go');
    expect(screen.getByText('Location not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeEnabled();
  });

  it('reports that Google Maps is not loaded', async () => {
    uninstallGoogleMaps();
    mount();
    fireEvent.change(screen.getByPlaceholderText(LOCATION_PLACEHOLDER), { target: { value: 'Pune' } });
    await advance('Go');
    expect(screen.getByText('Google Maps not loaded')).toBeInTheDocument();
  });

  it('lets the visitor pick the area on the map instead', async () => {
    const onLocationModeChange = vi.fn();
    mount({ onLocationModeChange });
    await goToCategories();
    expect(onLocationModeChange).toHaveBeenCalledWith('drag');
    expect(screen.getByText('✓ Drag to select on map')).toBeInTheDocument();
  });

  it('drag works without a mode callback', async () => {
    mount();
    await goToCategories();
    expect(screen.getByText('Select Business Categories')).toBeInTheDocument();
  });
});

describe('SearchStepper category step', () => {
  it('cannot continue until a category or a query is set', async () => {
    mount();
    await goToCategories();
    expect(screen.getByRole('button', { name: /Continue/ })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Custom Search (optional)'), { target: { value: 'coffee' } });
    expect(screen.getByText('✓ Custom query set')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/ })).toBeEnabled();
  });

  it('toggles popular categories and clears them all', async () => {
    mount();
    await goToCategories();
    // The popular chips come first in the document; chosen categories are listed again below.
    const popular = (label: string) => screen.getAllByText(label, { selector: '.MuiChip-label' })[0];
    fireEvent.click(popular('🍽️ Restaurants'));
    fireEvent.click(popular('☕ Cafes'));
    expect(screen.getByText('Selected (2)')).toBeInTheDocument();
    expect(screen.getByText('2 categories selected')).toBeInTheDocument();

    fireEvent.click(popular('☕ Cafes'));
    expect(screen.getByText('Selected (1)')).toBeInTheDocument();

    click('Clear All');
    expect(screen.queryByText(/Selected \(/)).toBeNull();
    expect(screen.getByRole('button', { name: /Continue/ })).toBeDisabled();
  });

  it('removes a selected category with its delete icon and shows unknown ids as they are', async () => {
    mount({ initialTypes: ['hotel', 'zoo'] });
    await goToCategories();
    expect(screen.getByText('zoo', { selector: '.MuiChip-label' })).toBeInTheDocument();
    const hotelChip = screen
      .getByText('🏨 Hotels', { selector: '.MuiChip-label' })
      .closest('.MuiChip-root') as HTMLElement;
    fireEvent.click(within(hotelChip).getByTestId('CancelIcon'));
    expect(screen.getByText('Selected (1)')).toBeInTheDocument();
  });

  it('adds a category from the dropdown, filtered by text, without duplicating one already chosen', async () => {
    mount({ initialTypes: ['bank'] });
    await goToCategories();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');

    fireEvent.change(within(listbox).getByPlaceholderText('Filter categories...'), { target: { value: 'pharm' } });
    expect(within(listbox).queryByText('Hotels')).toBeNull();
    fireEvent.click(within(listbox).getByRole('option', { name: /Pharmacies/ }));
    expect(screen.getByText('Selected (2)')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('combobox'));
    const reopened = screen.getByRole('listbox');
    fireEvent.change(within(reopened).getByPlaceholderText('Filter categories...'), { target: { value: '' } });
    expect(within(reopened).getByRole('option', { name: /Banks/ })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.keyDown(within(reopened).getByPlaceholderText('Filter categories...'), { key: 'a' });
    fireEvent.click(within(reopened).getByPlaceholderText('Filter categories...'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.click(within(reopened).getByRole('option', { name: /Banks/ }));
    expect(screen.getByText('Selected (2)')).toBeInTheDocument();
  });

  it('goes back to the location step', async () => {
    mount();
    await goToCategories();
    await advance('Back');
    expect(screen.getByRole('button', { name: 'Use Current Location' })).toBeVisible();
  });
});

describe('SearchStepper area and search steps', () => {
  const toDrawStep = async (props: HarnessProps = {}) => {
    mount({ initialQuery: 'dentist', ...props });
    await goToCategories();
    await advance(/Continue/);
  };

  it('asks to draw the area and only offers Continue once a polygon exists', async () => {
    await toDrawStep();
    expect(screen.getByText('Draw Search Area')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Continue/ })).toBeNull();

    click('Click to Draw Polygon');

    expect(screen.getByText('✓ Area selected')).toBeInTheDocument();
    expect(screen.getByText(/Polygon drawn successfully/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/ })).toBeEnabled();
  });

  it('goes back from the draw step to the categories', async () => {
    await toDrawStep();
    await advance('Back');
    expect(screen.getByText('Select Business Categories')).toBeInTheDocument();
  });

  it('summarises the search and starts it', async () => {
    const onSearch = vi.fn();
    await toDrawStep({ onSearch, initialTypes: ['cafe', 'gym'] });
    click('Click to Draw Polygon');
    await advance(/Continue/);

    expect(screen.getByText('• Location: ✓ Drag to select on map')).toBeInTheDocument();
    expect(screen.getByText('• Area: ✓ Polygon defined')).toBeInTheDocument();
    expect(screen.getByText('• Categories: 2 selected')).toBeInTheDocument();
    expect(screen.getByText('• Custom Query: "dentist"')).toBeInTheDocument();
    expect(screen.getByText('• Max Results: 10')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider'), { target: { value: '250' } });
    expect(screen.getByText('• Max Results: 250')).toBeInTheDocument();

    click('Search Businesses');
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('shows the searching state and omits an empty query and categories', async () => {
    await toDrawStep({ isSearching: true, initialQuery: 'dentist' });
    click('Click to Draw Polygon');
    await advance(/Continue/);
    expect(screen.getByRole('button', { name: 'Searching...' })).toBeDisabled();
    expect(screen.getByText('• Categories: None')).toBeInTheDocument();
  });

  it('can go back from the search step', async () => {
    await toDrawStep();
    click('Click to Draw Polygon');
    await advance(/Continue/);
    await advance('Back');
    expect(screen.getByText('Draw Search Area')).toBeInTheDocument();
  });
});

describe('SearchStep on its own', () => {
  const renderStep = (props: Partial<React.ComponentProps<typeof SearchStep>> = {}) =>
    render(
      <Stepper activeStep={0} orientation="vertical">
        <SearchStep
          maxResults={10}
          onMaxResultsChange={vi.fn()}
          locationName={null}
          hasPolygon={false}
          selectedTypes={[]}
          searchQuery=""
          isSearching={false}
          canSearch={false}
          onSearch={vi.fn()}
          onBack={vi.fn()}
          {...props}
        />
      </Stepper>
    );

  it('flags what is still missing and keeps Search disabled', async () => {
    renderStep();
    expect(screen.getByText('• Location: ✗ Not set')).toBeInTheDocument();
    expect(screen.getByText('• Area: ✗ No area selected')).toBeInTheDocument();
    expect(screen.getByText('• Categories: None')).toBeInTheDocument();
    expect(screen.queryByText(/Custom Query/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Search Businesses' })).toBeDisabled();
  });

  it('reports slider changes as numbers', async () => {
    const onMaxResultsChange = vi.fn();
    renderStep({ onMaxResultsChange });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '500' } });
    expect(onMaxResultsChange).toHaveBeenCalledWith(500);
  });
});
