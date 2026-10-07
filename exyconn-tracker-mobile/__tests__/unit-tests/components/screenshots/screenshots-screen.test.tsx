import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScreenshotsScreen } from '../../../../src/components/screenshots/ScreenshotsScreen';
import { useCaptureSync } from '../../../../src/hooks/useCaptureSync';
import {
  adjacentDay,
  type DayRange,
  type GalleryParams,
} from '../../../../src/lib/screenshots/gallery-day';
import { renderWithProviders } from '../../test-utils';
import { router } from '../../mocks/expo-router';
import { getByA11yLabel } from '../state';

vi.mock('../../../../src/hooks/useCaptureSync', () => ({ useCaptureSync: vi.fn() }));
vi.mock('../../../../src/lib/screenshots/gallery-day', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../../src/lib/screenshots/gallery-day')>();
  return { ...actual, adjacentDay: vi.fn(actual.adjacentDay) };
});
vi.mock('../../../../src/components/screenshots/GalleryBody', () => ({
  GalleryBody: ({ range }: Readonly<{ range: DayRange }>) => (
    <div data-testid="gallery-body">{range.startISO}</div>
  ),
}));
vi.mock('../../../../src/components/screenshots/GalleryHeader', () => ({
  // Every control live, so the screen's own guards are what is under test.
  GalleryHeader: (
    props: Readonly<{
      hasNext: boolean;
      onClose: () => void;
      onPrevious: () => void;
      onNext: () => void;
    }>,
  ) => (
    <div>
      <span>{props.hasNext ? 'next day open' : 'next day locked'}</span>
      <button type="button" onClick={props.onClose}>
        Close
      </button>
      <button type="button" onClick={props.onPrevious}>
        Previous day
      </button>
      <button type="button" onClick={props.onNext}>
        Next day
      </button>
    </div>
  ),
}));

const ZONE = 'UTC';
const FEB_3 = { start: '2026-02-03T00:00:00.000Z', end: '2026-02-04T00:00:00.000Z' };

function renderScreen(params: GalleryParams) {
  renderWithProviders(<ScreenshotsScreen params={params} timezone={ZONE} />);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-02-10T12:00:00.000Z'));
  vi.mocked(useCaptureSync).mockReturnValue(false);
});

describe('ScreenshotsScreen', () => {
  it('shows the day named by the link’s bounds', () => {
    renderScreen(FEB_3);

    expect(screen.getByTestId('gallery-body')).toHaveTextContent(FEB_3.start);
    expect(screen.getByText('next day open')).toBeInTheDocument();
  });

  it('resolves a capture notification’s instant to its day', () => {
    renderScreen({ capturedAt: ['2026-02-05T08:30:00.000Z', 'ignored'] });

    expect(useCaptureSync).toHaveBeenCalledWith('2026-02-05T08:30:00.000Z');
    expect(screen.getByTestId('gallery-body')).toHaveTextContent('2026-02-05T00:00:00.000Z');
  });

  it('waits for the latest capture to upload before showing its day', () => {
    vi.mocked(useCaptureSync).mockReturnValue(true);
    renderScreen({ capturedAt: '2026-02-05T08:30:00.000Z' });

    expect(getByA11yLabel('Uploading your latest screenshot')).toBeInTheDocument();
    expect(screen.queryByTestId('gallery-body')).not.toBeInTheDocument();
  });

  it('explains a link that names no day', () => {
    renderScreen({});

    expect(screen.getByText('This link does not point at a day.')).toBeInTheDocument();
    expect(
      screen.getByText('Open a day from My Report to see its screenshots.'),
    ).toBeInTheDocument();
    expect(screen.getByText('next day locked')).toBeInTheDocument();
  });

  it('locks the next day while today is still running', () => {
    renderScreen({ start: '2026-02-10T00:00:00.000Z', end: '2026-02-11T00:00:00.000Z' });

    expect(screen.getByText('next day locked')).toBeInTheDocument();
  });

  it('pages a day either way by rewriting the route’s bounds', () => {
    renderScreen(FEB_3);

    fireEvent.click(screen.getByText('Previous day'));
    expect(router.setParams).toHaveBeenLastCalledWith({
      start: '2026-02-02T00:00:00.000Z',
      end: '2026-02-03T00:00:00.000Z',
    });
    fireEvent.click(screen.getByText('Next day'));
    expect(router.setParams).toHaveBeenLastCalledWith({
      start: '2026-02-04T00:00:00.000Z',
      end: '2026-02-05T00:00:00.000Z',
    });
  });

  it('stays put when there is no day to page from, or none to page to', () => {
    renderScreen({});
    fireEvent.click(screen.getByText('Next day'));

    vi.mocked(adjacentDay).mockReturnValueOnce(null);
    renderScreen(FEB_3);
    fireEvent.click(screen.getAllByText('Previous day')[1]);

    expect(router.setParams).not.toHaveBeenCalled();
  });

  it('goes back to where the gallery was opened from', () => {
    vi.mocked(router.canGoBack).mockReturnValue(true);
    renderScreen(FEB_3);

    fireEvent.click(screen.getByText('Close'));

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('lands on My Report when the gallery is the only screen there is', () => {
    renderScreen(FEB_3);

    fireEvent.click(screen.getByText('Close'));

    expect(router.replace).toHaveBeenCalledWith('/report');
    expect(router.back).not.toHaveBeenCalled();
  });
});
