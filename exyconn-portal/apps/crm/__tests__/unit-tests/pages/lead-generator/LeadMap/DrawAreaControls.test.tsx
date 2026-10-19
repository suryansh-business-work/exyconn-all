import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { DrawAreaControls } from '../../../../../src/pages/lead-generator/LeadMap/DrawAreaControls';
import { renderWithProviders } from '../../../test-utils';
import { press } from '../../../form-helpers';
import { corners, fakeArea } from '../search-area-fake';

const button = (name: string) => screen.getByRole('button', { name });
const status = () => screen.getByRole('status');

function renderControls(area: ReturnType<typeof fakeArea>, mapReady = true) {
  renderWithProviders(<DrawAreaControls area={area} mapReady={mapReady} />);
  return area;
}

describe('DrawAreaControls', () => {
  it('waits for the map before drawing can start', () => {
    renderControls(fakeArea(), false);

    expect(status()).toHaveTextContent('The map is loading…');
    expect(button('Draw area')).toBeDisabled();
    expect(button('Clear area')).toBeDisabled();
  });

  it('explains how to draw and starts drawing on request', async () => {
    const area = renderControls(fakeArea());

    expect(status()).toHaveTextContent(
      'Choose Draw area, then click the map to mark the corners. Drawing needs a mouse, pen or touch.',
    );
    await press('Draw area');

    expect(area.start).toHaveBeenCalledTimes(1);
  });

  it('offers to finish only once there are enough corners, and to undo one', async () => {
    const area = renderControls(fakeArea({ drawing: true, points: corners(2) }));

    expect(status()).toHaveTextContent(
      'Drawing: 2 corners. Click the map to add more, then Finish area (at least 3).',
    );
    expect(button('Finish area')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Draw area' })).not.toBeInTheDocument();
    await press('Undo point');

    expect(area.undo).toHaveBeenCalledTimes(1);
  });

  it('has nothing to undo at the first corner, but drawing can still be cleared', async () => {
    const area = renderControls(fakeArea({ drawing: true }));

    expect(button('Undo point')).toBeDisabled();
    await press('Clear area');

    expect(area.clear).toHaveBeenCalledTimes(1);
  });

  it('says when the corner limit is reached and finishes the area', async () => {
    const area = renderControls(fakeArea({ drawing: true, points: corners(50) }));

    expect(status()).toHaveTextContent(
      'That is the most corners an area can have (50). Choose Finish area.',
    );
    await press('Finish area');

    expect(area.finish).toHaveBeenCalledTimes(1);
  });

  it('offers a redraw once an area is ready', async () => {
    const area = renderControls(fakeArea({ points: corners(4) }));

    expect(status()).toHaveTextContent(
      'Area ready with 4 corners. Drag a corner to adjust it, then search.',
    );
    await press('Redraw area');

    expect(area.start).toHaveBeenCalledTimes(1);
    expect(button('Clear area')).toBeEnabled();
  });

  it('treats an unfinished area with too few corners as not drawn yet', () => {
    renderControls(fakeArea({ points: corners(2) }));

    expect(status()).toHaveTextContent(/^Choose Draw area/);
    expect(button('Redraw area')).toBeEnabled();
  });
});
