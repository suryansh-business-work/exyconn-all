import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PushToast, type ArrivedToast } from '../../../../../src/components/wa/chat/PushToast';
import { renderWithProviders } from '../../../test-utils';
import { bundle } from '../wa-ui.fixtures';

const TOAST: ArrivedToast = { id: 't-1', demoKey: 'clinic', text: 'Your reminder is due' };

function renderToast(toast: ArrivedToast | null, withBundle = true) {
  const props = { onOpen: vi.fn(), onClose: vi.fn() };
  renderWithProviders(
    <PushToast toast={toast} bundle={withBundle ? bundle() : undefined} {...props} />,
  );
  return { ...props, user: userEvent.setup() };
}

describe('PushToast', () => {
  it('shows who wrote and what, and opens that chat when tapped', async () => {
    const { user, onOpen, onClose } = renderToast(TOAST);
    const banner = screen.getByRole('button', { name: 'New message from City Clinic' });
    expect(banner).toHaveTextContent('City Clinic');
    expect(banner).toHaveTextContent('Your reminder is due');
    await user.click(banner);
    expect(onOpen).toHaveBeenCalledWith('clinic');
    expect(onClose).toHaveBeenCalled();
  });

  it('stays hidden without a toast', () => {
    renderToast(null);
    expect(screen.queryByRole('button', { name: /New message from/ })).not.toBeInTheDocument();
  });

  it('stays hidden when the chat it belongs to is not in the catalog', () => {
    renderToast(TOAST, false);
    expect(screen.queryByText('Your reminder is due')).not.toBeInTheDocument();
  });

  it('hides itself after six seconds', () => {
    vi.useFakeTimers();
    try {
      const onClose = vi.fn();
      renderWithProviders(
        <PushToast toast={TOAST} bundle={bundle()} onOpen={vi.fn()} onClose={onClose} />,
      );
      vi.advanceTimersByTime(5999);
      expect(onClose).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(onClose).toHaveBeenCalledWith(null, 'timeout');
    } finally {
      vi.useRealTimers();
    }
  });
});
