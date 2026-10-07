import { fireEvent, screen } from '@testing-library/react';
import { formatDayInZone, offsetLabel } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { GalleryHeader } from '../../../../src/components/screenshots/GalleryHeader';
import type { DayRange } from '../../../../src/lib/screenshots/gallery-day';
import { renderWithProviders } from '../../test-utils';
import { AccessibilityInfo } from '../../mocks/react-native/apis';

const ZONE = 'Asia/Kolkata';
/** 3 Feb 2026 in Kolkata, midnight to midnight. */
const FEB_3: DayRange = {
  startISO: '2026-02-02T18:30:00.000Z',
  endISO: '2026-02-03T18:30:00.000Z',
};
const FEB_4: DayRange = {
  startISO: '2026-02-03T18:30:00.000Z',
  endISO: '2026-02-04T18:30:00.000Z',
};
const ZONE_LINE = `times shown in ${ZONE} (${offsetLabel(ZONE)})`;

function renderHeader(range: DayRange | null, hasNext: boolean) {
  const handlers = { onClose: vi.fn(), onPrevious: vi.fn(), onNext: vi.fn() };
  const view = renderWithProviders(
    <GalleryHeader range={range} timezone={ZONE} hasNext={hasNext} {...handlers} />,
  );
  return { ...handlers, rerender: view.rerender };
}

describe('GalleryHeader', () => {
  it('names the day and the zone every time below is read in', () => {
    renderHeader(FEB_3, true);

    expect(screen.getByText('My screenshots')).toBeInTheDocument();
    expect(
      screen.getByText(`${formatDayInZone(FEB_3.startISO, ZONE)} · ${ZONE_LINE}`),
    ).toBeInTheDocument();
  });

  it('pages to the day before and the day after, and closes', () => {
    const { onClose, onPrevious, onNext } = renderHeader(FEB_3, true);

    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close my screenshots' }));

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cannot page into a day that has not begun', () => {
    const { onNext } = renderHeader(FEB_3, false);

    const next = screen.getByRole('button', { name: 'Next day' });
    expect(next).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(next);
    expect(onNext).not.toHaveBeenCalled();
  });

  it('still names the zone when the link named no day, with nowhere to page', () => {
    const { onPrevious } = renderHeader(null, false);

    expect(screen.getByText(ZONE_LINE)).toBeInTheDocument();
    const previous = screen.getByRole('button', { name: 'Previous day' });
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(previous);
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it('tells VoiceOver the new day after paging', () => {
    const { rerender } = renderHeader(FEB_3, true);

    rerender(
      <GalleryHeader
        range={FEB_4}
        timezone={ZONE}
        hasNext={false}
        onClose={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      `${formatDayInZone(FEB_4.startISO, ZONE)} · ${ZONE_LINE}`,
    );
  });
});
