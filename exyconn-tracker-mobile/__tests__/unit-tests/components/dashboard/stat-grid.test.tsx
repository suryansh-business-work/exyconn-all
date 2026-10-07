import { fireEvent, screen, within } from '@testing-library/react';
import { AccessibilityInfo } from 'react-native';
import type { TrackerTotals } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { StatGrid } from '../../../../src/components/dashboard/StatGrid';
import { StatTile } from '../../../../src/components/dashboard/StatTile';
import { TileDetailDialog } from '../../../../src/components/dashboard/TileDetailDialog';
import { totalTiles } from '../../../../src/lib/dashboard/total-tiles';
import { renderWithProviders } from '../../test-utils';
import { ANDROID_CAPABILITIES } from '../state';

const TOTALS: TrackerTotals = {
  activeMs: 30 * 3_600_000,
  idleMs: 10 * 3_600_000,
  screenshots: 120,
  sessions: 12,
};

const TILES = totalTiles(TOTALS, ANDROID_CAPABILITIES);
const [WORKED] = TILES;

function openButton(label: string, value: string): HTMLElement {
  return screen.getByRole('button', { name: `${label}: ${value}. Open details` });
}

describe('StatTile', () => {
  it('shows the label and the figure, and opens its own detail', () => {
    const onOpen = vi.fn();
    renderWithProviders(<StatTile tile={WORKED} onOpen={onOpen} />);
    expect(screen.getByText(WORKED.label)).toBeInTheDocument();
    expect(screen.getByText(WORKED.value)).toBeInTheDocument();
    expect(screen.getByTestId(`icon-${WORKED.icon}`)).toBeInTheDocument();

    const button = openButton(WORKED.label, WORKED.value);
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledWith(WORKED.id, button);
  });
});

describe('StatGrid', () => {
  it('lays out every tile with nothing open', () => {
    renderWithProviders(<StatGrid tiles={TILES} />);
    for (const tile of TILES) {
      expect(openButton(tile.label, tile.value)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('rn-modal')).toBeNull();
  });

  it('explains a tapped number: the full figure, the facts around it and the rule', () => {
    renderWithProviders(<StatGrid tiles={TILES} />);
    fireEvent.click(openButton(WORKED.label, WORKED.value));
    const dialog = within(screen.getByTestId('rn-modal'));
    expect(dialog.getByText(WORKED.label)).toBeInTheDocument();
    for (const fact of WORKED.detail.facts) {
      expect(dialog.getByText(fact.label)).toBeInTheDocument();
      expect(dialog.getByText(fact.value)).toBeInTheDocument();
    }
    expect(dialog.getByText(WORKED.detail.note)).toBeInTheDocument();
  });

  it('moves the screen reader to the dialog’s title as it opens', () => {
    renderWithProviders(<StatGrid tiles={TILES} />);
    fireEvent.click(openButton(WORKED.label, WORKED.value));
    const title = within(screen.getByTestId('rn-modal')).getByText(WORKED.label);
    expect(AccessibilityInfo.sendAccessibilityEvent).toHaveBeenCalledWith(title, 'focus');
  });

  it('closes on Close, and on the back button', () => {
    renderWithProviders(<StatGrid tiles={TILES} />);
    fireEvent.click(openButton(WORKED.label, WORKED.value));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('rn-modal')).toBeNull();

    fireEvent.click(openButton(WORKED.label, WORKED.value));
    fireEvent.keyDown(screen.getByTestId('rn-modal'), { key: 'Escape' });
    expect(screen.queryByTestId('rn-modal')).toBeNull();
  });

  it('keeps an open detail ticking with the live figures behind it', () => {
    const { rerender } = renderWithProviders(<StatGrid tiles={TILES} />);
    const [idle] = TILES.slice(1);
    fireEvent.click(openButton(idle.label, idle.value));
    const later = totalTiles({ ...TOTALS, idleMs: 11 * 3_600_000 }, ANDROID_CAPABILITIES);
    rerender(<StatGrid tiles={later} />);
    const dialog = within(screen.getByTestId('rn-modal'));
    expect(dialog.getByText(later[1].detail.headline)).toBeInTheDocument();
    expect(dialog.queryByText(idle.detail.headline)).toBeNull();
  });
});

describe('TileDetailDialog', () => {
  const returnFocusTo = { current: null };

  it('renders nothing until a tile has been opened', () => {
    renderWithProviders(
      <TileDetailDialog tile={null} open onClose={vi.fn()} returnFocusTo={returnFocusTo} />,
    );
    expect(screen.queryByTestId('rn-modal')).toBeNull();
  });

  it('keeps the last tile mounted but hidden once closed', () => {
    renderWithProviders(
      <TileDetailDialog
        tile={WORKED}
        open={false}
        onClose={vi.fn()}
        returnFocusTo={returnFocusTo}
      />,
    );
    expect(screen.queryByTestId('rn-modal')).toBeNull();
    expect(screen.queryByText(WORKED.detail.note)).toBeNull();
  });

  it('closes through its own button', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <TileDetailDialog tile={WORKED} open onClose={onClose} returnFocusTo={returnFocusTo} />,
    );
    expect(screen.getByText(WORKED.detail.headline)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
