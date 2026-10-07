import { createRef, type ComponentProps } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { formatDateTime } from '@exyconn/tracker-core';
import type { HostInstance } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { ScreenshotLightbox } from '../../../../src/components/screenshots/ScreenshotLightbox';
import { renderWithProviders } from '../../test-utils';
import { AccessibilityInfo } from '../../mocks/react-native/apis';
import { getByA11yLabel, queryByA11yLabel } from '../state';
import { screenshot } from '../report/fixtures';

// The viewer's Modal, wrapped so the animation it was asked for can be read.
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../mocks/react-native/index')>();
  const { Modal } = actual;
  function AnimatedModal(props: Readonly<ComponentProps<typeof Modal>>) {
    return (
      <div data-testid="modal-animation" data-animation={props.animationType}>
        <Modal {...props} />
      </div>
    );
  }
  return { ...actual, Modal: AnimatedModal };
});

const ZONE = 'UTC';
const SHOTS = [
  screenshot('shot-1', '2026-02-03T10:42:00.000Z', { blurred: true, activityPercent: 30 }),
  screenshot('shot-2', '2026-02-03T11:42:00.000Z'),
];
const SPINNER = 'Loading the screenshot';

function renderLightbox(index: number | null, open = true, shots = SHOTS) {
  const onClose = vi.fn();
  const onNavigate = vi.fn();
  renderWithProviders(
    <ScreenshotLightbox
      shots={shots}
      index={index}
      open={open}
      timezone={ZONE}
      onClose={onClose}
      onNavigate={onNavigate}
      returnFocusTo={createRef<HostInstance>()}
    />,
  );
  return { onClose, onNavigate };
}

describe('ScreenshotLightbox', () => {
  it('shows nothing before a shot has been opened', () => {
    renderLightbox(null);

    expect(screen.queryByTestId('rn-modal')).not.toBeInTheDocument();
  });

  it('shows nothing for a shot the day no longer holds', () => {
    renderLightbox(5);

    expect(screen.queryByTestId('rn-modal')).not.toBeInTheDocument();
  });

  it('shows the shot full size with when it was taken, its activity and its blur', () => {
    renderLightbox(0);

    const when = formatDateTime(SHOTS[0].capturedAt, ZONE);
    expect(getByA11yLabel('Screenshot, full screen')).toBeInTheDocument();
    expect(screen.getByText(when)).toBeInTheDocument();
    expect(screen.getByText('30% active')).toBeInTheDocument();
    expect(screen.getByText('Blurred')).toBeInTheDocument();
    expect(screen.getByAltText(`Screenshot captured at ${when}, full screen`)).toHaveAttribute(
      'src',
      SHOTS[0].imageUrl,
    );
  });

  it('puts the screen reader on the capture time as it opens', () => {
    renderLightbox(0);

    expect(AccessibilityInfo.sendAccessibilityEvent).toHaveBeenCalledWith(
      screen.getByText(formatDateTime(SHOTS[0].capturedAt, ZONE)),
      'focus',
    );
  });

  it('spins over the image until it has loaded', () => {
    renderLightbox(0);

    expect(getByA11yLabel(SPINNER)).toBeInTheDocument();
    fireEvent.load(screen.getByRole('img', { name: /full screen$/ }));
    expect(queryByA11yLabel(SPINNER)).toBeNull();
  });

  it('stops spinning when the image fails too', () => {
    renderLightbox(0);

    fireEvent.error(screen.getByRole('img', { name: /full screen$/ }));
    expect(queryByA11yLabel(SPINNER)).toBeNull();
  });

  it('pages through the day, wrapping at either end', () => {
    const { onNavigate } = renderLightbox(0);

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onNavigate).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onNavigate).toHaveBeenLastCalledWith(1);
  });

  it('has no paging for a day with a single shot', () => {
    renderLightbox(0, true, [SHOTS[1]]);

    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('closes from its button and from the back gesture', () => {
    const { onClose } = renderLightbox(1);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(screen.getByTestId('rn-modal'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('hides the viewer once closed', () => {
    renderLightbox(1, false);

    expect(screen.queryByTestId('rn-modal')).not.toBeInTheDocument();
  });

  it('fades in and out by default', () => {
    renderLightbox(0);

    expect(screen.getByTestId('modal-animation')).toHaveAttribute('data-animation', 'fade');
  });

  it('appears without the fade when the phone asks for reduced motion', async () => {
    AccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);
    renderLightbox(0);

    await waitFor(() =>
      expect(screen.getByTestId('modal-animation')).toHaveAttribute('data-animation', 'none'),
    );
  });
});
