import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerScreenshotGallery } from '@/pages/tracker-view/TrackerScreenshotGallery';
import { renderWithProviders } from '../../../test-utils';
import { echoFormat, makeShot } from '../fixtures';

const formatTime = (value: string) => `hour ${value}`;

function renderGallery(screenshots = [makeShot()]) {
  return renderWithProviders(
    <TrackerScreenshotGallery
      screenshots={screenshots}
      timezone="UTC"
      formatTime={formatTime}
      formatDateTime={echoFormat}
    />,
  );
}

describe('TrackerScreenshotGallery', () => {
  it('says so when nothing was captured, counting unparseable shots as nothing', () => {
    renderGallery([makeShot({ capturedAt: 'not a time' })]);

    expect(screen.getByText('No screenshots captured.')).toBeInTheDocument();
  });

  it('groups the day by hour and opens, pages and closes the full-screen viewer', async () => {
    renderGallery([
      makeShot({ id: 'late', capturedAt: '2026-02-03T10:15:00.000Z' }),
      makeShot({ id: 'early', capturedAt: '2026-02-03T09:05:00.000Z' }),
      makeShot({ id: 'mid', capturedAt: '2026-02-03T09:45:00.000Z' }),
    ]);

    expect(screen.getByText('hour 2026-02-03T09:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('hour 2026-02-03T10:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('2 screenshots')).toBeInTheDocument();
    expect(screen.getByText('1 screenshot')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Open screenshot from at 2026-02-03T10:15:00.000Z' }),
    );
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next screenshot' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
