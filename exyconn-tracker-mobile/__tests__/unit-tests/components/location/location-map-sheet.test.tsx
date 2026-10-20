import { createRef, type ComponentProps } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { HostInstance } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { LocationMapSheet } from '../../../../src/components/location/LocationMapSheet';
import { renderWithProviders } from '../../test-utils';
import { AccessibilityInfo } from '../../mocks/react-native/apis';

// The sheet's Modal, wrapped so the animation it was asked for can be read.
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

/** Arbitrary test coordinates. */
const PIN = { lat: 12.97, lng: 77.59, accuracyM: 20 };

function renderSheet(onConfirm?: () => void) {
  const onClose = vi.fn();
  renderWithProviders(
    <LocationMapSheet
      pin={PIN}
      description="Where you are now"
      onClose={onClose}
      onConfirm={onConfirm}
      returnFocusTo={createRef<HostInstance>()}
    />,
  );
  return { onClose };
}

describe('LocationMapSheet', () => {
  it('slides up, and only shows a pin when there is nothing to confirm', () => {
    const { onClose } = renderSheet();

    expect(screen.getByTestId('modal-animation')).toHaveAttribute('data-animation', 'slide');
    expect(screen.getByText('Where you are now')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('asks to confirm the pin when marking attendance, with Cancel as the way out', () => {
    const onConfirm = vi.fn();
    renderSheet(onConfirm);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.queryByText('Close')).toBeNull();
  });

  it('appears without the slide when the phone asks for reduced motion', async () => {
    AccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);
    renderSheet();

    await waitFor(() =>
      expect(screen.getByTestId('modal-animation')).toHaveAttribute('data-animation', 'none'),
    );
  });
});
