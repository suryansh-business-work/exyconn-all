import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import {
  MapKeyNotSet,
  MapKeyRejected,
  MapLoadFailed,
  MapNotice,
  MapSkeleton,
  TECH_GOOGLE_MAPS_PATH,
} from '@/components/maps';
import { renderWithProviders } from '../../test-utils';

describe('map notices', () => {
  it('points at the Google Maps settings in Tech when no Maps JavaScript key is saved', () => {
    renderWithProviders(<MapKeyNotSet />);
    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent('The map needs a Maps JavaScript key');
    expect(
      within(notice).getByRole('link', { name: 'Tech > Environment Variables > Google Maps' }),
    ).toHaveAttribute('href', expect.stringContaining(TECH_GOOGLE_MAPS_PATH));
  });

  it("names this page's origin as the referrer a rejected key must allow", () => {
    renderWithProviders(<MapKeyRejected />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Google rejected the Maps key');
    expect(alert).toHaveTextContent(`${globalThis.location.origin}/*`);
  });

  it('suggests checking the connection when the script cannot load', () => {
    renderWithProviders(<MapLoadFailed />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Google Maps could not be loaded');
    expect(alert).toHaveTextContent('Check your connection');
  });

  it('draws an info notice with the neutral icon and an error one with the error icon', () => {
    const { unmount } = renderWithProviders(
      <MapNotice tone="info" title="No pins yet">
        Nothing to show
      </MapNotice>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('No pins yetNothing to show');
    expect(screen.getByTestId('MapOutlinedIcon')).toBeInTheDocument();
    unmount();
    renderWithProviders(
      <MapNotice tone="error" title="Broken">
        Try again
      </MapNotice>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('BrokenTry again');
    expect(screen.getByTestId('ErrorOutlineOutlinedIcon')).toBeInTheDocument();
  });
});

describe('MapSkeleton', () => {
  it("holds the map's height and announces that the map is loading", () => {
    renderWithProviders(<MapSkeleton height={320} />);
    expect(screen.getByRole('status', { name: 'Loading the map' })).toHaveStyle({
      height: '320px',
    });
    expect(screen.getByTestId('skeleton-map')).toBeInTheDocument();
  });
});
