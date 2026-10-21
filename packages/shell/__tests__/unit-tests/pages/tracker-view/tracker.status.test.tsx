import { afterEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { MARK_ORDER } from '@exyconn/tracker-core';
import { TRACKER_STATUS_TINT_ALPHA, trackerDayStatus } from '@exyconn/ui';
import { STATUS_ICONS, useStatusColors } from '@/pages/tracker-view/tracker.status';
import { renderWithProviders } from '../../test-utils';

const MODE_KEY = 'exyconn-track.color-mode';

/** Prints each status's hue and tint, so a test can read what the hook resolved. */
function StatusColorsProbe() {
  const colors = useStatusColors();
  return (
    <ul>
      {MARK_ORDER.map((mark) => (
        <li key={mark} data-testid={mark}>
          {JSON.stringify(colors(mark))}
        </li>
      ))}
    </ul>
  );
}

const resolved = (mark: string) => JSON.parse(screen.getByTestId(mark).textContent ?? '{}');

describe('useStatusColors', () => {
  afterEach(() => {
    localStorage.removeItem(MODE_KEY);
  });

  it.each(['light', 'dark'] as const)(
    "gives every status the %s mode's hue and a tint of it",
    (mode) => {
      localStorage.setItem(MODE_KEY, mode);
      renderWithProviders(<StatusColorsProbe />);

      for (const mark of MARK_ORDER) {
        const hue = trackerDayStatus[mode][mark];
        expect(resolved(mark)).toEqual({ hue, tint: `${hue}${TRACKER_STATUS_TINT_ALPHA}` });
      }
    },
  );

  it('changes the hues with the colour mode', () => {
    localStorage.setItem(MODE_KEY, 'dark');
    renderWithProviders(<StatusColorsProbe />);

    expect(resolved('COMPLETED').hue).not.toBe(trackerDayStatus.light.COMPLETED);
  });
});

describe('STATUS_ICONS', () => {
  it('has a distinct icon for every status', () => {
    const icons = new Set(MARK_ORDER.map((mark) => STATUS_ICONS[mark].type));
    expect(icons.size).toBe(MARK_ORDER.length);
  });
});
