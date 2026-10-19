import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { LeadMap } from '../../../../../src/pages/lead-generator/LeadMap';
import type { LeadMapProps } from '../../../../../src/pages/lead-generator/LeadMap/LeadMapBody';
import { renderWithProviders } from '../../../test-utils';
import { fakeArea } from '../search-area-fake';

// The real body needs Maps JavaScript; LeadMapBody.test.tsx covers it.
vi.mock('../../../../../src/pages/lead-generator/LeadMap/LeadMapBody', () => ({
  default: ({ apiKey, drawEnabled }: Readonly<LeadMapProps>) => (
    <div data-testid="map-body" data-key={apiKey} data-draw={drawEnabled} />
  ),
}));

function renderMap(apiKey: string | null, drawEnabled: boolean) {
  renderWithProviders(
    <LeadMap
      apiKey={apiKey}
      mapReady
      places={[]}
      focusedId={null}
      onFocus={vi.fn()}
      onReadyChange={vi.fn()}
      onCentreChange={vi.fn()}
      area={fakeArea()}
      drawEnabled={drawEnabled}
    />,
  );
}

describe('LeadMap', () => {
  it('explains the missing key instead of a map, without drawing controls', () => {
    renderMap(null, true);

    expect(screen.getByRole('region', { name: 'Map of the businesses found' })).toBeInTheDocument();
    expect(screen.getByText('The map needs a Maps JavaScript key')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Draw area' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('map-body')).not.toBeInTheDocument();
  });

  it('loads the map with the key, and the drawing controls for an area search', async () => {
    renderMap('maps-key', true);

    const body = await screen.findByTestId('map-body');
    expect(body.dataset.key).toBe('maps-key');
    expect(body.dataset.draw).toBe('true');
    expect(screen.getByRole('button', { name: 'Draw area' })).toBeEnabled();
  });

  it('leaves the drawing controls out for the other searches', async () => {
    renderMap('maps-key', false);

    expect(await screen.findByTestId('map-body')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Draw area' })).not.toBeInTheDocument();
  });
});
