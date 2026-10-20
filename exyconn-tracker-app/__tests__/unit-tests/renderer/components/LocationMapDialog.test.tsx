// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TrackerLocationInput } from '@shared/types';
import LocationMapDialog, {
  type LocationConfirm,
} from '../../../../src/renderer/components/LocationMapDialog';
import { button, clickElement, render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

/** Arbitrary test coordinates. */
const FIX: TrackerLocationInput = {
  lat: 12.97,
  lng: 77.59,
  accuracyM: 1234.4,
  source: 'SYSTEM',
  capturedAt: '2026-09-14T04:00:00.000Z',
};

function dialog(
  location: TrackerLocationInput | null,
  onClose = vi.fn(),
  confirm?: LocationConfirm,
) {
  return (
    <LocationMapDialog
      location={location}
      title="Your location"
      description="Is this where you are working from?"
      onClose={onClose}
      confirm={confirm}
    />
  );
}

const shown = (): HTMLElement | null => document.querySelector('[role="dialog"]');

describe('LocationMapDialog', () => {
  it('stays shut while there is no fix', async () => {
    await render(dialog(null));
    expect(shown()).toBeNull();
  });

  it('pins the fix on the one allowed map, with its accuracy rounded to a metre', async () => {
    await render(dialog(FIX));
    const frame = shown()?.querySelector('iframe');

    expect(shown()?.querySelector('h2')?.textContent).toBe('Your location');
    expect(shown()?.getAttribute('aria-labelledby')).toBe(shown()?.querySelector('h2')?.id);
    expect(frame?.getAttribute('src')).toBe(
      'https://maps.google.com/maps?q=12.97,77.59&z=16&output=embed',
    );
    expect(frame?.getAttribute('title')).toBe('Map of the location pin');
    expect(frame?.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(shown()?.textContent).toContain('Accuracy about 1,234 m');
  });

  it('only shows a pin when there is nothing to confirm, closing on Close', async () => {
    const onClose = vi.fn();
    await render(dialog(FIX, onClose));

    expect(() => button('Cancel')).toThrow('No button named "Cancel"');
    await clickElement(button('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('confirms through the given label, and backs out on Cancel', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    await render(dialog(FIX, onClose, { label: 'Confirm', busy: false, error: null, onConfirm }));

    await clickElement(button('Confirm'));
    await clickElement(button('Cancel'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(shown()?.querySelector('.MuiAlert-colorError')).toBeNull();
  });

  it('shows why the last confirm failed', async () => {
    await render(
      dialog(FIX, vi.fn(), {
        label: 'Confirm',
        busy: false,
        error: 'Portal down.',
        onConfirm: vi.fn(),
      }),
    );
    expect(shown()?.querySelector('.MuiAlert-colorError')?.textContent).toBe('Portal down.');
  });

  it('offers no way out while the confirm is on its way', async () => {
    const onClose = vi.fn();
    await render(
      dialog(FIX, onClose, { label: 'Confirm', busy: true, error: null, onConfirm: vi.fn() }),
    );

    expect(button('Cancel').disabled).toBe(true);
    expect(button('Confirm').classList.contains('MuiButton-loading')).toBe(true);
    await act(async () => {
      shown()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
