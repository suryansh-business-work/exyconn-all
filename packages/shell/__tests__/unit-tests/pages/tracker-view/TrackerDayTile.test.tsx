import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MARK_ORDER, MARK_WORDS } from '@exyconn/tracker-core';
import { TrackerDayTile } from '@/pages/tracker-view/TrackerDayTile';
import type { TrackerDayCell } from '@/pages/tracker-view/buildTrackerMonth';
import { renderWithProviders } from '../../test-utils';
import { HOUR_MS, makeBucket } from './fixtures';

type TileProps = ComponentProps<typeof TrackerDayTile>;

/** Tuesday 3 March 2026, in the month, not today, with nothing tracked. */
function makeCell(patch: Partial<TrackerDayCell> = {}): TrackerDayCell {
  return {
    date: new Date(2026, 2, 3),
    dateKey: '2026-03-03',
    inMonth: true,
    isToday: false,
    ...patch,
  };
}

function renderTile(patch: Partial<TileProps> = {}) {
  const props: TileProps = {
    cell: makeCell(),
    selected: false,
    mark: undefined,
    offLabel: undefined,
    onSelect: vi.fn(),
    ...patch,
  };
  const view = renderWithProviders(<TrackerDayTile {...props} />);
  return { ...props, unmount: view.unmount };
}

const tile = () => screen.getByRole('button');
/** The tile's coloured face, inside the button. */
const statusBox = () => tile().firstElementChild as Element;

describe('TrackerDayTile', () => {
  it.each(MARK_ORDER)('draws a %s day with its word and icon', (mark) => {
    renderTile({ mark });

    expect(within(tile()).getByText(MARK_WORDS[mark])).toBeInTheDocument();
    expect(statusBox()).toHaveAttribute('data-status', mark);
    expect(tile().querySelector('[aria-hidden] svg')).toBeInTheDocument();
    expect(tile()).toHaveAccessibleName(`Tuesday 3 March, ${MARK_WORDS[mark]}`);
  });

  it('gives each status its own border colour, apart from an unmarked day', () => {
    const borders = new Set<string>();
    for (const mark of MARK_ORDER) {
      const { unmount } = renderTile({ mark });
      borders.add(getComputedStyle(statusBox()).borderColor);
      unmount();
    }
    renderTile();
    borders.add(getComputedStyle(statusBox()).borderColor);

    expect(borders.size).toBe(MARK_ORDER.length + 1);
  });

  it('calls an off day by its own name instead of the status word', () => {
    renderTile({ mark: 'LEAVE', offLabel: 'EL' });

    expect(within(tile()).getByText('EL')).toHaveAttribute('title', 'EL');
    expect(within(tile()).queryByText('Leave')).not.toBeInTheDocument();
    expect(tile()).toHaveAccessibleName('Tuesday 3 March, EL');
  });

  it('shows only the date on a day without a status or tracked time', () => {
    renderTile();

    expect(tile()).toHaveTextContent(/^3$/);
    expect(tile()).toHaveAccessibleName('Tuesday 3 March');
    expect(statusBox()).not.toHaveAttribute('data-status');
    expect(tile().querySelector('svg')).toBeNull();
  });

  it('counts approved off-computer work in the time worked, and activity from active and idle', () => {
    renderTile({
      mark: 'COMPLETED',
      cell: makeCell({
        bucket: makeBucket({ activeMs: 6 * HOUR_MS, idleMs: 2 * HOUR_MS, manualMs: 2 * HOUR_MS }),
      }),
    });

    expect(within(tile()).getByText('8h 0m')).toBeInTheDocument();
    expect(within(tile()).getByText('75% active')).toBeInTheDocument();
    expect(tile()).toHaveAccessibleName('Tuesday 3 March, Completed, 8h 0m');
  });

  it('reads a bucket without manual time as measured time alone', () => {
    renderTile({
      cell: makeCell({
        bucket: { ...makeBucket({ activeMs: HOUR_MS }), manualMs: undefined as unknown as number },
      }),
    });

    expect(within(tile()).getByText('1h 0m')).toBeInTheDocument();
    expect(within(tile()).getByText('100% active')).toBeInTheDocument();
  });

  it('marks the selected day as pressed and outlines it', () => {
    const { unmount } = renderTile({ selected: true });
    const selectedOutline = getComputedStyle(statusBox()).outline;
    expect(tile()).toHaveAttribute('aria-pressed', 'true');
    unmount();

    renderTile({ selected: false });
    expect(tile()).toHaveAttribute('aria-pressed', 'false');
    expect(getComputedStyle(statusBox()).outline).not.toBe(selectedOutline);
  });

  it('disables and dims a day outside the month', () => {
    renderTile({ cell: makeCell({ inMonth: false }) });

    expect(tile()).toBeDisabled();
    expect(tile()).toHaveStyle({ opacity: '0.4' });
  });

  it('bolds today only', () => {
    const { unmount } = renderTile({ cell: makeCell({ isToday: true }) });
    expect(within(tile()).getByText('3')).toHaveStyle({ fontWeight: 700 });
    unmount();

    renderTile();
    expect(within(tile()).getByText('3')).not.toHaveStyle({ fontWeight: 700 });
  });

  it('selects the day by its date key on a click', async () => {
    const { onSelect } = renderTile();

    await userEvent.click(tile());

    expect(onSelect).toHaveBeenCalledWith('2026-03-03');
  });
});
