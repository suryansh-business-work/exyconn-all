import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerScreenshotHour } from '@/pages/tracker-view/TrackerScreenshotGallery/TrackerScreenshotHour';
import type { ScreenshotHour } from '@/pages/tracker-view/TrackerScreenshotGallery';
import type { TrackerScreenshotData } from '@/pages/tracker-view/tracker.types';
import { renderWithProviders } from '../../../test-utils';
import { echoFormat, makeShot } from '../fixtures';

function renderHour(hour: ScreenshotHour<TrackerScreenshotData>) {
  const onOpen = vi.fn();
  const formatTime = vi.fn((value: string) => `time ${value}`);
  renderWithProviders(
    <TrackerScreenshotHour
      hour={hour}
      formatTime={formatTime}
      formatDateTime={echoFormat}
      onOpen={onOpen}
    />,
  );
  return { onOpen, formatTime };
}

describe('TrackerScreenshotHour', () => {
  it('heads the hour with its start, in the workspace time format, and a singular count', () => {
    const { formatTime } = renderHour({
      key: '2026-02-03 09',
      startsAt: '2026-02-03T09:00:00.000Z',
      firstIndex: 0,
      shots: [makeShot()],
    });

    expect(formatTime).toHaveBeenCalledWith('2026-02-03T09:00:00.000Z');
    expect(screen.getByText('time 2026-02-03T09:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('1 screenshot')).toBeInTheDocument();
    expect(screen.queryByText('Blurred')).not.toBeInTheDocument();
  });

  it('counts several shots, marks the blurred one and opens a shot at its place in the day', async () => {
    const { onOpen } = renderHour({
      key: '2026-02-03 10',
      startsAt: '2026-02-03T10:00:00.000Z',
      firstIndex: 4,
      shots: [
        makeShot({ id: 'a', capturedAt: '2026-02-03T10:01:00.000Z', activityPercent: 10 }),
        makeShot({ id: 'b', capturedAt: '2026-02-03T10:11:00.000Z', blurred: true }),
      ],
    });

    expect(screen.getByText('2 screenshots')).toBeInTheDocument();
    expect(screen.getAllByText('Blurred')).toHaveLength(1);
    expect(screen.getByRole('progressbar', { name: 'Activity 10%' })).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Open screenshot from at 2026-02-03T10:11:00.000Z' }),
    );
    expect(onOpen).toHaveBeenCalledWith(5);
  });
});
