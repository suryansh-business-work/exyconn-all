import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import {
  MapKeyMissing,
  MapKeyRejected,
  MapLoadFailed,
} from '../../../../../src/pages/lead-generator/LeadMap/MapNotices';
import { renderWithProviders } from '../../../test-utils';

describe('map notices', () => {
  it('points Tech at the Google Maps settings when there is no Maps JavaScript key', () => {
    renderWithProviders(<MapKeyMissing />);

    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent('The map needs a Maps JavaScript key');
    expect(notice).toHaveTextContent('Searching a place still works');
    expect(
      within(notice).getByRole('link', { name: 'Tech > Environment Variables > Google Maps' }),
    ).toHaveAttribute('href', expect.stringContaining('/tech/environment-variables/google-maps'));
  });

  it("names this page's origin as the referrer a rejected key must allow", () => {
    renderWithProviders(<MapKeyRejected />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Google rejected the Maps key');
    expect(alert).toHaveTextContent(
      `Check that its HTTP referrer restrictions include ${globalThis.location.origin}/* and that the Maps JavaScript API is enabled.`,
    );
  });

  it('suggests checking the connection when the script cannot load', () => {
    renderWithProviders(<MapLoadFailed />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Google Maps could not be loaded');
    expect(alert).toHaveTextContent('Check your connection and any ad or script blocker');
  });
});
