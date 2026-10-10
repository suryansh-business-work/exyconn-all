import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readSecret, writeSecret } from '../../../shared/services/secrets';
import APISettingsPanel from './APISettingsPanel';

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('APISettingsPanel', () => {
  it('opens expanded and unconfigured when no key is stored', () => {
    render(<APISettingsPanel />);
    expect(screen.getByLabelText('Google Maps API Key')).toBeVisible();
    expect(screen.queryByText('✓ Configured')).toBeNull();
    expect(screen.getByText(/MVP Tool - Local Storage Only/)).toBeInTheDocument();
  });

  it('saves both keys through the secrets store, reports them and shows Saved! briefly', async () => {
    const onSettingsChange = vi.fn();
    render(<APISettingsPanel onSettingsChange={onSettingsChange} />);
    fireEvent.change(screen.getByLabelText('Google Maps API Key'), { target: { value: 'maps-123' } });
    fireEvent.change(screen.getByLabelText('Google Places API Key'), { target: { value: 'places-456' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save Keys' }));

    expect(readSecret('google_maps_api_key')).toBe('maps-123');
    expect(readSecret('google_places_api_key')).toBe('places-456');
    expect(onSettingsChange).toHaveBeenCalledWith({ googleMapsApiKey: 'maps-123', googlePlacesApiKey: 'places-456' });
    expect(screen.getByRole('button', { name: 'Saved!' })).toBeInTheDocument();
    expect(screen.getByText('✓ Configured')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Keys' })).toBeInTheDocument(), {
      timeout: 4000,
    });
  });

  it('saves without a change callback', () => {
    render(<APISettingsPanel />);
    fireEvent.change(screen.getByLabelText('Google Maps API Key'), { target: { value: 'only-maps' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Keys' }));
    expect(readSecret('google_maps_api_key')).toBe('only-maps');
    expect(screen.queryByText('✓ Configured')).toBeNull();
  });

  it('starts collapsed when a Maps key is already stored, and expands from the header', async () => {
    writeSecret('google_maps_api_key', 'stored-maps');
    writeSecret('google_places_api_key', 'stored-places');
    render(<APISettingsPanel />);
    expect(screen.getByText('✓ Configured')).toBeInTheDocument();
    expect(screen.getByLabelText('Google Maps API Key')).toHaveValue('stored-maps');
    expect(screen.getByLabelText('Google Maps API Key')).not.toBeVisible();

    fireEvent.click(screen.getByText('API Settings'));
    await waitFor(() => expect(screen.getByLabelText('Google Maps API Key')).toBeVisible());

    fireEvent.click(screen.getByText('API Settings'));
    await waitFor(() => expect(screen.getByLabelText('Google Maps API Key')).not.toBeVisible());
  });

  it('shows and hides each key independently', () => {
    render(<APISettingsPanel />);
    const maps = screen.getByLabelText('Google Maps API Key');
    const places = screen.getByLabelText('Google Places API Key');
    expect(maps).toHaveAttribute('type', 'password');
    expect(places).toHaveAttribute('type', 'password');

    const toggles = screen.getAllByTestId('VisibilityIcon').map((icon) => icon.closest('button') as HTMLElement);
    fireEvent.click(toggles[0]);
    expect(maps).toHaveAttribute('type', 'text');
    expect(places).toHaveAttribute('type', 'password');
    fireEvent.click(toggles[1]);
    expect(places).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getAllByTestId('VisibilityOffIcon')[0].closest('button') as HTMLElement);
    expect(maps).toHaveAttribute('type', 'password');
  });
});
