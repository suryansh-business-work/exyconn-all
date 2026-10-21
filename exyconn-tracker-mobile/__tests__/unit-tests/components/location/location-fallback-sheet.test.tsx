import { createRef, type ComponentProps } from 'react';
import { screen, waitFor } from '@testing-library/react';
import type { HostInstance } from 'react-native';
import { TrackerLocationError } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { LocationFallbackSheet } from '../../../../src/components/location/LocationFallbackSheet';
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

function renderSheet(failure: string) {
  renderWithProviders(
    <LocationFallbackSheet
      failure={failure}
      profileAddress={null}
      marking={null}
      error={null}
      onRetry={vi.fn()}
      onFallback={vi.fn()}
      onClose={vi.fn()}
      returnFocusTo={createRef<HostInstance>()}
    />,
  );
}

describe('LocationFallbackSheet', () => {
  it('slides in, and shows no details line when the platform gave no reason', () => {
    renderSheet(new TrackerLocationError().message);
    expect(screen.getByTestId('modal-animation')).toHaveAttribute('data-animation', 'slide');
    expect(screen.getByText('Your location could not be read.')).toBeInTheDocument();
    expect(screen.queryByText(/^Details:/)).toBeNull();
  });

  it('appears without the slide when the phone asks for reduced motion', async () => {
    AccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);
    renderSheet(new TrackerLocationError('Location permission denied').message);
    await waitFor(() =>
      expect(screen.getByTestId('modal-animation')).toHaveAttribute('data-animation', 'none'),
    );
  });
});
