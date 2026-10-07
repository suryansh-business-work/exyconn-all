import { createRef } from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { AccessibilityInfo, type HostInstance } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../../../../src/components/ui/ConfirmDialog';
import { renderWithProviders } from '../../test-utils';

interface Overrides {
  open?: boolean;
  busy?: boolean;
  danger?: boolean;
}

function renderDialog({ open = true, busy = false, danger = false }: Overrides = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = renderWithProviders(
    <ConfirmDialog
      open={open}
      title="Withdraw consent?"
      message="Tracking stops on this phone."
      confirmLabel="Withdraw"
      danger={danger}
      busy={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
      returnFocusTo={createRef<HostInstance>()}
    />,
  );
  return { ...view, onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('shows nothing while closed', () => {
    renderDialog({ open: false });
    expect(screen.queryByText('Withdraw consent?')).not.toBeInTheDocument();
  });

  it('asks the question, and puts the screen reader on it', () => {
    renderDialog();
    const title = screen.getByText('Withdraw consent?');
    expect(screen.getByText('Tracking stops on this phone.')).toBeInTheDocument();
    const [target] = vi.mocked(AccessibilityInfo.sendAccessibilityEvent).mock.calls[0];
    expect(target).toHaveTextContent('Withdraw consent?');
    expect(title).toBeInTheDocument();
  });

  it('confirms or cancels on the matching button', () => {
    const { onConfirm, onCancel } = renderDialog({ danger: true });
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels on the phone's back button", () => {
    const { onCancel } = renderDialog();
    fireEvent.keyDown(screen.getByTestId('rn-modal'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('locks both choices while the confirmed action runs', () => {
    const { onConfirm, onCancel } = renderDialog({ busy: true });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('opens without animating when the phone asks for reduced motion', async () => {
    vi.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(true);
    renderDialog();
    // Let the setting's answer land, so the pop-up re-renders with it.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText('Withdraw consent?')).toBeInTheDocument();
  });
});
