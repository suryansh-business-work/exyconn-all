import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerScreenshotLightbox } from '@/pages/tracker-view/TrackerScreenshotGallery/TrackerScreenshotLightbox';
import { renderWithProviders } from '../../../test-utils';
import { echoFormat, makeShot } from '../fixtures';

const shots = [
  makeShot({ id: 'a', capturedAt: '2026-02-03T09:00:00.000Z', imageUrl: 'https://img.test/a.png' }),
  makeShot({ id: 'b', capturedAt: '2026-02-03T09:10:00.000Z', blurred: true }),
  makeShot({ id: 'c', capturedAt: '2026-02-03T09:20:00.000Z' }),
];

function renderLightbox(index: number | null, list = shots) {
  const onClose = vi.fn();
  const onNavigate = vi.fn();
  const view = renderWithProviders(
    <TrackerScreenshotLightbox
      shots={list}
      index={index}
      formatDateTime={echoFormat}
      onClose={onClose}
      onNavigate={onNavigate}
    />,
  );
  return { onClose, onNavigate, view };
}

describe('TrackerScreenshotLightbox', () => {
  it('renders nothing while closed, or for a position with no shot', () => {
    renderLightbox(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    renderLightbox(7);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the shot full screen with when it was taken and where it sits in the day', () => {
    renderLightbox(0);

    expect(screen.getByRole('dialog', { name: 'Screenshot, full screen' })).toBeInTheDocument();
    expect(screen.getByText('at 2026-02-03T09:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(
      screen.getByAltText('Screenshot captured at 2026-02-03T09:00:00.000Z, full screen'),
    ).toHaveAttribute('src', 'https://img.test/a.png');
    expect(screen.queryByText('Blurred')).not.toBeInTheDocument();
  });

  it('marks a blurred capture', () => {
    renderLightbox(1);
    expect(screen.getByText('Blurred')).toBeInTheDocument();
  });

  it('pages with the buttons, wrapping at both ends', async () => {
    const { onNavigate } = renderLightbox(0);

    await userEvent.click(screen.getByRole('button', { name: 'Previous screenshot' }));
    expect(onNavigate).toHaveBeenLastCalledWith(2);
    await userEvent.click(screen.getByRole('button', { name: 'Next screenshot' }));
    expect(onNavigate).toHaveBeenLastCalledWith(1);
  });

  it('pages with the arrow keys, ignores other keys and stops listening once closed', () => {
    const { onNavigate, view } = renderLightbox(2);

    fireEvent.keyDown(globalThis.window, { key: 'ArrowRight' });
    expect(onNavigate).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(globalThis.window, { key: 'ArrowLeft' });
    expect(onNavigate).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(globalThis.window, { key: 'Enter' });
    expect(onNavigate).toHaveBeenCalledTimes(2);

    view.unmount();
    fireEvent.keyDown(globalThis.window, { key: 'ArrowRight' });
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });

  it('closes from the close button', async () => {
    const { onClose } = renderLightbox(0);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has no paging for a single shot', () => {
    const { onNavigate } = renderLightbox(0, [shots[0]]);

    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next screenshot' })).not.toBeInTheDocument();
    fireEvent.keyDown(globalThis.window, { key: 'ArrowRight' });
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it('does not page an empty day even when asked to open a position', () => {
    const { onNavigate } = renderLightbox(0, []);

    fireEvent.keyDown(globalThis.window, { key: 'ArrowRight' });
    expect(onNavigate).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
