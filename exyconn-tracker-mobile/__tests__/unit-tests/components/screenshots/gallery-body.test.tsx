import { fireEvent, screen } from '@testing-library/react';
import { formatDateTime } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GalleryBody } from '../../../../src/components/screenshots/GalleryBody';
import { useDayDetail, type DayQuery } from '../../../../src/hooks/useMyDay';
import { renderWithProviders } from '../../test-utils';
import { rnTest } from '../../mocks/react-native/apis';
import { getByA11yLabel } from '../state';
import { dayDetail, screenshot } from '../report/fixtures';

vi.mock('../../../../src/hooks/useMyDay', () => ({ useDayDetail: vi.fn() }));

const ZONE = 'UTC';
const RANGE = { startISO: '2026-02-03T00:00:00.000Z', endISO: '2026-02-04T00:00:00.000Z' };
const SHOTS = [
  screenshot('shot-1', '2026-02-03T09:00:00.000Z'),
  screenshot('shot-2', '2026-02-03T10:00:00.000Z'),
];

function query(overrides: Partial<DayQuery> = {}): DayQuery {
  return {
    detail: dayDetail({ screenshots: SHOTS }),
    loading: false,
    refreshing: false,
    error: null,
    reload: () => undefined,
    ...overrides,
  };
}

function openerOf(iso: string): HTMLElement {
  return screen.getByRole('button', {
    name: `Open the screenshot captured at ${formatDateTime(iso, ZONE)} full screen`,
  });
}

beforeEach(() => {
  vi.mocked(useDayDetail).mockReturnValue(query());
});

describe('GalleryBody', () => {
  it('reads the day by the bounds it was handed', () => {
    renderWithProviders(<GalleryBody range={RANGE} timezone={ZONE} />);

    expect(useDayDetail).toHaveBeenCalledWith(RANGE.startISO, RANGE.endISO);
  });

  it('heads the day’s shots with their count and lists each one', () => {
    renderWithProviders(<GalleryBody range={RANGE} timezone={ZONE} />);

    expect(screen.getByText('2 captured')).toBeInTheDocument();
    expect(openerOf(SHOTS[0].capturedAt)).toBeInTheDocument();
    expect(openerOf(SHOTS[1].capturedAt)).toBeInTheDocument();
  });

  it('holds the shots’ places while the day loads', () => {
    vi.mocked(useDayDetail).mockReturnValue(query({ detail: null, loading: true }));
    renderWithProviders(<GalleryBody range={RANGE} timezone={ZONE} />);

    expect(getByA11yLabel('Loading your screenshots')).toBeInTheDocument();
    expect(screen.queryByText(/captured$/)).not.toBeInTheDocument();
  });

  it('says why the day could not be loaded', () => {
    vi.mocked(useDayDetail).mockReturnValue(
      query({ detail: null, error: 'Screenshots could not be loaded.' }),
    );
    renderWithProviders(<GalleryBody range={RANGE} timezone={ZONE} />);

    expect(screen.getByText('Screenshots could not be loaded.')).toBeInTheDocument();
  });

  it('opens a shot full screen, pages to the next and closes the viewer', () => {
    renderWithProviders(<GalleryBody range={RANGE} timezone={ZONE} />);
    expect(screen.queryByTestId('rn-modal')).not.toBeInTheDocument();

    fireEvent.click(openerOf(SHOTS[0].capturedAt));
    expect(screen.getByTestId('rn-modal')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('rn-modal')).not.toBeInTheDocument();
  });

  it('keeps every shot on a tablet’s wider grid', () => {
    rnTest.dimensions({ width: 1024 });
    renderWithProviders(<GalleryBody range={RANGE} timezone={ZONE} />);

    expect(openerOf(SHOTS[0].capturedAt)).toBeInTheDocument();
    expect(openerOf(SHOTS[1].capturedAt)).toBeInTheDocument();
  });
});
